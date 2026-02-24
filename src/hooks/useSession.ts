import { useState, useCallback, useEffect } from 'react'
import type { Session, Message, UnderstandingLevel } from '@/types'
import type { Problem } from '@/data/sampleProblem'
import {
  createSession   as apiCreateSession,
  getSessions     as apiGetSessions,
  getSessionById  as apiGetSessionById,
  completeSession as apiCompleteSession,
} from '@/lib/api'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useSession() {
  const [session,          setSession]          = useState<Session | null>(null)
  const [pastSessions,     setPastSessions]     = useState<Session[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isLoadingSession, setIsLoadingSession] = useState(false)

  useEffect(() => {
    apiGetSessions()
      .then(summaries => {
        setPastSessions(summaries.map(s => ({
          id: s.id, subject: s.subject, problem: s.problem,
          messages: [], currentLevel: s.currentLevel,
          hintsUsed: s.hintsUsed, maxHints: s.maxHints,
          startedAt: new Date(s.startedAt), isComplete: s.isComplete,
        })))
      })
      .catch(err => console.warn('[useSession] could not load history:', err))
      .finally(() => setIsLoadingHistory(false))
  }, [])

  const startSession = useCallback(async (problem: Problem) => {
    const res = await apiCreateSession({ subject: problem.subject, problem: problem.statement })

    const initialMsg: Message = {
      id: res.initialMessage.id, role: 'ai',
      content: res.initialMessage.content, timestamp: new Date(),
      metadata: {
        understandingLevel: 'novice', questionType: 'clarification',
        misconceptionsDetected: [], confidenceScore: 1, hintsUsed: [],
      },
    }

    setSession({
      id: res.sessionId, subject: res.subject, problem: res.problem,
      messages: [initialMsg], currentLevel: res.currentLevel,
      hintsUsed: res.hintsUsed, maxHints: res.maxHints,
      startedAt: new Date(res.startedAt), isComplete: false,
    })
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoadingSession(true)
    try {
      const detail = await apiGetSessionById(sessionId)
      const messages: Message[] = detail.messages.map(m => ({
        id: m.id, role: m.role as Message['role'],
        content: m.content, timestamp: new Date(m.timestamp),
        metadata: m.role === 'ai' ? {
          understandingLevel: (m.understandingLevel ?? 'novice') as UnderstandingLevel,
          questionType:       'probing' as const,
          misconceptionsDetected: m.misconceptions ?? [],
          confidenceScore:    m.confidenceScore ?? 0.8,
          hintsUsed:          [],
        } : undefined,
      }))
      setSession({
        id: detail.id, subject: detail.subject, problem: detail.problem,
        messages, currentLevel: detail.currentLevel,
        hintsUsed: detail.hintsUsed, maxHints: detail.maxHints,
        startedAt: new Date(detail.startedAt), isComplete: detail.isComplete,
      })
    } catch (err) {
      console.error('[useSession] failed to load session:', err)
      throw err
    } finally {
      setIsLoadingSession(false)
    }
  }, [])

  // Add student message
  const addStudentMessage = useCallback((content: string) => {
    const msg: Message = {
      id: generateId(), role: 'student', content, timestamp: new Date(),
    }
    setSession(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
  }, [])

  // Add empty AI placeholder — streaming fills this in via streamText
  // When streaming completes, replaceLastAIMessage() swaps in the final content
  const addAIMessage = useCallback((
    content:        string,
    level:          UnderstandingLevel,
    misconceptions: string[] = [],
  ) => {
    const msg: Message = {
      id: generateId(), role: 'ai', content, timestamp: new Date(),
      metadata: {
        understandingLevel:     level,
        questionType:           'probing',
        misconceptionsDetected: misconceptions,
        confidenceScore:        0.85,
        hintsUsed:              [],
      },
    }
    setSession(prev => {
      if (!prev) return prev
      // If last message is an empty AI placeholder, replace it
      const last = prev.messages.at(-1)
      if (last?.role === 'ai' && last.content === '') {
        return {
          ...prev,
          messages:     [...prev.messages.slice(0, -1), msg],
          currentLevel: level,
        }
      }
      return { ...prev, messages: [...prev.messages, msg], currentLevel: level }
    })
  }, [])

  const requestHint = useCallback(() => {
    setSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : prev)
  }, [])

  const endSession = useCallback(async () => {
    if (!session) return
    try { await apiCompleteSession(session.id) }
    catch (err) { console.warn('[useSession] could not mark complete:', err) }
    const completed = { ...session, isComplete: true }
    setPastSessions(prev => [completed, ...prev.filter(s => s.id !== session.id)])
    setSession(null)
  }, [session])

  const remainingHints = session ? session.maxHints - session.hintsUsed : 0

  return {
    session, pastSessions, remainingHints,
    isLoadingHistory, isLoadingSession,
    startSession, loadSession,
    addStudentMessage, addAIMessage,
    requestHint, endSession,
  }
}