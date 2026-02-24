// server/routes/share.ts
// POST /api/share        — save session snapshot, return share ID (auth required)
// GET  /api/share/:id   — fetch shared snapshot (PUBLIC — no auth)

import { Router }      from 'express'
import { z }           from 'zod'
import { requireAuth } from '../middleware/auth'
import { getSupabase } from '../db/client'

export const shareRouter = Router()

// ── POST /api/share — create shareable snapshot ───────────────
shareRouter.post('/', requireAuth, async (req, res) => {
  const userId = req.userId!
  const db     = getSupabase()

  const BodySchema = z.object({
    sessionId: z.string().min(1),        // accept any non-empty string ID
    snapshot: z.object({}).passthrough(),
  })

  const parsed = BodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request body', code: 'VALIDATION_ERROR' })
  }

  const { sessionId, snapshot } = parsed.data

  try {
    // Insert share record directly — user is authenticated via requireAuth
    const { data: share, error: insertErr } = await db
      .from('shared_sessions')
      .insert({
        user_id:    userId,
        session_id: sessionId,
        snapshot,
      })
      .select('id')
      .single()

    if (insertErr || !share) {
      console.error('[share] insert error:', insertErr)
      throw new Error(insertErr?.message ?? 'Insert failed')
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const shareUrl    = `${frontendUrl}/share/${share.id}`

    console.log(`[share] created share=${share.id} session=${sessionId}`)
    return res.json({ shareId: share.id, shareUrl })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error'
    console.error('[share] error:', message)
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})

// ── GET /api/share/:id — fetch public snapshot ────────────────
shareRouter.get('/:id', async (req, res) => {
  const db      = getSupabase()
  const shareId = req.params.id

  try {
    const { data, error } = await db
      .from('shared_sessions')
      .select('id, snapshot, created_at')
      .eq('id', shareId)
      .single()

    if (error || !data) {
      return res.status(404).json({ message: 'Share not found or expired', code: 'NOT_FOUND' })
    }

    return res.json({
      shareId:   data.id,
      snapshot:  data.snapshot,
      createdAt: data.created_at,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB error'
    return res.status(500).json({ message, code: 'DB_ERROR' })
  }
})