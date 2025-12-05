-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  university TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'university')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts history
CREATE TABLE public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback JSONB,
  improved_prompt TEXT,
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disclosures
CREATE TABLE public.disclosures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_tools_used TEXT[],
  purpose TEXT,
  description TEXT,
  prompts_used TEXT[],
  output_usage TEXT,
  formatted_disclosure TEXT,
  template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking (for rate limiting & analytics)
CREATE TABLE public.usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('prompt_coach', 'disclosure', 'grammar', 'research')),
  count INTEGER DEFAULT 1,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, period)
);

-- Subscriptions (synced with Stripe)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('premium', 'university')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX idx_disclosures_user_id ON public.disclosures(user_id);
CREATE INDEX idx_disclosures_created_at ON public.disclosures(created_at DESC);
CREATE INDEX idx_usage_user_feature_period ON public.usage(user_id, feature, period);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for prompts
CREATE POLICY "Users can view own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for disclosures
CREATE POLICY "Users can view own disclosures" ON public.disclosures
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disclosures" ON public.disclosures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own disclosures" ON public.disclosures
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for usage
CREATE POLICY "Users can view own usage" ON public.usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to increment usage count (upsert)
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_period TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage (user_id, feature, period, count)
  VALUES (p_user_id, p_feature, p_period, 1)
  ON CONFLICT (user_id, feature, period)
  DO UPDATE SET count = usage.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
