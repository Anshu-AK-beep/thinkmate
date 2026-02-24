// src/pages/ShareView.tsx
// Public read-only view of a shared ThinkMate session.
// No auth required — anyone with the link can view.

import { useEffect, useState } from 'react'
import { useParams }           from 'react-router-dom'
import { Brain, Lock, AlertCircle, ChevronRight } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type Level = 'novice' | 'developing' | 'proficient' | 'advanced'

interface SharedMessage {
  id:       string
  role:     'student' | 'ai' | 'system'
  content:  string
  metadata?: {
    understandingLevel?:    Level
    misconceptionsDetected?: string[]
  }
}

interface SharedSession {
  id:           string
  problem:      string
  subject:      string
  currentLevel: Level
  hintsUsed:    number
  maxHints:     number
  isComplete:   boolean
  startedAt:    string
  messages:     SharedMessage[]
  studentName:  string
}

const LEVEL_COLORS: Record<Level, string> = {
  novice:     '#94a3b8',
  developing: '#f59e0b',
  proficient: '#10b981',
  advanced:   '#22c55e',
}

const LEVEL_LABELS: Record<Level, string> = {
  novice: 'Novice', developing: 'Developing',
  proficient: 'Proficient', advanced: 'Advanced',
}

const SUBJECT_LABELS: Record<string, string> = {
  mathematics: 'Mathematics', science: 'Science', general: 'General',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function stripMarkdown(t: string) {
  return t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
}

export function ShareViewPage() {
  const { id }                              = useParams<{ id: string }>()
  const [session,    setSession]            = useState<SharedSession | null>(null)
  const [isLoading,  setIsLoading]          = useState(true)
  const [error,      setError]              = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`${BASE_URL}/api/share/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Session not found or link has expired')
        return r.json()
      })
      .then(data => setSession(data.snapshot as SharedSession))
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 0.2, 0.4].map((delay, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#10b981',
              animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading shared session…</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:.4;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', gap: 16, padding: 24,
      }}>
        <AlertCircle size={40} color="#f43f5e" />
        <h2 style={{ fontFamily: 'Sora, sans-serif', color: '#0f172a', margin: 0 }}>
          Session not found
        </h2>
        <p style={{ color: '#64748b', textAlign: 'center', maxWidth: 360 }}>
          {error ?? 'This link may have expired or does not exist.'}
        </p>
        <a href="/" style={{
          padding: '10px 22px', borderRadius: '0.625rem',
          background: '#10b981', color: '#fff', textDecoration: 'none',
          fontWeight: 600, fontSize: '0.9rem',
        }}>
          Go to ThinkMate
        </a>
      </div>
    )
  }

  const levelColor  = LEVEL_COLORS[session.currentLevel]
  const convMsgs    = session.messages.filter(m => m.role === 'student' || m.role === 'ai')
  const allMisc     = session.messages.flatMap(m => m.metadata?.misconceptionsDetected ?? [])
  const uniqueMisc  = [...new Set(allMisc)]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* ── Top bar ── */}
      <header style={{
        background: '#0f172a', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
            ThinkMate
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={12} color="#94a3b8" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>View only</span>
        </div>

        <a href="/" style={{
          padding: '6px 14px', borderRadius: '0.5rem',
          background: '#10b981', color: '#fff',
          textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          Try ThinkMate <ChevronRight size={13} />
        </a>
      </header>

      {/* ── Content ── */}
      <main style={{
        maxWidth: 780, margin: '0 auto',
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px)',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* ── Session header card ── */}
        <div style={{
          background: '#fff', borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}>
          {/* Coloured top strip */}
          <div style={{ height: 4, background: levelColor }} />

          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: '#10b981', color: '#fff', textTransform: 'capitalize',
                  }}>
                    {SUBJECT_LABELS[session.subject] ?? session.subject}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: `${levelColor}20`, color: levelColor,
                    border: `1px solid ${levelColor}40`,
                  }}>
                    {LEVEL_LABELS[session.currentLevel]}
                  </span>
                  {session.isComplete && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                      background: '#dcfce7', color: '#16a34a',
                    }}>
                      ✓ Completed
                    </span>
                  )}
                </div>
                <h1 style={{
                  fontFamily: 'Sora, sans-serif', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: 700, color: '#0f172a', lineHeight: 1.5, maxWidth: 560,
                  margin: 0,
                }}>
                  {session.problem}
                </h1>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                  {session.studentName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {formatDate(session.startedAt)}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap',
              paddingTop: 16, borderTop: '1px solid #e2e8f0',
            }}>
              {[
                { label: 'Responses', value: String(session.messages.filter(m => m.role === 'student' && !m.content.startsWith('[Requested')).length) },
                { label: 'Hints Used', value: `${session.hintsUsed} / ${session.maxHints}` },
                { label: 'Misconceptions', value: String(uniqueMisc.length) },
                { label: 'Final Level', value: LEVEL_LABELS[session.currentLevel] },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981' }}>{s.value}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Conversation ── */}
        <div>
          <h2 style={{
            fontFamily: 'Sora, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 14,
          }}>
            Conversation
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {convMsgs.map((msg, i) => {
              const isStudent = msg.role === 'student'
              const isHint    = isStudent && msg.content.startsWith('[Requested Hint')
              const content   = stripMarkdown(msg.content || '…')
              const misc      = msg.metadata?.misconceptionsDetected ?? []

              if (isHint) {
                return (
                  <div key={msg.id ?? i} style={{
                    textAlign: 'center', padding: '8px 16px',
                    color: '#f59e0b', fontSize: '0.8125rem', fontStyle: 'italic',
                    background: '#fffbeb', borderRadius: '0.5rem',
                    border: '1px solid #fde68a',
                    maxWidth: '70%', margin: '0 auto',
                  }}>
                    💡 {content}
                  </div>
                )
              }

              return (
                <div key={msg.id ?? i}>
                  <div style={{
                    display: 'flex',
                    justifyContent: isStudent ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: isStudent ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      background: isStudent ? '#f0fdf4' : '#ffffff',
                      border: isStudent ? '1px solid #86efac' : '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                      borderLeft: !isStudent ? '3px solid #10b981' : undefined,
                    }}>
                      {/* Role label */}
                      <div style={{
                        fontSize: '0.6875rem', fontWeight: 700, marginBottom: 6,
                        color: isStudent ? '#16a34a' : '#10b981',
                        textAlign: isStudent ? 'right' : 'left',
                      }}>
                        {isStudent ? 'You' : 'ThinkMate'}
                        {!isStudent && msg.metadata?.understandingLevel && (
                          <span style={{
                            marginLeft: 8, fontWeight: 500,
                            color: LEVEL_COLORS[msg.metadata.understandingLevel],
                          }}>
                            → {LEVEL_LABELS[msg.metadata.understandingLevel]}
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.65,
                        margin: 0, whiteSpace: 'pre-wrap',
                      }}>
                        {content}
                      </p>
                    </div>
                  </div>

                  {/* Misconceptions */}
                  {misc.length > 0 && (
                    <div style={{ marginTop: 6, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {misc.map((m2, j) => (
                        <div key={j} style={{
                          fontSize: '0.775rem', color: '#f43f5e', fontStyle: 'italic',
                          display: 'flex', alignItems: 'flex-start', gap: 5,
                        }}>
                          <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                          {m2}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Misconceptions summary ── */}
        {uniqueMisc.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: '0.75rem',
            border: '1px solid #fecaca', padding: '20px 24px',
          }}>
            <h3 style={{
              fontFamily: 'Sora, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
              color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
            }}>
              ⚠ Misconceptions Detected
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uniqueMisc.map((m2, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>{m2}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── CTA footer ── */}
        <div style={{
          background: '#0f172a', borderRadius: '0.75rem',
          padding: '28px 32px', textAlign: 'center',
        }}>
          <Brain size={28} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <h3 style={{
            fontFamily: 'Sora, sans-serif', color: '#fff',
            fontSize: '1.125rem', fontWeight: 700, marginBottom: 8,
          }}>
            Improve your reasoning with ThinkMate
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: 20 }}>
            No answers. Only better questions. Your AI Socratic tutor.
          </p>
          <a href="/" style={{
            padding: '10px 28px', borderRadius: '0.625rem',
            background: '#10b981', color: '#fff', textDecoration: 'none',
            fontWeight: 600, fontSize: '0.9375rem', display: 'inline-flex',
            alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
          }}>
            Get Started Free <ChevronRight size={15} />
          </a>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', paddingBottom: 8 }}>
          This is a shared view. Sign in to ThinkMate to start your own sessions.
        </p>
      </main>
    </div>
  )
}