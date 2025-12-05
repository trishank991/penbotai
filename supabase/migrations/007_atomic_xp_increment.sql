-- Migration: Add atomic XP increment function and fix missing RLS policies
-- This fixes race conditions in XP awarding and adds missing INSERT policy

-- Create atomic XP increment function to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER
)
RETURNS TABLE (new_total_xp INTEGER, new_level INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Atomically increment XP and return new values
  UPDATE user_gamification
  SET
    total_xp = total_xp + p_xp_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_xp;

  -- Calculate new level based on XP thresholds
  SELECT CASE
    WHEN v_new_xp >= 10000 THEN 10
    WHEN v_new_xp >= 6000 THEN 9
    WHEN v_new_xp >= 4000 THEN 8
    WHEN v_new_xp >= 2500 THEN 7
    WHEN v_new_xp >= 1500 THEN 6
    WHEN v_new_xp >= 1000 THEN 5
    WHEN v_new_xp >= 600 THEN 4
    WHEN v_new_xp >= 300 THEN 3
    WHEN v_new_xp >= 100 THEN 2
    ELSE 1
  END INTO v_new_level;

  -- Update level if changed
  UPDATE user_gamification
  SET current_level = v_new_level
  WHERE user_id = p_user_id AND current_level != v_new_level;

  RETURN QUERY SELECT v_new_xp, v_new_level;
END;
$$;

-- Add missing INSERT policy for parental_consent_requests
-- This allows users to create consent requests for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parental_consent_requests'
    AND policyname = 'Users can create consent requests for themselves'
  ) THEN
    CREATE POLICY "Users can create consent requests for themselves"
      ON public.parental_consent_requests
      FOR INSERT
      WITH CHECK (auth.uid() = child_user_id);
  END IF;
END $$;

-- Comment for documentation
COMMENT ON FUNCTION public.increment_user_xp IS 'Atomically increments user XP and recalculates level to prevent race conditions';
