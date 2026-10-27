-- Additive DISC kamus (section 6 traits, section 4.5 statuses, inactive flags).
-- Does not drop, truncate, or delete. Safe to re-run.

CREATE TABLE IF NOT EXISTS disc_dimension_traits (
  id BIGSERIAL PRIMARY KEY,
  dim VARCHAR(1) NOT NULL,
  heading VARCHAR(80) NOT NULL,
  potret_diri JSONB NOT NULL,
  kelebihan JSONB NOT NULL,
  kekurangan JSONB NOT NULL,
  kecenderungan JSONB NOT NULL,
  lingkungan_cocok JSONB NOT NULL,
  saran_perbaikan JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT disc_dimension_traits_dim_check CHECK (dim IN ('D', 'I', 'S', 'C'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disc_dimension_traits_dim ON disc_dimension_traits (dim);

CREATE TABLE IF NOT EXISTS disc_special_statuses (
  id BIGSERIAL PRIMARY KEY,
  status VARCHAR(32) NOT NULL,
  graph_key VARCHAR(8) NOT NULL,
  arti TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT disc_special_statuses_status_check CHECK (status IN ('Transisi', 'Super Syndrom', 'Undershift')),
  CONSTRAINT disc_special_statuses_graph_key_check CHECK (graph_key IN ('g1', 'g2', 'g3'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disc_special_statuses_status_graph ON disc_special_statuses (status, graph_key);

ALTER TABLE disc_subtraits ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE disc_graph_meanings ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_disc_subtraits_is_active ON disc_subtraits (is_active);
CREATE INDEX IF NOT EXISTS idx_disc_graph_meanings_is_active ON disc_graph_meanings (is_active);
