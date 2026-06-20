-- Acknowledgement records for Terms of Engagement.
-- One row per "I Agree" submission. Signature PNG stored in R2 under
-- key `signatures/<id>.png`; eid_front_key/eid_back_key reserved for
-- future Emirates ID upload (currently feature-flagged off in the UI).

CREATE TABLE IF NOT EXISTS acknowledgements (
  id TEXT PRIMARY KEY,
  job_ref TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  typed_name TEXT NOT NULL,
  signature_key TEXT,
  eid_front_key TEXT,
  eid_back_key TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  acknowledged_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ack_job ON acknowledgements(job_ref);
CREATE INDEX IF NOT EXISTS idx_ack_time ON acknowledgements(acknowledged_at DESC);
