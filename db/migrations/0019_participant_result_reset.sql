-- 0019: allow HR to reset a participant's assessment (trial -> real run).
-- Additive and idempotent. Every reset first archives the old results.

ALTER TABLE participants ADD COLUMN IF NOT EXISTS reset_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS participant_result_archives (
  id BIGSERIAL PRIMARY KEY,
  participant_id BIGINT NOT NULL,
  campaign_id BIGINT NOT NULL,
  reset_by VARCHAR(255),
  reason VARCHAR(500),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_result_archives_participant ON participant_result_archives (participant_id);
CREATE INDEX IF NOT EXISTS idx_result_archives_campaign ON participant_result_archives (campaign_id);
