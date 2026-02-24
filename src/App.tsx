import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect }        from 'react'
import { AuthProvider }     from '@/contexts/AuthContext'
import { ProtectedRoute }   from '@/components/auth/ProtectedRoute'
import { LandingPage }      from '@/pages/Landing'
import { LoginPage }        from '@/pages/Login'
import { ChatPage }         from '@/pages/Chat'
import { AnalyticsPage }    from '@/pages/Analytics'
import { ShareViewPage }    from '@/pages/ShareView'
import { useAuth }          from '@/contexts/AuthContext'
import { setTokenGetter }   from '@/lib/api'

function ApiTokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => { setTokenGetter(getToken) }, [getToken])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ApiTokenBridge />
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/app"        element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/analytics"  element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/share/:id"  element={<ShareViewPage />} />  {/* ← public, no auth */}
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}