-- ─────────────────────────────────────────────────────────────
-- ThinkMate — Module 9: Spaced Repetition Migration
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

-- ── 1. Add SR columns to sessions ────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS next_review_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_count    INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ DEFAULT NULL;

-- ── 2. Index for fast due-session queries ─────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_next_review
  ON sessions(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- ── 3. Verify ─────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sessions'
  AND column_name IN ('next_review_at', 'review_count', 'last_reviewed_at');