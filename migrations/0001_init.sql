-- Initial schema for SnaggingPro cloud storage.
-- Run via: wrangler d1 execute snaggingpro --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,                     -- jobRef, e.g. SP-260620-001
  job_ref TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('original', 'follow-up')),
  parent_report_id TEXT,
  client_name TEXT NOT NULL DEFAULT '',
  developer TEXT NOT NULL DEFAULT '',
  community TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  property_type TEXT NOT NULL,
  date TEXT NOT NULL,                      -- ISO YYYY-MM-DD
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  total_snags INTEGER NOT NULL DEFAULT 0,
  critical_snags INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  state_json TEXT NOT NULL                 -- full State as JSON blob
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_name);
CREATE INDEX IF NOT EXISTS idx_reports_parent ON reports(parent_report_id);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,                     -- photoId (UUID from client)
  job_ref TEXT NOT NULL,
  kind TEXT NOT NULL,                      -- 'cover' | 'overview' | 'snag' | 'annotated' | 'rectification'
  content_type TEXT NOT NULL DEFAULT 'image/webp',
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_job ON photos(job_ref);
