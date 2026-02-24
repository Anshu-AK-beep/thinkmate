// src/hooks/useAI.ts — Module 7: streaming

import { useState, useCallback } from 'react'
import { streamAnalyze, requestHint, APIError } from '@/lib/api'
import type { AnalyzeRequest, AnalyzeResponse, HintRequest, HintResponse } from '@/lib/api'

export interface AIState {
  isLoading:    boolean
  isStreaming:  boolean      // ← new: true while chunks are arriving
  streamText:   string       // ← new: accumulated streaming text so far
  error:        string | null
  lastResponse: AnalyzeResponse | null
}

function friendlyError(err: unknown): string {
  if (err instanceof APIError) {
    if (err.status === 401) return 'Session expired — please sign in again.'
    if (err.status === 429) return 'ThinkMate is thinking too hard — please wait a moment.'
    if (err.status === 503) return 'AI service temporarily unavailable. Try again shortly.'
    if (err.status >= 500) return 'Something went wrong. Your message was not lost — try again.'
    return err.message
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return 'Cannot reach ThinkMate server. Make sure the backend is running on port 3001.'
  }
  return 'An unexpected error occurred. Please try again.'
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    isLoading:    false,
    isStreaming:  false,
    streamText:   '',
    error:        null,
    lastResponse: null,
  })

  const analyze = useCallback(async (
    req:       AnalyzeRequest,
    onSuccess: (res: AnalyzeResponse, fullText: string) => void,
  ) => {
    // Reset + enter loading state
    setState({
      isLoading:   true,
      isStreaming:  false,
      streamText:   '',
      error:        null,
      lastResponse: null,
    })

    try {
      let accumulatedText = ''

      const result = await streamAnalyze(
        req,
        (chunk: string) => {
          accumulatedText += chunk
          setState(s => ({
            ...s,
            isStreaming: true,
            isLoading:  false,   // loading done once first chunk arrives
            streamText: accumulatedText,
          }))
        },
      )

      // Stream complete
      setState({
        isLoading:    false,
        isStreaming:  false,
        streamText:   '',
        error:        null,
        lastResponse: result,
      })

      onSuccess(result, accumulatedText)

    } catch (err) {
      setState({
        isLoading:   false,
        isStreaming:  false,
        streamText:   '',
        error:        friendlyError(err),
        lastResponse: null,
      })
    }
  }, [])

  const hint = useCallback(async (
    req:       HintRequest,
    onSuccess: (res: HintResponse) => void,
  ) => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    try {
      const res = await requestHint(req)
      setState(s => ({ ...s, isLoading: false }))
      onSuccess(res)
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: friendlyError(err) }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }))
  }, [])

  return { ...state, analyze, hint, clearError }
}