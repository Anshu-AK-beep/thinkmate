// ─────────────────────────────────────────────────────────────
// server/routes/review.ts — Spaced Repetition API
//
// GET  /api/review/due          — sessions due for review today
// POST /api/review/:id/schedule — schedule first review after session end
// POST /api/review/:id/complete — mark reviewed, reschedule next interval
// ─────────────────────────────────────────────────────────────

import { Router }      from 'express'
import { z }           from 'zod'
import { requireAuth } from '../middleware/auth'
import { getSupabase } from '../db/client'
import type { UnderstandingLevel } from '../../src/types'

export const reviewRouter = Router()
reviewRouter.use(requireAuth)

// ── Interval logic (Ebbinghaus-inspired) ─────────────────────
// Returns days until next review based on level + review count
function nextIntervalDays(level: UnderstandingLevel, reviewCount: number): number {
  const base: Record<UnderstandingLevel, number> = {
    novice:     1,
    developing: 3,
    proficient: 7,
    advanced:   14,
  }
  // Each successful review doubles the interval, capped at 60 days
  const interval = base[level] * Math.pow(2, reviewCount)
  return Math.min(interval, 60)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ── GET /api/review/due ───────────────────────────────────────
// Returns all sessions due for review (next_review_at <= now)
reviewRouter.get('/due', async (req, res) => {
  const userId = req.userId!
  const db     = getSupabase()

  try {
    const { data, error } = await db
      .from('sessions')
      .select('id, subject, problem, current_level, review_count, next_review_at, last_reviewed_at')
      .eq('user_id', userId)
      .not('next_review_at', 'is', null)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })

    if (error) throw new Error(error.message)

    return res.json((data ?? []).map(s => ({
      id:             s.id,
      subject:        s.subject,
      problem:        s.problem,
      currentLevel:   s.current_level,
      reviewCount:    s.review_count,
      nextReviewAt:   s.next_review_at,
      lastReviewedAt: s.last_reviewed_at,
      overdueDays:    Math.floor(
        (Date.now() - new Date(s.next_review_at).getTime()) / 86400000
      ),
    })))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

// ── POST /api/review/:id/schedule ────────────────────────────
// Called when a session ends — schedules the first review
reviewRouter.post('/:id/schedule', async (req, res) => {
  const userId    = req.userId!
  const sessionId = req.params.id
  const db        = getSupabase()

  try {
    // Get session to read current level
    const { data: session, error: fetchErr } = await db
      .from('sessions')
      .select('current_level, review_count')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (fetchErr || !session) {
      return res.status(404).json({ message: 'Session not found', code: 'NOT_FOUND' })
    }

    const days          = nextIntervalDays(session.current_level as UnderstandingLevel, 0)
    const nextReviewAt  = addDays(new Date(), days)

    const { error: updateErr } = await db
      .from('sessions')
      .update({
        next_review_at: nextReviewAt.toISOString(),
        review_count:   0,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (updateErr) throw new Error(updateErr.message)

    console.log(`[review] scheduled session=${sessionId} level=${session.current_level} in ${days} days`)

    return res.json({
      nextReviewAt: nextReviewAt.toISOString(),
      intervalDays: days,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

// ── POST /api/review/:id/complete ────────────────────────────
// Called after student revisits + continues session
// Reschedules based on new level reached
const CompleteSchema = z.object({
  newLevel: z.enum(['novice', 'developing', 'proficient', 'advanced']),
})

reviewRouter.post('/:id/complete', async (req, res) => {
  const userId    = req.userId!
  const sessionId = req.params.id
  const db        = getSupabase()

  const parsed = CompleteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request', code: 'VALIDATION_ERROR' })
  }

  const { newLevel } = parsed.data

  try {
    const { data: session, error: fetchErr } = await db
      .from('sessions')
      .select('review_count')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (fetchErr || !session) {
      return res.status(404).json({ message: 'Session not found', code: 'NOT_FOUND' })
    }

    const newCount     = (session.review_count ?? 0) + 1
    const days         = nextIntervalDays(newLevel, newCount)
    const nextReviewAt = addDays(new Date(), days)

    const { error: updateErr } = await db
      .from('sessions')
      .update({
        next_review_at:   nextReviewAt.toISOString(),
        review_count:     newCount,
        last_reviewed_at: new Date().toISOString(),
        current_level:    newLevel,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (updateErr) throw new Error(updateErr.message)

    console.log(`[review] completed session=${sessionId} level=${newLevel} review=${newCount} next=${days}d`)

    return res.json({
      nextReviewAt:  nextReviewAt.toISOString(),
      intervalDays:  days,
      reviewCount:   newCount,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})