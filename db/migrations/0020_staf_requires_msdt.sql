-- 0020_staf_requires_msdt.sql
-- STAF in a mandatory bundle does not take MSDT. Team-lead levels still do.
--
-- SAFETY: additive and idempotent. No DROP, DELETE, or TRUNCATE.
-- Safe to run repeatedly. The level table is a handful of rows, so no extra index.

ALTER TABLE jabatan_level_profiles
  ADD COLUMN IF NOT EXISTS requires_msdt BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE jabatan_level_profiles
SET requires_msdt = FALSE
WHERE level_code = 'STAF';
