import { Moon, Sun, Zap, LogOut, BarChart2 } from 'lucide-react'
import { useState }       from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth }        from '@/contexts/AuthContext'
import type { Subject }   from '@/types'

interface TopBarProps {
  subject?:          Subject
  sessionActive?:    boolean
  onThemeToggle?:    () => void
  isDark?:           boolean
  mobileMenuButton?: React.ReactNode
}

const subjectMeta: Record<Subject, { label: string; symbol: string }> = {
  mathematics: { label: 'Mathematics', symbol: '∑' },
  science:     { label: 'Science',     symbol: '⚗' },
  general:     { label: 'General',     symbol: '◈' },
}

export function TopBar({ subject, sessionActive, onThemeToggle, isDark, mobileMenuButton }: TopBarProps) {
  const { user, signOut } = useAuth()
  const navigate          = useNavigate()
  const location          = useLocation()
  const [showMenu, setShowMenu] = useState(false)

  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Student'
  const initials    = displayName.slice(0, 2).toUpperCase()
  const onAnalytics = location.pathname === '/analytics'

  return (
    <header
      className="flex items-center gap-3"
      style={{
        height: 56, paddingLeft: 16, paddingRight: 16,
        background: 'rgb(var(--background))',
        borderBottom: '1px solid rgb(var(--border))',
        flexShrink: 0, position: 'relative',
      }}
    >
      {mobileMenuButton}

      {/* Logo */}
      <div className="flex items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate('/app')}>
        <div style={{
          width: 28, height: 28, borderRadius: 'calc(var(--radius) * 0.75)',
          background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
        }}>
          T
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>
          ThinkMate
        </span>
      </div>

      <div style={{ width: 1, height: 18, background: 'rgb(var(--border))' }} />

      {/* Active subject */}
      {subject && !onAnalytics && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{
          background: 'rgb(var(--primary) / 0.1)', color: 'rgb(var(--primary))',
          fontFamily: 'var(--font-mono)',
        }}>
          <span>{subjectMeta[subject].symbol}</span>
          <span>{subjectMeta[subject].label}</span>
        </div>
      )}

      {/* Session dot */}
      {sessionActive && !onAnalytics && (
        <div className="flex items-center gap-1.5">
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: 'rgb(var(--accent))',
            boxShadow: '0 0 0 3px rgb(var(--accent) / 0.2)',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>Active</span>
        </div>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Analytics nav link */}
        {user && (
          <button
            onClick={() => navigate(onAnalytics ? '/app' : '/analytics')}
            className="flex items-center gap-1.5"
            style={{
              padding: '5px 12px', borderRadius: 'var(--radius)',
              border: '1px solid',
              borderColor: onAnalytics ? 'rgb(var(--primary) / 0.4)' : 'rgb(var(--border))',
              background:  onAnalytics ? 'rgb(var(--primary) / 0.08)' : 'transparent',
              color: onAnalytics ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem', fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!onAnalytics) {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--primary) / 0.3)'
                ;(e.currentTarget as HTMLElement).style.color = 'rgb(var(--primary))'
              }
            }}
            onMouseLeave={e => {
              if (!onAnalytics) {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'
                ;(e.currentTarget as HTMLElement).style.color = 'rgb(var(--muted-foreground))'
              }
            }}
          >
            <BarChart2 size={13} />
            Analytics
          </button>
        )}

        <div className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium" style={{
          background: 'rgb(var(--secondary) / 0.12)', color: 'rgb(var(--secondary))',
          border: '1px solid rgb(var(--secondary) / 0.2)',
        }}>
          <Zap size={10} />
          MVP
        </div>

        <button
          onClick={onThemeToggle}
          className="flex items-center justify-center rounded"
          style={{
            width: 32, height: 32, border: '1px solid rgb(var(--border))',
            background: 'transparent', cursor: 'pointer', color: 'rgb(var(--muted-foreground))',
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* User avatar + dropdown */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(m => !m)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid rgb(var(--primary) / 0.3)',
                overflow: 'hidden', cursor: 'pointer',
                background: 'rgb(var(--primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700,
                  color: 'rgb(var(--primary-foreground))', fontFamily: 'var(--font-display)',
                }}>
                  {initials}
                </span>
              )}
            </button>

            {showMenu && (
              <>
                <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', right: 0, top: '110%', minWidth: 200, zIndex: 50,
                  background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{displayName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/analytics') }}
                    className="flex items-center gap-2 w-full"
                    style={{
                      padding: '10px 14px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                      color: 'rgb(var(--foreground))', textAlign: 'left', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted))'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <BarChart2 size={14} />
                    Analytics
                  </button>
                  <button
                    onClick={async () => { setShowMenu(false); await signOut() }}
                    className="flex items-center gap-2 w-full"
                    style={{
                      padding: '10px 14px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                      color: 'rgb(var(--destructive))', textAlign: 'left', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgb(var(--muted))'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}