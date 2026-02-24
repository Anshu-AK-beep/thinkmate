import type { Subject, UnderstandingLevel } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export class APIError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
    this.name = 'APIError'
  }
}

let _getToken: (() => Promise<string | null>) | null = null
export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = _getToken ? await _getToken() : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers, ...options })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new APIError(err.message ?? `HTTP ${res.status}`, res.status, err.code)
  }
  return res.json()
}

function post<T>(endpoint: string, body: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
}
function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' })
}

// ── Types ─────────────────────────────────────────────────────

export interface CreateSessionRequest { subject: Subject; problem: string }
export interface CreateSessionResponse {
  sessionId: string; subject: Subject; problem: string
  currentLevel: UnderstandingLevel; hintsUsed: number; maxHints: number
  startedAt: string; initialMessage: { id: string; content: string }
}
export interface SessionSummary {
  id: string; subject: Subject; problem: string
  currentLevel: UnderstandingLevel; hintsUsed: number; maxHints: number
  isComplete: boolean; startedAt: string; lastActiveAt: string
}
export interface SessionDetail extends SessionSummary {
  messages: {
    id: string; role: 'student' | 'ai' | 'system'
    content: string; timestamp: string
    understandingLevel?: UnderstandingLevel
    misconceptions?: string[]; confidenceScore?: number
  }[]
}
export interface AnalyzeRequest {
  sessionId: string; problem: string; subject: Subject
  studentResponse: string; attemptNumber: number
}
export interface AnalyzeResponse {
  mentorResponse: string; questions: string[]
  analysis: string; understandingLevel: UnderstandingLevel
  misconceptionsDetected: string[]; confidenceScore: number; suggestHint: boolean
}
export interface HintRequest {
  sessionId: string; problem: string; subject: Subject; tier: 1 | 2 | 3
}
export interface HintResponse { hint: string; tier: number; remainingHints: number }
export interface HealthResponse {
  status: 'ok' | 'degraded'; groq: boolean; supabase: boolean; auth: boolean; version: string
}

// ── Review types ──────────────────────────────────────────────
export interface DueSession {
  id:             string
  subject:        Subject
  problem:        string
  currentLevel:   UnderstandingLevel
  reviewCount:    number
  nextReviewAt:   string
  lastReviewedAt: string | null
  overdueDays:    number
}
export interface ScheduleReviewResponse {
  nextReviewAt: string
  intervalDays: number
}
export interface CompleteReviewResponse {
  nextReviewAt: string
  intervalDays: number
  reviewCount:  number
}

// ── Streaming analyze ─────────────────────────────────────────
export async function streamAnalyze(
  req:     AnalyzeRequest,
  onChunk: (text: string) => void,
): Promise<AnalyzeResponse> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST', headers, body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new APIError(err.message ?? `HTTP ${res.status}`, res.status, err.code)
  }

  const reader  = res.body?.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''
  let finalData: AnalyzeResponse | null = null

  if (!reader) throw new APIError('No response body', 500)

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const event of events) {
      const line = event.trim()
      if (!line.startsWith('data: ')) continue
      try {
        const parsed = JSON.parse(line.slice(6))
        if (parsed.type === 'chunk') onChunk(parsed.text)
        if (parsed.type === 'done') {
          const { parseAnalysisResponse } = await import('./parser')
          finalData = parseAnalysisResponse(parsed.full)
        }
        if (parsed.type === 'error') throw new APIError(parsed.message, 503, 'STREAM_ERROR')
      } catch (e) {
        if (e instanceof APIError) throw e
      }
    }
  }

  if (!finalData) throw new APIError('Stream ended without completion signal', 503)
  return finalData
}

// ── Standard API calls ────────────────────────────────────────
export const createSession    = (req: CreateSessionRequest)  => post<CreateSessionResponse>('/api/sessions', req)
export const getSessions      = ()                           => get<SessionSummary[]>('/api/sessions')
export const getSessionById   = (id: string)                 => get<SessionDetail>(`/api/sessions/${id}`)
export const completeSession  = (id: string)                 => post<{ success: boolean }>(`/api/sessions/${id}/complete`, {})
export const analyzeReasoning = (req: AnalyzeRequest)        => post<AnalyzeResponse>('/api/analyze', req)
export const requestHint      = (req: HintRequest)           => post<HintResponse>('/api/hint', req)
export const checkHealth      = ()                           => get<HealthResponse>('/api/health')

// ── Review API calls ──────────────────────────────────────────
export const getDueSessions   = ()                           => get<DueSession[]>('/api/review/due')
export const scheduleReview   = (sessionId: string)          => post<ScheduleReviewResponse>(`/api/review/${sessionId}/schedule`, {})
export const completeReview   = (sessionId: string, newLevel: UnderstandingLevel) =>
  post<CompleteReviewResponse>(`/api/review/${sessionId}/complete`, { newLevel })

export const createShare = (sessionId: string, snapshot: unknown) =>
  post<{ shareId: string; shareUrl: string }>('/api/share', { sessionId, snapshot })

export const getShare = (shareId: string) =>
  get<{ shareId: string; snapshot: unknown; createdAt: string }>(`/api/share/${shareId}`)