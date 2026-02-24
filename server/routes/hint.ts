// POST /api/hint — requires auth

import { Router }                              from 'express'
import { z }                                   from 'zod'
import { invokeClaude }                        from '../claude'
import { HINT_SYSTEM_PROMPT, buildHintPrompt } from '../../src/lib/prompts'
import { parseHintResponse }                   from '../../src/lib/parser'
import { requireAuth }                         from '../middleware/auth'
import {
  getSession,
  getConversationHistory,
  insertMessage,
  incrementHints,
} from '../db/sessions'

export const hintRouter = Router()
hintRouter.use(requireAuth)

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const HintSchema = z.object({
  sessionId: z.string().min(1),
  problem:   z.string().min(10).max(2000),
  subject:   z.enum(['mathematics', 'science', 'general']),
  tier:      z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

hintRouter.post('/', async (req, res) => {
  const parsed = HintSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      errors:  parsed.error.flatten().fieldErrors,
      code:    'VALIDATION_ERROR',
    })
  }

  const { sessionId, problem, subject, tier } = parsed.data
  const userId = req.userId!

  try {
    const session = await getSession(sessionId, userId)
    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired.', code: 'SESSION_NOT_FOUND' })
    }

    if (session.hints_used >= session.max_hints) {
      return res.status(403).json({
        message: 'No hints remaining for this session.',
        code: 'NO_HINTS_REMAINING',
        remainingHints: 0,
      })
    }

    const conversationHistory = await getConversationHistory(sessionId)
    const userMessage = buildHintPrompt({ problem, subject, tier, conversationHistory })

    console.log(`[hint] session=${sessionId} tier=${tier} user=${userId}`)

    const rawResponse = await invokeClaude({
      systemPrompt: HINT_SYSTEM_PROMPT,
      messages:     [{ role: 'user', content: userMessage }],
      maxTokens:    800,
      temperature:  0.4,
    })

    const result = parseHintResponse(rawResponse, tier)

    const [newHintsUsed] = await Promise.all([
      incrementHints(sessionId, userId),
      insertMessage({
        id:                  generateId(),
        session_id:          sessionId,
        role:                'ai',
        content:             result.hint,
        understanding_level: session.current_level,
        question_type:       'clarification',
        misconceptions:      [],
      }),
    ])

    const remainingHints = session.max_hints - newHintsUsed
    return res.json({ ...result, remainingHints })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI service error'
    console.error('[hint] error:', message)
    return res.status(503).json({ message, code: 'AI_ERROR' })
  }
})