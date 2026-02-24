import { useRef, useState, useEffect } from 'react'
import { AppShell }        from '@/components/thinkmate/layout/AppShell'
import { SubjectSelector } from '@/components/thinkmate/problem/SubjectSelector'
import { ProblemCard }     from '@/components/thinkmate/problem/ProblemCard'
import { ChatWindow }      from '@/components/thinkmate/chat/ChatWindow'
import { useSession }      from '@/hooks/useSession'
import { useAI }           from '@/hooks/useAI'
import { useReview }       from '@/hooks/useReview'
import type { Problem }    from '@/data/sampleProblem'

export function ChatPage() {
  const attemptRef                    = useRef(0)
  const [startError,  setStartError]  = useState<string | null>(null)
  const [loadError,   setLoadError]   = useState<string | null>(null)
  const [showProblem, setShowProblem] = useState(true)
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const {
    session, pastSessions, remainingHints,
    isLoadingHistory, isLoadingSession,
    startSession, loadSession,
    addStudentMessage, addAIMessage,
    requestHint, endSession,
  } = useSession()

  const {
    isLoading, isStreaming, streamText,
    error, clearError, analyze, hint,
  } = useAI()

  const {
    dueSessions, dueCount, isLoading: isDueLoading,
    scheduleAfterSession, markReviewed,
  } = useReview()

  const handleSelectProblem = async (problem: Problem) => {
    setStartError(null)
    attemptRef.current = 0
    try {
      await startSession(problem)
      if (isMobile) setShowProblem(false)
    } catch {
      setStartError('Could not start session. Make sure the server is running.')
    }
  }

  const handleLoadSession = async (s: { id: string }) => {
    setLoadError(null)
    if (session?.id === s.id) return
    try {
      await loadSession(s.id)
      attemptRef.current = 0
      if (isMobile) setShowProblem(false)
    } catch {
      setLoadError('Could not load session. Please try again.')
    }
  }

  const handleSubmitReasoning = (text: string) => {
    if (!session) return
    attemptRef.current += 1
    addStudentMessage(text)
    addAIMessage('', 'novice', [])

    analyze(
      {
        sessionId: session.id, problem: session.problem,
        subject: session.subject, studentResponse: text,
        attemptNumber: attemptRef.current,
      },
      (res) => {
        addAIMessage(res.mentorResponse, res.understandingLevel, res.misconceptionsDetected)
        const isDue = dueSessions.some(d => d.id === session.id)
        if (isDue) markReviewed(session.id, res.understandingLevel)
      },
    )
  }

  const handleHintRequest = () => {
    if (!session || remainingHints === 0) return
    const tier = Math.min(session.hintsUsed + 1, 3) as 1 | 2 | 3
    requestHint()
    addStudentMessage(`[Requested Hint ${tier} — ${{ 1: 'Orientation', 2: 'Concept', 3: 'Worked Example' }[tier]}]`)
    hint(
      { sessionId: session.id, problem: session.problem, subject: session.subject, tier },
      (res) => { addAIMessage(res.hint, session.currentLevel, []) },
    )
  }

  const handleEndSession = async () => {
    if (session) await scheduleAfterSession(session.id)
    await endSession()
  }

  if (isLoadingSession) {
    return (
      <AppShell
        subject={undefined} sessionActive={false}
        pastSessions={pastSessions} dueSessions={dueSessions}
        dueCount={dueCount} isDueLoading={isDueLoading}
        onNewSession={handleEndSession} isLoadingHistory={isLoadingHistory}
      >
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="tm-thinking-dot" />
            <div className="tm-thinking-dot" />
            <div className="tm-thinking-dot" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))', fontStyle: 'italic' }}>
            Loading your conversation…
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      subject={session?.subject} sessionActive={!!session}
      pastSessions={pastSessions} dueSessions={dueSessions}
      dueCount={dueCount} isDueLoading={isDueLoading}
      onNewSession={handleEndSession}
      onLoadSession={handleLoadSession} activeSessionId={session?.id}
      isLoadingHistory={isLoadingHistory}
    >
      {loadError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 'var(--radius)',
          background: 'rgb(var(--destructive))', color: 'rgb(var(--destructive-foreground))',
          fontSize: '0.875rem', boxShadow: 'var(--shadow-lg)', zIndex: 100, whiteSpace: 'nowrap',
        }}>
          ⚠ {loadError}
        </div>
      )}

      {!session ? (
        <SubjectSelector onSelectProblem={handleSelectProblem} error={startError} />
      ) : (
        <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>

          {(!isMobile || showProblem) && (
            <div style={{
              width: isMobile ? '100%' : 360, flexShrink: 0,
              borderRight: isMobile ? 'none' : '1px solid rgb(var(--border))',
              overflow: 'hidden', background: 'rgb(var(--card))',
            }}>
              <ProblemCard
                problem={{
                  id: session.id, subject: session.subject,
                  topic: 'Active Problem', grade: '', statement: session.problem,
                }}
                session={session}                    // ← full session for PDF export
                currentLevel={session.currentLevel}
                messageCount={session.messages.filter(m => m.role === 'student').length}
                hintsUsed={session.hintsUsed}
                maxHints={session.maxHints}
                onEndSession={handleEndSession}
                isReviewSession={dueSessions.some(d => d.id === session.id)}
              />
            </div>
          )}

          {(!isMobile || !showProblem) && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {error && (
                <div style={{
                  padding: '10px 20px', flexShrink: 0,
                  background: 'rgb(var(--destructive) / 0.08)',
                  borderBottom: '1px solid rgb(var(--destructive) / 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--destructive))' }}>⚠ {error}</span>
                  <button onClick={clearError} style={{
                    fontSize: '0.75rem', color: 'rgb(var(--destructive))',
                    background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
                  }}>Dismiss</button>
                </div>
              )}
              <ChatWindow
                messages={session.messages}
                isLoading={isLoading} isStreaming={isStreaming} streamText={streamText}
                remainingHints={remainingHints}
                onSubmit={handleSubmitReasoning}
                onHintRequest={handleHintRequest}
              />
            </div>
          )}

          {isMobile && (
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              display: 'flex', borderTop: '1px solid rgb(var(--border))',
              background: 'rgb(var(--background))', zIndex: 30, height: 52,
            }}>
              {['Problem', 'Chat'].map((label, i) => {
                const isActive = i === 0 ? showProblem : !showProblem
                return (
                  <button key={label} onClick={() => setShowProblem(i === 0)} style={{
                    flex: 1, border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgb(var(--primary) / 0.07)' : 'transparent',
                    color: isActive ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))',
                    fontFamily: 'var(--font-body)', fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                    borderBottom: isActive ? '2px solid rgb(var(--primary))' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}