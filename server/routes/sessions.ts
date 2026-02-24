// /api/sessions — all routes now require auth

import { Router }  from 'express'
import { z }       from 'zod'
import { requireAuth } from '../middleware/auth'
import {
  createSession,
  getAllSessions,
  getSessionWithMessages,
  completeSession,
} from '../db/sessions'

export const sessionsRouter = Router()

// Apply auth to all session routes
sessionsRouter.use(requireAuth)

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const CreateSchema = z.object({
  subject: z.enum(['mathematics', 'science', 'general']),
  problem: z.string().min(10).max(2000),
})

// POST /api/sessions
sessionsRouter.post('/', async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      errors:  parsed.error.flatten().fieldErrors,
      code:    'VALIDATION_ERROR',
    })
  }

  const { subject, problem } = parsed.data
  const userId    = req.userId!
  const sessionId = generateId()
  const messageId = generateId()

  const greeting =
    `Let's think through this together. Before we dive in — **don't worry about getting the right answer**. ` +
    `I want to understand *how* you're thinking about it.\n\n` +
    `Read the problem carefully, then tell me: what do you think is happening here? ` +
    `What's your first instinct, even if you're unsure?`

  try {
    const session = await createSession({
      id: sessionId, userId, subject, problem,
      initialMessage: { id: messageId, content: greeting },
    })

    console.log(`[sessions] created session=${sessionId} user=${userId}`)

    return res.status(201).json({
      sessionId:      session.id,
      subject:        session.subject,
      problem:        session.problem,
      currentLevel:   session.current_level,
      hintsUsed:      session.hints_used,
      maxHints:       session.max_hints,
      startedAt:      session.started_at,
      initialMessage: { id: messageId, content: greeting },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error'
    console.error('[sessions] create error:', message)
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

// GET /api/sessions
sessionsRouter.get('/', async (req, res) => {
  try {
    const sessions = await getAllSessions(req.userId!, 20)
    return res.json(sessions.map(s => ({
      id:           s.id,
      subject:      s.subject,
      problem:      s.problem,
      currentLevel: s.current_level,
      hintsUsed:    s.hints_used,
      maxHints:     s.max_hints,
      isComplete:   s.is_complete,
      startedAt:    s.started_at,
      lastActiveAt: s.last_active_at,
    })))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

// GET /api/sessions/:id
sessionsRouter.get('/:id', async (req, res) => {
  try {
    const session = await getSessionWithMessages(req.params.id, req.userId!)
    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired.', code: 'NOT_FOUND' })
    }
    return res.json({
      id:           session.id,
      subject:      session.subject,
      problem:      session.problem,
      currentLevel: session.current_level,
      hintsUsed:    session.hints_used,
      maxHints:     session.max_hints,
      isComplete:   session.is_complete,
      startedAt:    session.started_at,
      messages:     session.messages.map(m => ({
        id:                 m.id,
        role:               m.role,
        content:            m.content,
        timestamp:          m.timestamp,
        understandingLevel: m.understanding_level,
        misconceptions:     m.misconceptions ?? [],
        confidenceScore:    m.confidence_score,
      })),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

// POST /api/sessions/:id/complete
sessionsRouter.post('/:id/complete', async (req, res) => {
  try {
    await completeSession(req.params.id, req.userId!)
    return res.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})