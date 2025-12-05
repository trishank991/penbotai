-- ScholarSync Gamification System
-- XP, Levels, Badges, Streaks, Achievements

-- ==================== USER XP & LEVELS ====================

CREATE TABLE IF NOT EXISTS public.user_gamification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- XP and Level
  total_xp INTEGER DEFAULT 0 NOT NULL CHECK (total_xp >= 0),
  current_level INTEGER DEFAULT 1 NOT NULL CHECK (current_level >= 1 AND current_level <= 10),

  -- Streaks
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  last_activity_date DATE,

  -- High Scores
  highest_prompt_score INTEGER DEFAULT 0 CHECK (highest_prompt_score >= 0 AND highest_prompt_score <= 100),
  highest_audit_score INTEGER DEFAULT 0 CHECK (highest_audit_score >= 0 AND highest_audit_score <= 100),

  -- Stats
  total_prompts_analyzed INTEGER DEFAULT 0 NOT NULL,
  total_disclosures_generated INTEGER DEFAULT 0 NOT NULL,
  total_audits_completed INTEGER DEFAULT 0 NOT NULL,
  total_research_queries INTEGER DEFAULT 0 NOT NULL,
  total_papers_saved INTEGER DEFAULT 0 NOT NULL,
  total_grammar_checks INTEGER DEFAULT 0 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==================== XP TRANSACTIONS ====================

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Transaction details
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  description TEXT,

  -- Reference to originating record (optional)
  reference_type TEXT, -- 'prompt', 'disclosure', 'audit', 'research', 'badge'
  reference_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==================== BADGES ====================

-- Available badges definition
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('skill', 'streak', 'special', 'milestone')),
  icon TEXT NOT NULL, -- Emoji or icon identifier
  xp_reward INTEGER DEFAULT 0 NOT NULL,

  -- Unlock conditions (stored as JSON for flexibility)
  unlock_condition JSONB NOT NULL,

  -- Display order
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,

  -- When earned
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Optional: what triggered it
  trigger_reference_type TEXT,
  trigger_reference_id UUID,

  -- Prevent duplicate badges
  UNIQUE(user_id, badge_id)
);

-- ==================== DAILY CHALLENGES ====================

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Challenge definition
  challenge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,

  -- Target (e.g., analyze 3 prompts)
  target_action TEXT NOT NULL,
  target_count INTEGER DEFAULT 1 NOT NULL,

  -- Active date
  active_date DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(challenge_type, active_date)
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,

  -- Progress
  current_count INTEGER DEFAULT 0 NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, challenge_id)
);

-- ==================== LEVEL DEFINITIONS ====================

-- Store level requirements for easy updating
CREATE TABLE IF NOT EXISTS public.level_definitions (
  level INTEGER PRIMARY KEY CHECK (level >= 1 AND level <= 10),
  title TEXT NOT NULL,
  xp_required INTEGER NOT NULL CHECK (xp_required >= 0),
  unlock_description TEXT
);

-- Insert level definitions
INSERT INTO public.level_definitions (level, title, xp_required, unlock_description) VALUES
  (1, 'AI Novice', 0, 'Basic features'),
  (2, 'Prompt Learner', 100, 'Daily challenges'),
  (3, 'AI Explorer', 300, 'Prompt templates'),
  (4, 'Disclosure Pro', 600, 'Advanced analytics'),
  (5, 'Prompt Engineer', 1000, 'Badge showcase'),
  (6, 'AI Advocate', 1500, 'Beta features'),
  (7, 'Ethics Champion', 2500, 'Community features'),
  (8, 'Master Prompter', 4000, 'Mentorship access'),
  (9, 'AI Scholar', 6000, 'Exclusive content'),
  (10, 'ScholarSync Legend', 10000, 'Lifetime benefits')
ON CONFLICT (level) DO NOTHING;

-- ==================== SEED BADGES ====================

INSERT INTO public.badges (id, name, description, category, icon, xp_reward, unlock_condition, sort_order) VALUES
  -- Skill Badges
  ('first_prompt', 'First Step', 'Analyze your first prompt', 'skill', '🎯', 10, '{"action": "prompt_analyze", "count": 1}', 1),
  ('perfect_prompt', 'Perfect Prompt', 'Score 90+ on a prompt analysis', 'skill', '✨', 50, '{"action": "prompt_score", "min_score": 90}', 2),
  ('prompt_master', 'Prompt Master', 'Analyze 50 prompts', 'skill', '🎓', 100, '{"action": "prompt_analyze", "count": 50}', 3),
  ('first_disclosure', 'Transparent', 'Generate your first disclosure', 'skill', '📝', 10, '{"action": "disclosure_generate", "count": 1}', 4),
  ('disclosure_master', 'Disclosure Master', 'Generate 10 disclosures', 'skill', '📜', 50, '{"action": "disclosure_generate", "count": 10}', 5),
  ('first_audit', 'Self-Aware', 'Complete your first assignment audit', 'skill', '🔍', 15, '{"action": "audit_complete", "count": 1}', 6),
  ('audit_ace', 'Audit Ace', 'Score 95+ on an assignment audit', 'skill', '🏆', 100, '{"action": "audit_score", "min_score": 95}', 7),
  ('improver', 'Improver', 'Improve audit score by 15+ points on re-audit', 'skill', '📈', 75, '{"action": "audit_improve", "min_improvement": 15}', 8),
  ('requirements_master', 'Requirements Master', 'Meet 100% of requirements on an audit', 'skill', '✅', 100, '{"action": "audit_requirements", "percentage": 100}', 9),
  ('research_pro', 'Research Pro', 'Save 50 research papers', 'skill', '📚', 100, '{"action": "papers_saved", "count": 50}', 10),
  ('grammar_guru', 'Grammar Guru', 'Complete 100 grammar checks', 'skill', '✍️', 75, '{"action": "grammar_check", "count": 100}', 11),

  -- Streak Badges
  ('streak_7', 'Weekly Warrior', '7-day activity streak', 'streak', '🔥', 50, '{"action": "streak", "days": 7}', 20),
  ('streak_30', 'Monthly Master', '30-day activity streak', 'streak', '💪', 150, '{"action": "streak", "days": 30}', 21),
  ('streak_100', 'Century Club', '100-day activity streak', 'streak', '🌟', 500, '{"action": "streak", "days": 100}', 22),

  -- Milestone Badges
  ('level_5', 'Rising Star', 'Reach Level 5', 'milestone', '⭐', 100, '{"action": "level_reach", "level": 5}', 30),
  ('level_10', 'Legend', 'Reach Level 10', 'milestone', '👑', 500, '{"action": "level_reach", "level": 10}', 31),
  ('xp_1000', 'XP Hunter', 'Earn 1000 total XP', 'milestone', '💎', 50, '{"action": "xp_total", "amount": 1000}', 32),
  ('xp_10000', 'XP Master', 'Earn 10000 total XP', 'milestone', '🏅', 250, '{"action": "xp_total", "amount": 10000}', 33),

  -- Special Badges
  ('early_adopter', 'Early Adopter', 'Join during beta period', 'special', '🚀', 100, '{"action": "special", "type": "early_adopter"}', 40),
  ('beta_tester', 'Beta Tester', 'Help test new features', 'special', '🧪', 150, '{"action": "special", "type": "beta_tester"}', 41),
  ('community_contributor', 'Community Contributor', 'Contribute to the community', 'special', '🤝', 200, '{"action": "special", "type": "contributor"}', 42)
ON CONFLICT (id) DO NOTHING;

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON public.user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON public.xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active_date ON public.daily_challenges(active_date);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_id ON public.user_challenge_progress(user_id);

-- ==================== RLS POLICIES ====================

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_definitions ENABLE ROW LEVEL SECURITY;

-- User gamification: users can only see their own data
CREATE POLICY "Users can view their own gamification data" ON public.user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data" ON public.user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert gamification data" ON public.user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- XP transactions: users can only see their own
CREATE POLICY "Users can view their own XP transactions" ON public.xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert XP transactions" ON public.xp_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges: everyone can view available badges
CREATE POLICY "Everyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- Level definitions: everyone can view
CREATE POLICY "Everyone can view level definitions" ON public.level_definitions
  FOR SELECT USING (true);

-- User badges: users can only see their own
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily challenges: everyone can view active challenges
CREATE POLICY "Everyone can view daily challenges" ON public.daily_challenges
  FOR SELECT USING (true);

-- User challenge progress: users can only see their own
CREATE POLICY "Users can view their own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  calculated_level INTEGER := 1;
BEGIN
  SELECT level INTO calculated_level
  FROM public.level_definitions
  WHERE xp_required <= xp
  ORDER BY level DESC
  LIMIT 1;

  RETURN COALESCE(calculated_level, 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to initialize user gamification on signup
CREATE OR REPLACE FUNCTION public.initialize_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create gamification record
DROP TRIGGER IF EXISTS on_profile_created_gamification ON public.profiles;
CREATE TRIGGER on_profile_created_gamification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_gamification();

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS TABLE(new_streak INTEGER, streak_broken BOOLEAN, xp_bonus INTEGER) AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_streak_broken BOOLEAN := FALSE;
  v_xp_bonus INTEGER := 0;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.user_gamification
  WHERE user_id = p_user_id;

  IF v_last_date IS NULL THEN
    -- First activity
    v_current_streak := 1;
  ELSIF v_last_date = v_today THEN
    -- Already active today, no change
    NULL;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;

    -- Bonus XP for maintaining streak
    IF v_current_streak = 7 THEN
      v_xp_bonus := 25; -- Weekly streak bonus
    ELSIF v_current_streak = 30 THEN
      v_xp_bonus := 100; -- Monthly streak bonus
    ELSIF v_current_streak % 7 = 0 THEN
      v_xp_bonus := 10; -- Every week bonus
    END IF;
  ELSE
    -- Streak broken
    v_streak_broken := TRUE;
    v_current_streak := 1;
  END IF;

  -- Update longest streak
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Update user record
  UPDATE public.user_gamification
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_streak_broken, v_xp_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== UPDATED_AT TRIGGER ====================

CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
