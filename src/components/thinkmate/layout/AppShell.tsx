import { useState, useEffect }   from 'react'
import { Menu, X }               from 'lucide-react'
import { TopBar }                from './TopBar'
import { Sidebar }               from './Sidebar'
import type { Session, Subject } from '@/types'
import type { DueSession }       from '@/lib/api'

interface AppShellProps {
  subject?:          Subject
  sessionActive?:    boolean
  pastSessions:      Session[]
  dueSessions:       DueSession[]
  dueCount:          number
  isDueLoading?:     boolean
  onNewSession:      () => void
  onLoadSession?:    (session: { id: string }) => void
  activeSessionId?:  string
  isLoadingHistory?: boolean
  children:          React.ReactNode
}

export function AppShell({
  subject, sessionActive, pastSessions,
  dueSessions, dueCount, isDueLoading,
  onNewSession, onLoadSession, activeSessionId,
  isLoadingHistory, children,
}: AppShellProps) {
  const [isDark,      setIsDark]      = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
  if (isMobile && sessionActive) {
    queueMicrotask(() => {
      setSidebarOpen(false)
    })
  }
}, [sessionActive, isMobile])

  const sidebarProps = {
    pastSessions, dueSessions, dueCount, isDueLoading,
    onNewSession, onLoadSession, activeSessionId,
    isLoading: isLoadingHistory,
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      background: 'rgb(var(--background))',
    }}>
      <TopBar
        subject={subject} sessionActive={sessionActive}
        onThemeToggle={() => setIsDark(d => !d)} isDark={isDark}
        mobileMenuButton={
          isMobile ? (
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 'var(--radius)',
              border: '1px solid rgb(var(--border))', background: 'transparent',
              cursor: 'pointer', color: 'rgb(var(--foreground))', flexShrink: 0,
            }}>
              {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          ) : null
        }
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {!isMobile && <Sidebar {...sidebarProps} />}

        {isMobile && sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{
              position: 'fixed', inset: 0, top: 56,
              background: 'rgba(0,0,0,0.45)', zIndex: 40,
            }} />
            <div style={{ position: 'fixed', top: 56, left: 0, bottom: 0, zIndex: 50 }}>
              <Sidebar
                {...sidebarProps}
                onNewSession={() => { onNewSession(); setSidebarOpen(false) }}
                onLoadSession={(s) => { onLoadSession?.(s); setSidebarOpen(false) }}
              />
            </div>
          </>
        )}

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}