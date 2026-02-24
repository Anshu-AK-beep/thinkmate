// Simple in-memory rate limiter
// 30 requests per minute per IP — enough for demo, prevents abuse
// Replace with Redis-based limiter in production

import type { Request, Response, NextFunction } from 'express'

interface RateEntry {
  count:     number
  resetTime: number
}

const store = new Map<string, RateEntry>()
const WINDOW_MS  = 60_000   // 1 minute
const MAX_REQ    = 30       // requests per window

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip  = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  const now = Date.now()

  let entry = store.get(ip)

  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + WINDOW_MS }
    store.set(ip, entry)
    return next()
  }

  entry.count++

  if (entry.count > MAX_REQ) {
    return res.status(429).json({
      message: 'Too many requests. Please wait a minute before trying again.',
      code:    'RATE_LIMITED',
    })
  }

  next()
}