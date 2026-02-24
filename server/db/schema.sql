-- ─────────────────────────────────────────────────────────────
-- ThinkMate — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

-- ── Sessions table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id                TEXT        PRIMARY KEY,
  subject           TEXT        NOT NULL CHECK (subject IN ('mathematics', 'science', 'general')),
  problem           TEXT        NOT NULL,
  current_level     TEXT        NOT NULL DEFAULT 'novice'
                                CHECK (current_level IN ('novice', 'developing', 'proficient', 'advanced')),
  hints_used        INTEGER     NOT NULL DEFAULT 0,
  max_hints         INTEGER     NOT NULL DEFAULT 3,
  is_complete       BOOLEAN     NOT NULL DEFAULT FALSE,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- ── Messages table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id                TEXT        PRIMARY KEY,
  session_id        TEXT        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role              TEXT        NOT NULL CHECK (role IN ('student', 'ai', 'system')),
  content           TEXT        NOT NULL,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- AI metadata (null for student messages)
  understanding_level   TEXT    CHECK (understanding_level IN ('novice', 'developing', 'proficient', 'advanced')),
  question_type         TEXT    CHECK (question_type IN ('clarification', 'probing', 'extension', 'challenge')),
  misconceptions        TEXT[]  DEFAULT '{}',
  confidence_score      FLOAT   CHECK (confidence_score BETWEEN 0 AND 1),
  hints_used_snapshot   INTEGER[]  DEFAULT '{}'
);

-- ── Indexes for fast queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_session_id
  ON messages(session_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_last_active
  ON sessions(last_active_at DESC);

-- ── Auto-expire: delete sessions older than 30 days ──────────
-- This runs as a cron job in Supabase (Database → Extensions → pg_cron)
-- Enable pg_cron first, then uncomment:
--
-- SELECT cron.schedule(
--   'expire-old-sessions',
--   '0 2 * * *',   -- runs daily at 2am UTC
--   $$ DELETE FROM sessions WHERE expires_at < NOW() $$
-- );

-- ── Row Level Security (RLS) ──────────────────────────────────
-- Since ThinkMate uses anonymous sessions (no auth yet),
-- we disable RLS and rely on server-side validation.
-- Module 6 will add proper auth + RLS policies.

ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ── Verify setup ──────────────────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('sessions', 'messages')
ORDER BY table_name;