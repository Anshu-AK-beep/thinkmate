-- ─────────────────────────────────────────────────────────────
-- ThinkMate — Module 6: Auth Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

-- ── 1. Add user_id to sessions ────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 2. Add user_id to messages (via session cascade, but index helps) ──
-- Messages already cascade-delete via session, no column needed.
-- We query messages through session_id which is already scoped.

-- ── 3. Enable Row Level Security ─────────────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ── 4. Drop old permissive policies if any ────────────────────
DROP POLICY IF EXISTS "allow_all_sessions" ON sessions;
DROP POLICY IF EXISTS "allow_all_messages" ON messages;

-- ── 5. Sessions RLS policies ──────────────────────────────────
-- Users can only SELECT their own sessions
CREATE POLICY "users_select_own_sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT sessions with their own user_id
CREATE POLICY "users_insert_own_sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own sessions
CREATE POLICY "users_update_own_sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only DELETE their own sessions
CREATE POLICY "users_delete_own_sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ── 6. Messages RLS policies ──────────────────────────────────
-- Messages are scoped via their session's user_id
CREATE POLICY "users_select_own_messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
  );

-- ── 7. Service role bypasses RLS (for server-side operations) ─
-- The Express backend uses the service role key which bypasses
-- all RLS policies automatically. No extra config needed.

-- ── 8. Verify ────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'messages');