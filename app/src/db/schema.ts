/**
 * SQLite schema for Mercury. Applied idempotently on every connection open.
 * Single migration block for v0.1; versioned migrations can layer on later
 * via the `schema_version` pragma table.
 */
export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS profile (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  username       TEXT,
  name           TEXT,
  headline       TEXT,
  location       TEXT,
  current_company TEXT,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS profile_metrics (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  captured_at        TEXT NOT NULL,
  search_appearances INTEGER,
  profile_views      INTEGER,
  post_impressions   INTEGER,
  connections        INTEGER,
  score              INTEGER,
  breakdown_json     TEXT
);

CREATE TABLE IF NOT EXISTS companies (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL UNIQUE,
  urn_id  TEXT,
  notes   TEXT
);

CREATE TABLE IF NOT EXISTS recruiters (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  username       TEXT,
  company        TEXT,
  title          TEXT,
  location       TEXT,
  degree         TEXT,
  mutuals_json   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  date_contacted TEXT,
  accepted_at    TEXT,
  replied_at     TEXT,
  note           TEXT,
  source_skill   TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (username, company)
);

CREATE TABLE IF NOT EXISTS jobs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  linkedin_job_id  TEXT UNIQUE,
  title            TEXT,
  company_id       INTEGER REFERENCES companies(id),
  company_name     TEXT,
  location         TEXT,
  work_type        TEXT,
  comp             TEXT,
  fit              TEXT,
  requirements_json TEXT,
  status           TEXT NOT NULL DEFAULT 'saved',
  link             TEXT,
  scouted_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id           INTEGER REFERENCES jobs(id),
  resume_path      TEXT,
  cover_letter_path TEXT,
  report_path      TEXT,
  keyword_score    INTEGER,
  status           TEXT NOT NULL DEFAULT 'draft',
  applied_at       TEXT
);

CREATE TABLE IF NOT EXISTS interviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  company       TEXT NOT NULL,
  job_id        INTEGER REFERENCES jobs(id),
  scheduled_at  TEXT,
  stage         TEXT,
  status        TEXT NOT NULL DEFAULT 'scheduled',
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  recruiter_id INTEGER REFERENCES recruiters(id),
  body         TEXT,
  kind         TEXT NOT NULL DEFAULT 'connect',
  sent_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           TEXT NOT NULL DEFAULT (datetime('now')),
  kind         TEXT NOT NULL,
  skill        TEXT,
  summary      TEXT,
  payload_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_recruiters_status  ON recruiters(status);
CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_metrics_captured   ON profile_metrics(captured_at);
CREATE INDEX IF NOT EXISTS idx_activity_ts        ON activity_log(ts);
`;
