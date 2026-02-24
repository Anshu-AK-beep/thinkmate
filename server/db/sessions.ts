// ─────────────────────────────────────────────────────────────
// server/db/sessions.ts — Module 6 update
// All session operations now scoped to user_id
// ─────────────────────────────────────────────────────────────

import { getSupabase }       from './client'
import type { UnderstandingLevel, Subject } from '../../src/types'

export interface DBSession {
  id:             string
  user_id:        string
  subject:        Subject
  problem:        string
  current_level:  UnderstandingLevel
  hints_used:     number
  max_hints:      number
  is_complete:    boolean
  started_at:     string
  last_active_at: string
  expires_at:     string
}

export interface DBMessage {
  id:                   string
  session_id:           string
  role:                 'student' | 'ai' | 'system'
  content:              string
  timestamp:            string
  understanding_level?: UnderstandingLevel
  question_type?:       string
  misconceptions?:      string[]
  confidence_score?:    number
}

export interface SessionWithMessages extends DBSession {
  messages: DBMessage[]
}

// ── Session Operations ────────────────────────────────────────

export async function createSession(params: {
  id:             string
  userId:         string        // ← new
  subject:        Subject
  problem:        string
  initialMessage: { id: string; content: string }
}): Promise<DBSession> {
  const db = getSupabase()

  const { data, error } = await db
    .from('sessions')
    .insert({
      id:            params.id,
      user_id:       params.userId,   // ← scoped to user
      subject:       params.subject,
      problem:       params.problem,
      current_level: 'novice',
      hints_used:    0,
      max_hints:     3,
      is_complete:   false,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create session: ${error.message}`)

  await insertMessage({
    id:                  params.initialMessage.id,
    session_id:          params.id,
    role:                'ai',
    content:             params.initialMessage.content,
    understanding_level: 'novice',
  })

  return data
}

export async function getSession(
  sessionId: string,
  userId:    string,        // ← always verified
): Promise<DBSession | null> {
  const db = getSupabase()

  const { data, error } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)                          // ← ownership check
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return data
}

export async function getSessionWithMessages(
  sessionId: string,
  userId:    string,
): Promise<SessionWithMessages | null> {
  const db = getSupabase()

  const { data: session, error: sessionErr } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (sessionErr || !session) return null

  const { data: messages, error: msgErr } = await db
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  if (msgErr) throw new Error(`Failed to fetch messages: ${msgErr.message}`)

  return { ...session, messages: messages ?? [] }
}

export async function getAllSessions(
  userId: string,
  limit   = 20,
): Promise<DBSession[]> {
  const db = getSupabase()

  const { data, error } = await db
    .from('sessions')
    .select('*')
    .eq('user_id', userId)                          // ← scoped to user
    .gt('expires_at', new Date().toISOString())
    .order('last_active_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch sessions: ${error.message}`)
  return data ?? []
}

export async function updateSessionLevel(
  sessionId: string,
  userId:    string,
  level:     UnderstandingLevel,
): Promise<void> {
  const db = getSupabase()

  const { error } = await db
    .from('sessions')
    .update({ current_level: level, last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to update session level: ${error.message}`)
}

export async function incrementHints(
  sessionId: string,
  userId:    string,
): Promise<number> {
  const db = getSupabase()

  const session = await getSession(sessionId, userId)
  if (!session) throw new Error('Session not found')

  const newCount = session.hints_used + 1

  const { error } = await db
    .from('sessions')
    .update({ hints_used: newCount, last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to increment hints: ${error.message}`)
  return newCount
}

export async function completeSession(
  sessionId: string,
  userId:    string,
): Promise<void> {
  const db = getSupabase()

  const { error } = await db
    .from('sessions')
    .update({ is_complete: true, last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to complete session: ${error.message}`)
}

// ── Message Operations ────────────────────────────────────────

export async function insertMessage(params: {
  id:                   string
  session_id:           string
  role:                 'student' | 'ai' | 'system'
  content:              string
  understanding_level?: UnderstandingLevel
  question_type?:       string
  misconceptions?:      string[]
  confidence_score?:    number
}): Promise<void> {
  const db = getSupabase()

  const { error } = await db.from('messages').insert({
    id:                  params.id,
    session_id:          params.session_id,
    role:                params.role,
    content:             params.content,
    timestamp:           new Date().toISOString(),
    understanding_level: params.understanding_level ?? null,
    question_type:       params.question_type        ?? null,
    misconceptions:      params.misconceptions        ?? [],
    confidence_score:    params.confidence_score      ?? null,
  })

  if (error) throw new Error(`Failed to insert message: ${error.message}`)
}

export async function getConversationHistory(
  sessionId: string,
): Promise<{ role: 'student' | 'ai'; content: string }[]> {
  const db = getSupabase()

  const { data, error } = await db
    .from('messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  if (error) throw new Error(`Failed to fetch history: ${error.message}`)

  return (data ?? [])
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'student' | 'ai', content: m.content }))
}