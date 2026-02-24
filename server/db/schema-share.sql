-- ─────────────────────────────────────────────────────────────
-- ThinkMate — Share Table Migration
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shared_sessions (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT        NOT NULL,
  snapshot    JSONB       NOT NULL,    -- full session data at share time
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ             -- null = never expires
);

-- Public read: anyone with the ID can view (no auth needed)
ALTER TABLE shared_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_shares"
  ON shared_sessions FOR SELECT
  USING (true);

CREATE POLICY "owner_insert_shares"
  ON shared_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_delete_shares"
  ON shared_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_sessions_id ON shared_sessions(id);

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'shared_sessions';