// src/components/auth/ProtectedRoute.tsx
// Wraps any route that requires authentication.
// Shows a loading spinner while auth state is resolving.

import { Navigate }  from 'react-router-dom'
import { useAuth }   from '@/contexts/AuthContext'
import { Brain }     from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  // Auth state still resolving — show minimal spinner
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'rgb(var(--background))',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius)',
          background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={22} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="tm-thinking-dot" />
          <div className="tm-thinking-dot" />
          <div className="tm-thinking-dot" />
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}