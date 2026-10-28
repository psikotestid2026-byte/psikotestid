-- 0018: multiple HR logins per company + DB guard for bundle results.
-- Additive and idempotent: no DROP / DELETE / TRUNCATE.

CREATE TABLE IF NOT EXISTS customer_members (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers (id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One email belongs to exactly one company.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_members_email ON customer_members (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customer_members_customer ON customer_members (customer_id);

-- Existing owners become members automatically.
INSERT INTO customer_members (customer_id, email, full_name, status)
SELECT c.id, LOWER(c.email), c.contact_name, 'ACTIVE'
FROM customers c
WHERE c.email IS NOT NULL
ON CONFLICT DO NOTHING;

-- A recommendation may only exist once scoring is DONE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reco_requires_done') THEN
    ALTER TABLE participants
      ADD CONSTRAINT chk_reco_requires_done
      CHECK (recommendation_status IS NULL OR scoring_status = 'DONE') NOT VALID;
  END IF;
END $$;
ALTER TABLE participants VALIDATE CONSTRAINT chk_reco_requires_done;
