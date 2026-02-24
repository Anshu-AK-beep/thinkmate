// POST /api/analyze — now streams via SSE

import { Router }                             from 'express'
import { z }                                  from 'zod'
import { invokeClaudeStream }                 from '../claude'
import { SYSTEM_PROMPT, buildAnalysisPrompt } from '../../src/lib/prompts'
import { parseAnalysisResponse }              from '../../src/lib/parser'
import { requireAuth }                        from '../middleware/auth'
import {
  getSession,
  getConversationHistory,
  insertMessage,
  updateSessionLevel,
} from '../db/sessions'

export const analyzeRouter = Router()
analyzeRouter.use(requireAuth)

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const AnalyzeSchema = z.object({
  sessionId:       z.string().min(1),
  problem:         z.string().min(10).max(2000),
  subject:         z.enum(['mathematics', 'science', 'general']),
  studentResponse: z.string().min(3).max(5000),
  attemptNumber:   z.number().int().min(1).max(100),
})

analyzeRouter.post('/', async (req, res) => {
  const parsed = AnalyzeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid request body',
      errors:  parsed.error.flatten().fieldErrors,
      code:    'VALIDATION_ERROR',
    })
  }

  const { sessionId, problem, subject, studentResponse, attemptNumber } = parsed.data
  const userId = req.userId!

  try {
    const session = await getSession(sessionId, userId)
    if (!session) {
      return res.status(404).json({
        message: 'Session not found or expired.',
        code:    'SESSION_NOT_FOUND',
      })
    }

    // Save student message before streaming starts
    await insertMessage({
      id:         generateId(),
      session_id: sessionId,
      role:       'student',
      content:    studentResponse,
    })

    const conversationHistory = await getConversationHistory(sessionId)

    const userMessage = buildAnalysisPrompt({
      problem, subject, studentResponse, conversationHistory, attemptNumber,
    })

    console.log(`[analyze/stream] session=${sessionId} attempt=${attemptNumber}`)

    // Stream to client — this sets SSE headers and streams chunks
    const fullText = await invokeClaudeStream(
      {
        systemPrompt: SYSTEM_PROMPT,
        messages:     [{ role: 'user', content: userMessage }],
        maxTokens:    1200,
        temperature:  0.5,
      },
      res,
    )

    // After streaming completes — parse full response and save to DB
    const result = parseAnalysisResponse(fullText)

    await Promise.all([
      insertMessage({
        id:                  generateId(),
        session_id:          sessionId,
        role:                'ai',
        content:             result.mentorResponse,
        understanding_level: result.understandingLevel,
        question_type:       'probing',
        misconceptions:      result.misconceptionsDetected,
        confidence_score:    result.confidenceScore,
      }),
      updateSessionLevel(sessionId, userId, result.understandingLevel),
    ])

    console.log(`[analyze/stream] complete level=${result.understandingLevel}`)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI service error'
    console.error('[analyze/stream] error:', message)
    // Headers already sent (SSE started) — error was sent via stream
    // If headers not sent yet, send JSON error
    if (!res.headersSent) {
      res.status(503).json({ message, code: 'AI_ERROR' })
    }
  }
})