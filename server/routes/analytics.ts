// GET /api/analytics — returns aggregated learning stats for the authenticated user

import { Router }      from 'express'
import { requireAuth } from '../middleware/auth'
import { getSupabase } from '../db/client'

export const analyticsRouter = Router()
analyticsRouter.use(requireAuth)

analyticsRouter.get('/', async (req, res) => {
  const userId = req.userId!
  const db     = getSupabase()

  try {
    // ── 1. All sessions for this user ─────────────────────────
    const { data: sessions, error: sessErr } = await db
      .from('sessions')
      .select('id, subject, current_level, hints_used, is_complete, started_at, last_active_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: true })

    if (sessErr) throw new Error(sessErr.message)
    if (!sessions?.length) {
      return res.json(emptyAnalytics())
    }

    const sessionIds = sessions.map(s => s.id)

    // ── 2. All messages for this user's sessions ──────────────
    const { data: messages, error: msgErr } = await db
      .from('messages')
      .select('session_id, role, understanding_level, misconceptions, timestamp')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true })

    if (msgErr) throw new Error(msgErr.message)

    // ── 3. Level progression over time ────────────────────────
    // One data point per AI message that has an understanding_level
    const levelProgression = (messages ?? [])
      .filter(m => m.role === 'ai' && m.understanding_level)
      .map(m => ({
        date:    new Date(m.timestamp).toISOString().slice(0, 10),
        level:   m.understanding_level as string,
        numeric: levelToNum(m.understanding_level),
      }))

    // ── 4. Sessions per day ───────────────────────────────────
    const sessionsByDay: Record<string, number> = {}
    for (const s of sessions) {
      const day = new Date(s.started_at).toISOString().slice(0, 10)
      sessionsByDay[day] = (sessionsByDay[day] ?? 0) + 1
    }
    const sessionActivity = Object.entries(sessionsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)   // last 30 days

    // ── 5. Subject breakdown ──────────────────────────────────
    const subjectCount: Record<string, number> = {}
    for (const s of sessions) {
      subjectCount[s.subject] = (subjectCount[s.subject] ?? 0) + 1
    }
    const subjectBreakdown = Object.entries(subjectCount).map(([subject, count]) => ({
      subject, count,
      percentage: Math.round((count / sessions.length) * 100),
    }))

    // ── 6. Misconceptions ─────────────────────────────────────
    const miscCount: Record<string, number> = {}
    for (const m of (messages ?? [])) {
      if (!m.misconceptions?.length) continue
      for (const misc of m.misconceptions) {
        if (misc?.trim()) miscCount[misc.trim()] = (miscCount[misc.trim()] ?? 0) + 1
      }
    }
    const topMisconceptions = Object.entries(miscCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([text, count]) => ({ text, count }))

    // ── 7. Hint usage ─────────────────────────────────────────
    const totalHints     = sessions.reduce((sum, s) => sum + (s.hints_used ?? 0), 0)
    const sessionsWithHints = sessions.filter(s => s.hints_used > 0).length
    const hintsByTier    = [1, 2, 3].map(tier => ({
      tier,
      label: ['Orientation', 'Concept', 'Worked Example'][tier - 1],
      // Approximate: tier 1 used most, estimate from total hints
      count: sessions.filter(s => s.hints_used >= tier).length,
    }))

    // ── 8. Summary stats ──────────────────────────────────────
    const totalSessions   = sessions.length
    const completedCount  = sessions.filter(s => s.is_complete).length
    const advancedCount   = sessions.filter(s => s.current_level === 'advanced').length
    const avgHintsPerSess = totalSessions > 0
      ? Math.round((totalHints / totalSessions) * 10) / 10
      : 0

    // Current level distribution
    const levelDist: Record<string, number> = { novice: 0, developing: 0, proficient: 0, advanced: 0 }
    for (const s of sessions) {
      levelDist[s.current_level] = (levelDist[s.current_level] ?? 0) + 1
    }

    return res.json({
      summary: {
        totalSessions,
        completedSessions: completedCount,
        advancedSessions:  advancedCount,
        totalHints,
        avgHintsPerSession: avgHintsPerSess,
        sessionsWithHints,
      },
      levelProgression,
      sessionActivity,
      subjectBreakdown,
      topMisconceptions,
      hintUsage: {
        total:      totalHints,
        byTier:     hintsByTier,
        noHintRate: totalSessions > 0
          ? Math.round(((totalSessions - sessionsWithHints) / totalSessions) * 100)
          : 0,
      },
      levelDistribution: Object.entries(levelDist).map(([level, count]) => ({
        level, count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      })),
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error'
    console.error('[analytics] error:', message)
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

function levelToNum(level: string | null): number {
  return { novice: 1, developing: 2, proficient: 3, advanced: 4 }[level ?? ''] ?? 0
}

function emptyAnalytics() {
  return {
    summary:          { totalSessions: 0, completedSessions: 0, advancedSessions: 0, totalHints: 0, avgHintsPerSession: 0, sessionsWithHints: 0 },
    levelProgression: [],
    sessionActivity:  [],
    subjectBreakdown: [],
    topMisconceptions:[],
    hintUsage:        { total: 0, byTier: [], noHintRate: 0 },
    levelDistribution:[],
  }
}