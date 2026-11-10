-- ============================================================================
-- Fix: Allow NULL outlet_package_id for fast/manual-amount billing
-- Run this ONCE against your Neon Postgres database.
-- ============================================================================

-- Make outlet_package_id nullable so fast billing (no package) can insert NULL
ALTER TABLE bills ALTER COLUMN outlet_package_id DROP NOT NULL;

-- Make package_price_snapshot nullable (defaults to 0.0 for fast billing)
ALTER TABLE bills ALTER COLUMN package_price_snapshot DROP NOT NULL;

-- Optional: add a comment documenting the nullable intent
COMMENT ON COLUMN bills.outlet_package_id IS 'NULL for fast/manual-amount billing (no package selected)';
COMMENT ON COLUMN bills.package_price_snapshot IS '0.0 for fast/manual-amount billing';

-- Verify the change
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bills'
  AND column_name IN ('outlet_package_id','package_price_snapshot')
ORDER BY column_name;
