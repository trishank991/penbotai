-- Migration: Add English Variant Preference
-- This allows users to save their preferred regional English variant for grammar checking

-- Add preferred_english_variant column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_english_variant TEXT DEFAULT 'en-US';

-- Add constraint to ensure valid values
ALTER TABLE profiles
ADD CONSTRAINT check_english_variant
CHECK (preferred_english_variant IN ('en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-ZA', 'en-IN'));

-- Create index for faster lookups (if filtering by variant becomes needed)
CREATE INDEX IF NOT EXISTS idx_profiles_english_variant ON profiles(preferred_english_variant);

-- Comment for documentation
COMMENT ON COLUMN profiles.preferred_english_variant IS 'User''s preferred English variant for grammar checking: en-US (American), en-GB (British), en-AU (Australian), en-CA (Canadian), en-NZ (New Zealand), en-ZA (South African), en-IN (Indian)';
