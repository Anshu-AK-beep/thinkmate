// src/hooks/useReview.ts
// Manages spaced repetition state — due sessions, scheduling, completing reviews.

import { useState, useEffect, useCallback } from 'react'
import { getDueSessions, scheduleReview, completeReview } from '@/lib/api'
import type { DueSession } from '@/lib/api'
import type { UnderstandingLevel } from '@/types'

export function useReview() {
  const [dueSessions,  setDueSessions]  = useState<DueSession[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [dueCount,     setDueCount]     = useState(0)

  const fetchDue = useCallback(async () => {
    try {
      const sessions = await getDueSessions()
      setDueSessions(sessions)
      setDueCount(sessions.length)
    } catch (err) {
      console.warn('[useReview] could not load due sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDue()
  }, [fetchDue])

  // Called when a session ends — schedule its first review
  const scheduleAfterSession = useCallback(async (sessionId: string) => {
    try {
      const res = await scheduleReview(sessionId)
      console.log(`[useReview] scheduled in ${res.intervalDays} days`)
    } catch (err) {
      console.warn('[useReview] schedule failed:', err)
    }
  }, [])

  // Called after student resumes + continues a due session
  const markReviewed = useCallback(async (
    sessionId: string,
    newLevel:  UnderstandingLevel,
  ) => {
    try {
      await completeReview(sessionId, newLevel)
      // Remove from due list
      setDueSessions(prev => prev.filter(s => s.id !== sessionId))
      setDueCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.warn('[useReview] mark reviewed failed:', err)
    }
  }, [])

  return {
    dueSessions,
    dueCount,
    isLoading,
    fetchDue,
    scheduleAfterSession,
    markReviewed,
  }
}