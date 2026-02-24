import { useState } from 'react'
import {
  Clock, Plus, Calculator, FlaskConical, Brain,
  Loader2, PanelLeftClose, PanelLeftOpen,
  RefreshCw, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import type { Session, Subject } from '@/types'
import type { DueSession } from '@/lib/api'

interface SidebarProps {
  pastSessions:    Session[]
  dueSessions:     DueSession[]
  dueCount:        number
  onNewSession:    () => void
  onLoadSession?:  (session: { id: string }) => void
  activeSessionId?: string
  isLoading?:      boolean
  isDueLoading?:   boolean
}

const subjectIcon = (subject: Subject) => {
  if (subject === 'mathematics') return <Calculator size={14} />
  if (subject === 'science')     return <FlaskConical size={14} />
  return <Brain size={14} />
}

const subjectColor: Record<Subject, string> = {
  mathematics: 'rgb(var(--primary))',
  science:     'rgb(var(--accent))',
  general:     'rgb(var(--secondary))',
}

const levelLabel: Record<string, string> = {
  novice: 'Novice', developing: 'Developing',
  proficient: 'Proficient', advanced: 'Advanced',
}

function formatTime(date: Date): string {
  const now  = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function Sidebar({
  pastSessions, dueSessions, dueCount,
  onNewSession, onLoadSession, activeSessionId,
  isLoading, isDueLoading,
}: SidebarProps) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [dueExpanded,  setDueExpanded]  = useState(true)

  const WIDTH_EXPANDED  = 264
  const WIDTH_COLLAPSED = 60

  return (
    <aside style={{
      width:      collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED,
      flexShrink: 0,
      background: 'rgb(var(--sidebar-bg, var(--card)))',
      borderRight: '1px solid rgb(var(--border))',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>

      {/* ── Top: New Problem + Collapse toggle ── */}
      <div style={{
        padding: collapsed ? '14px 10px' : '14px 12px',
        borderBottom: '1px solid rgb(var(--border))',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        {collapsed ? (
          <button onClick={onNewSession} title="New Problem" style={{
            width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius)', background: 'rgb(var(--primary))',
            color: 'rgb(var(--primary-foreground))', border: 'none', cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)', flexShrink: 0,
          }}>
            <Plus size={16} />
          </button>
        ) : (
          <button onClick={onNewSession} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 'var(--radius)',
            background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
            fontWeight: 500, fontSize: '0.875rem', boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={14} />
            New Problem
          </button>
        )}

        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 30, height: 30, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius)', border: '1px solid rgb(var(--border))',
            background: 'transparent', cursor: 'pointer',
            color: 'rgb(var(--muted-foreground))', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted))'
            ;(e.currentTarget as HTMLElement).style.color = 'rgb(var(--foreground))'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgb(var(--muted-foreground))'
          }}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, overflowY: collapsed ? 'hidden' : 'auto',
        overflowX: 'hidden', padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>

        {/* ── Due for Review section ── */}
        {!collapsed && dueCount > 0 && (
          <div style={{ marginBottom: 8 }}>
            {/* Section header with badge + toggle */}
            <button
              onClick={() => setDueExpanded(e => !e)}
              className="flex items-center justify-between w-full px-2 mb-1"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 8px', borderRadius: 'var(--radius)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted) / 0.5)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={11} color="rgb(var(--accent))" />
                <span style={{
                  fontSize: '0.6875rem', textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'rgb(var(--accent))',
                  fontWeight: 600,
                }}>
                  Due for Review
                </span>
                {/* Badge */}
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 999,
                  background: 'rgb(var(--accent))', color: 'white',
                  fontSize: '0.625rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {dueCount}
                </span>
              </div>
              {dueExpanded ? <ChevronUp size={12} color="rgb(var(--muted-foreground))" /> : <ChevronDown size={12} color="rgb(var(--muted-foreground))" />}
            </button>

            {/* Due session cards */}
            {dueExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isDueLoading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 size={14} style={{ color: 'rgb(var(--muted-foreground))' }} />
                  </div>
                ) : dueSessions.map(s => {
                  const isActive = s.id === activeSessionId
                  return (
                    <button
                      key={s.id}
                      onClick={() => onLoadSession?.({ id: s.id })}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px',
                        borderRadius: 'var(--radius)',
                        border: isActive
                          ? '1px solid rgb(var(--accent) / 0.4)'
                          : '1px solid rgb(var(--accent) / 0.15)',
                        background: isActive
                          ? 'rgb(var(--accent) / 0.08)'
                          : 'rgb(var(--accent) / 0.04)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background = 'rgb(var(--accent) / 0.1)'
                      }}
                      onMouseLeave={e => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background = 'rgb(var(--accent) / 0.04)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5" style={{ color: subjectColor[s.subject as Subject], fontSize: '0.6875rem', fontWeight: 500 }}>
                          {subjectIcon(s.subject as Subject)}
                          <span style={{ textTransform: 'capitalize' }}>{s.subject}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {s.overdueDays > 0 && (
                            <span style={{
                              fontSize: '0.625rem', color: 'rgb(var(--destructive))',
                              fontWeight: 600,
                            }}>
                              {s.overdueDays}d overdue
                            </span>
                          )}
                          <AlertCircle size={11} color="rgb(var(--accent))" />
                        </div>
                      </div>
                      <p style={{
                        fontSize: '0.75rem', color: 'rgb(var(--foreground))',
                        lineHeight: 1.35, marginBottom: 4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {s.problem}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`tm-level-${s.currentLevel}`} style={{
                          fontSize: '0.6375rem', padding: '1px 6px',
                          borderRadius: 'calc(var(--radius) * 0.5)', fontWeight: 500,
                        }}>
                          {levelLabel[s.currentLevel]}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: 'rgb(var(--muted-foreground))' }}>
                          Review #{s.reviewCount + 1}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'rgb(var(--border))', margin: '8px 4px' }} />
          </div>
        )}

        {/* Collapsed: due badge dot */}
        {collapsed && dueCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ position: 'relative' }}>
              <RefreshCw size={18} color="rgb(var(--accent))" />
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: 'rgb(var(--accent))', color: 'white',
                fontSize: '0.5rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {dueCount}
              </span>
            </div>
          </div>
        )}

        {/* Section label */}
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-2 mb-1" style={{
            fontSize: '0.6875rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgb(var(--muted-foreground))', fontWeight: 500,
          }}>
            <Clock size={10} />
            Recent Sessions
          </div>
        )}

        {/* Collapsed: icon list */}
        {collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {isLoading && <Loader2 size={16} style={{ color: 'rgb(var(--muted-foreground))', marginTop: 8 }} />}
            {!isLoading && pastSessions.slice(0, 8).map(s => {
              const isActive = s.id === activeSessionId
              return (
                <button key={s.id} onClick={() => onLoadSession?.({ id: s.id })}
                  title={s.problem.slice(0, 60)} style={{
                    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius)',
                    border: isActive ? '1.5px solid rgb(var(--primary) / 0.5)' : '1.5px solid transparent',
                    background: isActive ? 'rgb(var(--primary) / 0.1)' : 'transparent',
                    cursor: 'pointer', color: subjectColor[s.subject], transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted) / 0.6)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {subjectIcon(s.subject)}
                </button>
              )
            })}
          </div>
        )}

        {/* Expanded: session cards */}
        {!collapsed && (
          <>
            {isLoading && (
              <div className="flex items-center justify-center gap-2" style={{ padding: '24px 0' }}>
                <Loader2 size={14} style={{ color: 'rgb(var(--muted-foreground))' }} />
                <span style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))' }}>Loading…</span>
              </div>
            )}
            {!isLoading && pastSessions.length === 0 && (
              <div style={{
                margin: '12px 6px', padding: '16px 14px',
                borderRadius: 'var(--radius)', border: '1px dashed rgb(var(--border))', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.8125rem', color: 'rgb(var(--muted-foreground))', lineHeight: 1.5 }}>
                  Your past sessions will appear here.
                </p>
              </div>
            )}
            {!isLoading && pastSessions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pastSessions.map(s => {
                  const isActive = s.id === activeSessionId
                  return (
                    <button key={s.id} onClick={() => onLoadSession?.({ id: s.id })} style={{
                      width: '100%', textAlign: 'left', padding: '9px 10px',
                      borderRadius: 'var(--radius)',
                      border: isActive ? '1px solid rgb(var(--primary) / 0.3)' : '1px solid transparent',
                      background: isActive ? 'rgb(var(--primary) / 0.07)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted) / 0.5)' }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5" style={{ color: subjectColor[s.subject], fontSize: '0.75rem', fontWeight: 500 }}>
                          {subjectIcon(s.subject)}
                          <span style={{ textTransform: 'capitalize' }}>{s.subject}</span>
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))' }}>
                          {formatTime(s.startedAt)}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.8rem', color: 'rgb(var(--foreground))', lineHeight: 1.4, marginBottom: 5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {s.problem}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`tm-level-${s.currentLevel}`} style={{
                          fontSize: '0.6375rem', padding: '1px 6px',
                          borderRadius: 'calc(var(--radius) * 0.5)', fontWeight: 500,
                        }}>
                          {levelLabel[s.currentLevel]}
                        </span>
                        {s.isComplete && (
                          <span style={{ fontSize: '0.6875rem', color: 'rgb(var(--accent))', fontWeight: 500 }}>✓</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '10px 14px', borderTop: '1px solid rgb(var(--border))',
          fontSize: '0.6875rem', color: 'rgb(var(--muted-foreground))', lineHeight: 1.5, flexShrink: 0,
        }}>
          ThinkMate · MVP<br />
          <span style={{ color: 'rgb(var(--accent))', fontWeight: 500 }}>No answers. Only better questions.</span>
        </div>
      )}
    </aside>
  )
}