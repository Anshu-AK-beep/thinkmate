// ─────────────────────────────────────────────────────────────
// server/middleware/auth.ts
// Verifies Supabase JWT from Authorization header.
// Attaches user_id to req for downstream route handlers.
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express'
import { createClient }                    from '@supabase/supabase-js'

// Extend Express Request to carry user_id
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

// Use anon key here — we only need to verify the JWT, not bypass RLS
// The service role client (in db/client.ts) is used for actual DB ops
function getAuthClient() {
  const url     = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env')
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function requireAuth(
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing auth token.', code: 'UNAUTHORIZED' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const supabase = getAuthClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({ message: 'Invalid or expired token.', code: 'UNAUTHORIZED' })
      return
    }

    req.userId = data.user.id
    next()
  } catch (err) {
    console.error('[auth] token verification failed:', err)
    res.status(401).json({ message: 'Auth verification failed.', code: 'UNAUTHORIZED' })
  }
}