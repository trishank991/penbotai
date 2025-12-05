-- Migration: Add tables for premium features
-- Run this in Supabase SQL Editor

-- 1. Prompts history table (for Prompt Coach history)
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_prompt TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback JSONB, -- {clarity: 80, specificity: 70, context: 90, structure: 85, suggestions: [...]}
  improved_prompt TEXT,
  ai_model TEXT, -- 'chatgpt', 'claude', 'gemini', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Saved papers / Research library
CREATE TABLE IF NOT EXISTS public.saved_papers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  year INTEGER,
  abstract TEXT,
  url TEXT,
  doi TEXT,
  journal TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  citation_count INTEGER,
  source TEXT DEFAULT 'semantic_scholar', -- 'semantic_scholar', 'openalex', 'manual'
  external_id TEXT, -- ID from the source API
  tags TEXT[],
  notes TEXT,
  folder TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Teams table (for institutional accounts)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  institution TEXT,
  plan TEXT DEFAULT 'team' CHECK (plan IN ('team', 'enterprise')),
  max_members INTEGER DEFAULT 50,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 5. Team invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. API keys for external access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Store hashed version of the key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "sk_live_a1b2")
  scopes TEXT[] DEFAULT ARRAY['disclosure:read', 'disclosure:write'],
  rate_limit INTEGER DEFAULT 100, -- requests per hour
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. API usage logs
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LMS integrations config
CREATE TABLE IF NOT EXISTS public.lms_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('canvas', 'blackboard', 'moodle', 'google_classroom')),
  provider_url TEXT, -- e.g., 'https://myuniversity.instructure.com'
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lms_owner CHECK (team_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Enable RLS on all new tables
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Prompts: Users can only access their own
CREATE POLICY "Users can view own prompts" ON public.prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

-- Saved papers: Users can only access their own
CREATE POLICY "Users can view own saved papers" ON public.saved_papers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved papers" ON public.saved_papers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved papers" ON public.saved_papers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved papers" ON public.saved_papers FOR DELETE USING (auth.uid() = user_id);

-- Teams: Members can view their teams
CREATE POLICY "Team members can view teams" ON public.teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );
CREATE POLICY "Owners can update teams" ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Team members: Members can view their team's members
CREATE POLICY "Team members can view team members" ON public.team_members FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Team admins can manage members" ON public.team_members FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Team invitations: Admins can manage
CREATE POLICY "Team admins can view invitations" ON public.team_invitations FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
CREATE POLICY "Team admins can create invitations" ON public.team_invitations FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- API keys: Users can manage their own
CREATE POLICY "Users can view own API keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- API logs: Users can view logs for their keys
CREATE POLICY "Users can view own API logs" ON public.api_logs FOR SELECT
  USING (api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid()));

-- LMS integrations: Users can manage their own
CREATE POLICY "Users can view own LMS integrations" ON public.lms_integrations FOR SELECT
  USING (user_id = auth.uid() OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own LMS integrations" ON public.lms_integrations FOR ALL
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_papers_user_id ON public.saved_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_papers_folder ON public.saved_papers(user_id, folder);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_id ON public.api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);

-- Grant permissions
GRANT ALL ON public.prompts TO authenticated;
GRANT ALL ON public.saved_papers TO authenticated;
GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.team_members TO authenticated;
GRANT ALL ON public.team_invitations TO authenticated;
GRANT ALL ON public.api_keys TO authenticated;
GRANT ALL ON public.api_logs TO authenticated;
GRANT ALL ON public.lms_integrations TO authenticated;
