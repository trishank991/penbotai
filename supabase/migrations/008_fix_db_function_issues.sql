-- Migration: Fix database function issues
-- 1. Use cryptographically secure randomness for parent link codes
-- 2. Change IMMUTABLE to STABLE for functions using CURRENT_DATE

-- Fix 1: Use gen_random_bytes for secure link code generation
CREATE OR REPLACE FUNCTION generate_parent_link_code()
RETURNS TEXT AS $$
BEGIN
  -- Use gen_random_bytes for cryptographically secure randomness
  -- Generates 4 random bytes = 8 hex characters
  RETURN upper(encode(gen_random_bytes(4), 'hex'));
END;
$$ LANGUAGE plpgsql;

-- Fix 2: Change calculate_age to STABLE (uses CURRENT_DATE which changes daily)
CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(CURRENT_DATE, dob))::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fix 3: Change get_age_tier to STABLE (uses CURRENT_DATE which changes daily)
CREATE OR REPLACE FUNCTION get_age_tier(dob DATE)
RETURNS TEXT AS $$
DECLARE
  user_age INTEGER;
BEGIN
  user_age := calculate_age(dob);

  CASE
    WHEN user_age < 13 THEN RETURN 'child';
    WHEN user_age < 18 THEN RETURN 'teen';
    ELSE RETURN 'adult';
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments for documentation
COMMENT ON FUNCTION generate_parent_link_code IS 'Generates a cryptographically secure 8-character parent link code using gen_random_bytes';
COMMENT ON FUNCTION calculate_age IS 'Calculates age from date of birth - STABLE because CURRENT_DATE changes daily';
COMMENT ON FUNCTION get_age_tier IS 'Returns age tier (child/teen/adult) - STABLE because it depends on calculate_age';
