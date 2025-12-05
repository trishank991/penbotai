-- Migration: Fix UPDATE RLS policies to include WITH CHECK
-- This prevents users from modifying user_id to another user's ID

-- Fix assignment_audits UPDATE policy
DROP POLICY IF EXISTS "Users can update own audits" ON public.assignment_audits;
CREATE POLICY "Users can update own audits" ON public.assignment_audits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix disclosures UPDATE policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'disclosures'
    AND policyname = 'Users can update own disclosures'
  ) THEN
    DROP POLICY "Users can update own disclosures" ON public.disclosures;
    CREATE POLICY "Users can update own disclosures" ON public.disclosures
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Fix saved_papers UPDATE policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'saved_papers'
    AND policyname = 'Users can update own saved papers'
  ) THEN
    DROP POLICY "Users can update own saved papers" ON public.saved_papers;
    CREATE POLICY "Users can update own saved papers" ON public.saved_papers
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Comment for documentation
COMMENT ON POLICY "Users can update own audits" ON public.assignment_audits
  IS 'Ensures users can only update their own audits and cannot change user_id';
