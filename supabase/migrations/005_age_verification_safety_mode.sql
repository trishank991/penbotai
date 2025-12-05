-- =============================================
-- Migration: Age Verification & Safety Mode System
-- ScholarSync Legal Compliance Framework
-- COPPA 2025, KOSA, EU AI Act, UK AADC, AU OSA
-- =============================================

-- Add age verification and safety mode columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS age_verification_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS safety_mode_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS safety_mode_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS safety_filtering_level TEXT DEFAULT 'standard' CHECK (safety_filtering_level IN ('standard', 'strict', 'maximum')),
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parental_consent_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parental_consent_method TEXT CHECK (parental_consent_method IN ('knowledge_based_auth', 'government_id', 'credit_card', 'video_verification', 'signed_form', 'text_message')),
  ADD COLUMN IF NOT EXISTS parent_link_code TEXT,
  ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS daily_time_limit_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS weekly_time_limit_minutes INTEGER;

-- Create index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_profiles_parent_user_id ON public.profiles(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_link_code ON public.profiles(parent_link_code);

-- =============================================
-- Parental Consent Requests Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.parental_consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  consent_method TEXT NOT NULL CHECK (consent_method IN ('knowledge_based_auth', 'government_id', 'credit_card', 'video_verification', 'signed_form', 'text_message')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verification_data JSONB, -- Stores method-specific verification data
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  verified_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_parental_consent_child ON public.parental_consent_requests(child_user_id);
CREATE INDEX IF NOT EXISTS idx_parental_consent_code ON public.parental_consent_requests(verification_code);

-- =============================================
-- Parent-Child Link Requests Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.parent_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  link_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  parent_user_id UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_parent_link_child ON public.parent_link_requests(child_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_link_code ON public.parent_link_requests(link_code);

-- =============================================
-- Safety Activity Log Table
-- For parent dashboard and compliance auditing
-- =============================================
CREATE TABLE IF NOT EXISTS public.safety_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('session_start', 'session_end', 'prompt_blocked', 'feature_used', 'mental_health_flag', 'time_limit_reached', 'safety_setting_changed')),
  feature TEXT, -- Which feature was used
  blocked_category TEXT, -- If prompt was blocked, which category
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_log_user ON public.safety_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_log_date ON public.safety_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_safety_log_type ON public.safety_activity_log(activity_type);

-- =============================================
-- Blocked Prompts Log Table
-- Stores blocked content categories (NOT the content itself for privacy)
-- =============================================
CREATE TABLE IF NOT EXISTS public.blocked_prompts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  feature TEXT NOT NULL,
  prompt_hash TEXT, -- SHA256 hash for deduplication, NOT the content
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_prompts_user ON public.blocked_prompts_log(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_prompts_date ON public.blocked_prompts_log(created_at);

-- =============================================
-- Mental Health Pattern Detection Log
-- For KOSA compliance - tracks concerning patterns
-- =============================================
CREATE TABLE IF NOT EXISTS public.mental_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('self_harm_query', 'depression_indicators', 'anxiety_patterns', 'isolation_behavior', 'eating_disorder_content', 'substance_queries')),
  severity TEXT NOT NULL CHECK (severity IN ('concern', 'warning', 'critical')),
  pattern_description TEXT,
  notified_parent BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  acknowledged_by_parent BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  resources_shown BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mental_health_user ON public.mental_health_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_health_severity ON public.mental_health_alerts(severity);

-- =============================================
-- Usage Time Tracking Table
-- For time limit enforcement
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_minutes INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  last_session_start TIMESTAMPTZ,
  last_session_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_time_user_date ON public.usage_time_tracking(user_id, date);

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Parental consent requests: users can only see their own
ALTER TABLE public.parental_consent_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent requests"
  ON public.parental_consent_requests
  FOR SELECT
  USING (auth.uid() = child_user_id);

-- Parent link requests: accessible by child or linked parent
ALTER TABLE public.parent_link_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own link requests"
  ON public.parent_link_requests
  FOR SELECT
  USING (auth.uid() = child_user_id OR auth.uid() = parent_user_id);

CREATE POLICY "Children can create link requests"
  ON public.parent_link_requests
  FOR INSERT
  WITH CHECK (auth.uid() = child_user_id);

-- Safety activity log: accessible by user or their linked parent
ALTER TABLE public.safety_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON public.safety_activity_log
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = safety_activity_log.user_id
      AND parent_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs"
  ON public.safety_activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Blocked prompts log: accessible by user or their linked parent
ALTER TABLE public.blocked_prompts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocked prompts"
  ON public.blocked_prompts_log
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = blocked_prompts_log.user_id
      AND parent_user_id = auth.uid()
    )
  );

-- Mental health alerts: only accessible by linked parent
ALTER TABLE public.mental_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view child mental health alerts"
  ON public.mental_health_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = mental_health_alerts.user_id
      AND parent_user_id = auth.uid()
    )
  );

-- Usage time tracking: accessible by user or their linked parent
ALTER TABLE public.usage_time_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time tracking"
  ON public.usage_time_tracking
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = usage_time_tracking.user_id
      AND parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own time tracking"
  ON public.usage_time_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time tracking"
  ON public.usage_time_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Helper Functions
-- =============================================

-- Function to calculate age from DOB
CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, dob))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get age tier from DOB
CREATE OR REPLACE FUNCTION get_age_tier(dob DATE)
RETURNS TEXT AS $$
DECLARE
  user_age INTEGER;
BEGIN
  user_age := calculate_age(dob);

  IF user_age < 13 THEN
    RETURN 'under_13';
  ELSIF user_age < 14 THEN
    RETURN '13_14';
  ELSIF user_age < 18 THEN
    RETURN '14_17';
  ELSE
    RETURN 'adult';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to apply safety mode settings based on age tier
CREATE OR REPLACE FUNCTION apply_age_based_safety_settings()
RETURNS TRIGGER AS $$
DECLARE
  age_tier TEXT;
BEGIN
  -- Only apply if DOB is set and age verification fields are being updated
  IF NEW.date_of_birth IS NOT NULL THEN
    age_tier := get_age_tier(NEW.date_of_birth);

    -- Apply safety mode settings based on age tier
    CASE age_tier
      WHEN 'under_13' THEN
        NEW.safety_mode_enabled := TRUE;
        NEW.safety_mode_locked := TRUE;
        NEW.safety_filtering_level := 'maximum';
        NEW.age_verified := FALSE; -- Requires parental consent
      WHEN '13_14' THEN
        -- Default ON but not locked (parent can disable)
        IF NEW.safety_mode_enabled IS NULL OR TG_OP = 'INSERT' THEN
          NEW.safety_mode_enabled := TRUE;
        END IF;
        NEW.safety_mode_locked := FALSE;
        IF NEW.safety_filtering_level IS NULL OR TG_OP = 'INSERT' THEN
          NEW.safety_filtering_level := 'strict';
        END IF;
        NEW.age_verified := TRUE;
      WHEN '14_17' THEN
        -- Default OFF but available
        IF NEW.safety_mode_enabled IS NULL OR TG_OP = 'INSERT' THEN
          NEW.safety_mode_enabled := FALSE;
        END IF;
        NEW.safety_mode_locked := FALSE;
        IF NEW.safety_filtering_level IS NULL OR TG_OP = 'INSERT' THEN
          NEW.safety_filtering_level := 'standard';
        END IF;
        NEW.age_verified := TRUE;
      WHEN 'adult' THEN
        IF NEW.safety_mode_enabled IS NULL OR TG_OP = 'INSERT' THEN
          NEW.safety_mode_enabled := FALSE;
        END IF;
        NEW.safety_mode_locked := FALSE;
        NEW.age_verified := TRUE;
    END CASE;

    -- Set verification date if not already set
    IF NEW.age_verified = TRUE AND NEW.age_verification_date IS NULL THEN
      NEW.age_verification_date := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to apply safety settings when DOB is set/updated
DROP TRIGGER IF EXISTS apply_safety_settings_trigger ON public.profiles;
CREATE TRIGGER apply_safety_settings_trigger
  BEFORE INSERT OR UPDATE OF date_of_birth
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION apply_age_based_safety_settings();

-- Function to log safety activity
CREATE OR REPLACE FUNCTION log_safety_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_feature TEXT DEFAULT NULL,
  p_blocked_category TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.safety_activity_log (
    user_id, activity_type, feature, blocked_category, severity, duration_minutes, metadata
  ) VALUES (
    p_user_id, p_activity_type, p_feature, p_blocked_category, p_severity, p_duration_minutes, p_metadata
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage time
CREATE OR REPLACE FUNCTION update_usage_time(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_time_tracking (user_id, date, total_minutes, session_count, last_session_end)
  VALUES (p_user_id, CURRENT_DATE, p_minutes, 1, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_minutes = usage_time_tracking.total_minutes + p_minutes,
    last_session_end = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded time limit
CREATE OR REPLACE FUNCTION check_time_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_profile RECORD;
  daily_usage INTEGER;
  weekly_usage INTEGER;
  result JSONB;
BEGIN
  -- Get user's time limits
  SELECT daily_time_limit_minutes, weekly_time_limit_minutes
  INTO user_profile
  FROM public.profiles
  WHERE id = p_user_id;

  -- Get today's usage
  SELECT COALESCE(total_minutes, 0)
  INTO daily_usage
  FROM public.usage_time_tracking
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  -- Get this week's usage (Monday to Sunday)
  SELECT COALESCE(SUM(total_minutes), 0)
  INTO weekly_usage
  FROM public.usage_time_tracking
  WHERE user_id = p_user_id
    AND date >= date_trunc('week', CURRENT_DATE)
    AND date <= CURRENT_DATE;

  result := jsonb_build_object(
    'daily_limit', user_profile.daily_time_limit_minutes,
    'weekly_limit', user_profile.weekly_time_limit_minutes,
    'daily_used', daily_usage,
    'weekly_used', weekly_usage,
    'daily_exceeded', CASE
      WHEN user_profile.daily_time_limit_minutes IS NOT NULL
      THEN daily_usage >= user_profile.daily_time_limit_minutes
      ELSE FALSE
    END,
    'weekly_exceeded', CASE
      WHEN user_profile.weekly_time_limit_minutes IS NOT NULL
      THEN weekly_usage >= user_profile.weekly_time_limit_minutes
      ELSE FALSE
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate parent link code
CREATE OR REPLACE FUNCTION generate_parent_link_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Function to get child accounts for a parent
CREATE OR REPLACE FUNCTION get_linked_children(p_parent_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  date_of_birth DATE,
  age INTEGER,
  age_tier TEXT,
  safety_mode_enabled BOOLEAN,
  safety_mode_locked BOOLEAN,
  safety_filtering_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.date_of_birth,
    calculate_age(p.date_of_birth) as age,
    get_age_tier(p.date_of_birth) as age_tier,
    p.safety_mode_enabled,
    p.safety_mode_locked,
    p.safety_filtering_level
  FROM public.profiles p
  WHERE p.parent_user_id = p_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_age TO authenticated;
GRANT EXECUTE ON FUNCTION get_age_tier TO authenticated;
GRANT EXECUTE ON FUNCTION log_safety_activity TO authenticated;
GRANT EXECUTE ON FUNCTION update_usage_time TO authenticated;
GRANT EXECUTE ON FUNCTION check_time_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_linked_children TO authenticated;

-- =============================================
-- Update handle_new_user trigger to handle DOB
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_dob DATE;
BEGIN
  -- Try to extract DOB from metadata
  IF NEW.raw_user_meta_data ? 'date_of_birth' THEN
    user_dob := (NEW.raw_user_meta_data->>'date_of_birth')::DATE;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    user_dob
  );

  -- The apply_age_based_safety_settings trigger will handle the rest
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Insert default safety keywords/patterns
-- (For reference - actual filtering happens in application code)
-- =============================================
CREATE TABLE IF NOT EXISTS public.safety_filter_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('self_harm', 'violence', 'sexual_content', 'substance_abuse', 'personal_info', 'financial_scam', 'illegal_activity')),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('keyword', 'phrase', 'regex')),
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  filtering_level TEXT NOT NULL CHECK (filtering_level IN ('standard', 'strict', 'maximum')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Actual patterns will be defined in application code for security
-- This table exists for auditing and admin management

COMMENT ON TABLE public.safety_filter_patterns IS 'Reference table for safety filter patterns. Actual filtering logic is in application code.';
