-- Additive DISC report dictionary. Safe to re-run.
-- Does not drop, truncate, delete, or alter existing columns.

CREATE TABLE IF NOT EXISTS disc_patterns (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  jobs JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disc_patterns_code ON disc_patterns (code);
CREATE INDEX IF NOT EXISTS idx_disc_patterns_is_active ON disc_patterns (is_active);

CREATE TABLE IF NOT EXISTS disc_subtraits (
  id BIGSERIAL PRIMARY KEY,
  pair_key VARCHAR(16) NOT NULL,
  label_id VARCHAR(80) NOT NULL,
  pair_label VARCHAR(120) NOT NULL,
  narrative TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disc_subtraits_pair_key ON disc_subtraits (pair_key);

CREATE TABLE IF NOT EXISTS disc_graph_meanings (
  id BIGSERIAL PRIMARY KEY,
  graph_key VARCHAR(8) NOT NULL,
  title VARCHAR(160) NOT NULL,
  meaning TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disc_graph_meanings_graph_key ON disc_graph_meanings (graph_key);
