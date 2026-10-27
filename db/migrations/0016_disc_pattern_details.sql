-- Additive detail columns for DISC patterns (I-D and I-C-D).
-- Does not drop, truncate, or delete. Safe to re-run.

ALTER TABLE disc_patterns ADD COLUMN IF NOT EXISTS characteristics JSONB;
ALTER TABLE disc_patterns ADD COLUMN IF NOT EXISTS cautions JSONB;
ALTER TABLE disc_patterns ADD COLUMN IF NOT EXISTS motivators TEXT;
