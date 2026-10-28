-- 0017_dt_peduli_assessment.sql
-- DT Peduli assessment: participant username login, mandatory 5-test bundle,
-- job-level recommendation engine.
--
-- SAFETY: additive and idempotent only. No DROP, DELETE, or TRUNCATE.
-- Safe to run repeatedly.

-- ---------------------------------------------------------------------------
-- 1. participants: credentials, job info, scoring + recommendation columns
-- ---------------------------------------------------------------------------
ALTER TABLE participants ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS default_password VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS position VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS unit_work VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS education VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS job_level_code VARCHAR(50);

ALTER TABLE participants ADD COLUMN IF NOT EXISTS scoring_status VARCHAR(30) DEFAULT 'PENDING'
  CHECK (scoring_status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED'));
ALTER TABLE participants ADD COLUMN IF NOT EXISTS scoring_error TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ;

-- Effective status (what reports/tables show). system_* keeps the engine result
-- so an assessor override can always be reverted.
ALTER TABLE participants ADD COLUMN IF NOT EXISTS recommendation_status VARCHAR(50)
  CHECK (recommendation_status IN ('DIREKOMENDASIKAN', 'DIPERTIMBANGKAN', 'TIDAK_DIREKOMENDASIKAN'));
ALTER TABLE participants ADD COLUMN IF NOT EXISTS system_recommendation_status VARCHAR(50)
  CHECK (system_recommendation_status IN ('DIREKOMENDASIKAN', 'DIPERTIMBANGKAN', 'TIDAK_DIREKOMENDASIKAN'));
ALTER TABLE participants ADD COLUMN IF NOT EXISTS recommendation_score NUMERIC(5,2);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS score_breakdown JSONB;

ALTER TABLE participants ADD COLUMN IF NOT EXISTS assessor_override BOOLEAN DEFAULT FALSE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS assessor_notes TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS assessor_email VARCHAR(255);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS assessor_updated_at TIMESTAMPTZ;

-- Username is stored lowercase; NULLs (legacy participants) are allowed many times.
CREATE UNIQUE INDEX IF NOT EXISTS uq_participants_username ON participants (username);
CREATE INDEX IF NOT EXISTS idx_participants_campaign_scoring ON participants (campaign_id, scoring_status);
CREATE INDEX IF NOT EXISTS idx_participants_campaign_reco ON participants (campaign_id, recommendation_status);
CREATE INDEX IF NOT EXISTS idx_participants_campaign_name ON participants (campaign_id, full_name);
CREATE INDEX IF NOT EXISTS idx_participants_email_lower ON participants (LOWER(email));

-- ---------------------------------------------------------------------------
-- 2. campaigns: mandatory bundle mode, ordered tests
-- ---------------------------------------------------------------------------
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_mode VARCHAR(30) DEFAULT 'OPEN'
  CHECK (campaign_mode IN ('OPEN', 'MANDATORY_BUNDLE'));
ALTER TABLE campaign_tests ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_test_results_participant ON test_results (participant_id);

-- ---------------------------------------------------------------------------
-- 3. Job level profiles (weights, thresholds, ideal dimension profiles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jabatan_level_profiles (
  id BIGSERIAL PRIMARY KEY,
  level_code VARCHAR(50) NOT NULL UNIQUE,
  level_name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  weight_wpt NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  weight_disc NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  weight_bigfive NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  weight_papi NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  weight_msdt NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  min_score_wpt NUMERIC(5,2) NOT NULL DEFAULT 50,
  min_score_disc NUMERIC(5,2) NOT NULL DEFAULT 50,
  min_score_bigfive NUMERIC(5,2) NOT NULL DEFAULT 50,
  min_score_papi NUMERIC(5,2) NOT NULL DEFAULT 50,
  min_score_msdt NUMERIC(5,2) NOT NULL DEFAULT 50,
  threshold_recommended NUMERIC(5,2) NOT NULL DEFAULT 75.00,
  threshold_considered NUMERIC(5,2) NOT NULL DEFAULT 55.00,
  dimension_profiles JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_jlp_weights_sum CHECK (
    ABS((weight_wpt + weight_disc + weight_bigfive + weight_papi + weight_msdt) - 1.0) < 0.011
  ),
  CONSTRAINT chk_jlp_thresholds CHECK (threshold_recommended >= threshold_considered)
);

-- keyword -> level. Lowest priority number is checked first. Soft-disable via is_active.
CREATE TABLE IF NOT EXISTS jabatan_mappings (
  id BIGSERIAL PRIMARY KEY,
  jabatan_keyword VARCHAR(255) NOT NULL,
  match_mode VARCHAR(20) NOT NULL DEFAULT 'PREFIX' CHECK (match_mode IN ('PREFIX', 'CONTAINS')),
  level_code VARCHAR(50) NOT NULL REFERENCES jabatan_level_profiles (level_code),
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_jabatan_mappings UNIQUE (jabatan_keyword, match_mode)
);
CREATE INDEX IF NOT EXISTS idx_jabatan_mappings_priority ON jabatan_mappings (priority) WHERE is_active;

-- ---------------------------------------------------------------------------
-- 4. Seed: level profiles (INSERT ... ON CONFLICT DO NOTHING; never overwrites admin edits)
-- ---------------------------------------------------------------------------
INSERT INTO jabatan_level_profiles
  (level_code, level_name, sort_order,
   weight_wpt, weight_disc, weight_bigfive, weight_papi, weight_msdt,
   threshold_recommended, threshold_considered, dimension_profiles)
VALUES
  ('STAF', 'Staf / Kontrak', 1, 0.20, 0.20, 0.25, 0.20, 0.15, 72, 55,
   '{"disc":{"ideal":["S","C","I"]},
     "bigfive":{"E":0.10,"A":0.25,"C":0.35,"N":-0.20,"O":0.10},
     "papi":{"high":["N","G","C","D","W"],"low":["Z","K"]},
     "msdt":{"E":95,"Dv":90,"Ba":80,"Bu":85,"Mi":60,"Co":55,"Au":40,"Ds":20}}'::jsonb),
  ('SUPERVISOR', 'Supervisor / Asisten Manajer', 2, 0.20, 0.25, 0.20, 0.20, 0.15, 73, 56,
   '{"disc":{"ideal":["D","S","I"]},
     "bigfive":{"E":0.15,"A":0.20,"C":0.30,"N":-0.25,"O":0.10},
     "papi":{"high":["N","G","L","C","D","P"],"low":["K","F"]},
     "msdt":{"E":100,"Dv":90,"Ba":85,"Bu":70,"Mi":60,"Co":55,"Au":45,"Ds":20}}'::jsonb),
  ('MANAJER', 'Manajer / Kepala', 3, 0.25, 0.25, 0.15, 0.20, 0.15, 75, 58,
   '{"disc":{"ideal":["D","I","C"]},
     "bigfive":{"E":0.20,"A":0.15,"C":0.30,"N":-0.25,"O":0.10},
     "papi":{"high":["L","P","I","T","N","G","C"],"low":["F","K"]},
     "msdt":{"E":100,"Dv":95,"Ba":85,"Bu":60,"Mi":60,"Co":50,"Au":45,"Ds":15}}'::jsonb),
  ('HOD', 'Head of Department / GM / Deputy', 4, 0.25, 0.30, 0.15, 0.15, 0.15, 77, 60,
   '{"disc":{"ideal":["D","I","C"]},
     "bigfive":{"E":0.20,"A":0.10,"C":0.25,"N":-0.25,"O":0.20},
     "papi":{"high":["L","P","I","T","V","N","G","R"],"low":["F","W","K"]},
     "msdt":{"E":100,"Dv":95,"Ba":85,"Bu":50,"Mi":55,"Co":45,"Au":50,"Ds":10}}'::jsonb),
  ('DIREKTUR', 'Direktur / Eksekutif', 5, 0.30, 0.25, 0.15, 0.15, 0.15, 78, 62,
   '{"disc":{"ideal":["D","I"]},
     "bigfive":{"E":0.20,"A":0.10,"C":0.25,"N":-0.25,"O":0.20},
     "papi":{"high":["L","P","I","T","V","R","N"],"low":["F","W","K"]},
     "msdt":{"E":100,"Dv":95,"Ba":85,"Bu":45,"Mi":50,"Co":40,"Au":50,"Ds":10}}'::jsonb)
ON CONFLICT (level_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Seed: jabatan keyword mappings (priority order matters)
--    Staff/contract prefixes first so "STAF PROJECT MANAGER ..." stays STAF.
-- ---------------------------------------------------------------------------
INSERT INTO jabatan_mappings (jabatan_keyword, match_mode, level_code, priority) VALUES
  ('STAF', 'PREFIX', 'STAF', 10),
  ('KONTRAK', 'PREFIX', 'STAF', 10),
  ('SAHABAT', 'PREFIX', 'STAF', 10),
  ('EXECUTIVE DIRECTOR', 'PREFIX', 'DIREKTUR', 20),
  ('PROGRAM DIRECTOR', 'PREFIX', 'DIREKTUR', 20),
  ('DIREKTUR', 'PREFIX', 'DIREKTUR', 20),
  ('CHIEF', 'PREFIX', 'HOD', 30),
  ('HEAD OF', 'PREFIX', 'HOD', 30),
  ('GM ', 'PREFIX', 'HOD', 30),
  ('DEPUTY', 'PREFIX', 'HOD', 30),
  ('SUPERVISOR', 'PREFIX', 'SUPERVISOR', 40),
  ('SPV', 'PREFIX', 'SUPERVISOR', 40),
  ('ASISTEN MANAJER', 'PREFIX', 'SUPERVISOR', 40),
  ('ASISTEN MANAGER', 'PREFIX', 'SUPERVISOR', 40),
  ('PROJECT MANAJER', 'PREFIX', 'MANAJER', 50),
  ('PROJECT MANAGER', 'PREFIX', 'MANAJER', 50),
  ('MANAJER', 'PREFIX', 'MANAJER', 50),
  ('MANAGER', 'PREFIX', 'MANAJER', 50),
  ('KABAG', 'PREFIX', 'MANAJER', 50),
  ('KEPALA', 'PREFIX', 'MANAJER', 50),
  ('PJS KEPALA', 'PREFIX', 'MANAJER', 50)
ON CONFLICT (jabatan_keyword, match_mode) DO NOTHING;
