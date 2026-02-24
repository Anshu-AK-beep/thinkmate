// src/contexts/AuthContext.tsx
// Provides auth state and actions to entire app.

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase }           from '@/lib/supabase'

interface AuthContextValue {
  user:              User | null
  session:           Session | null
  isLoading:         boolean
  signInWithGoogle:  () => Promise<void>
  signInWithEmail:   (email: string, password: string, isSignUp: boolean) => Promise<string | null>
  signOut:           () => Promise<void>
  getToken:          () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null)
  const [session,   setSession]   = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    })
  }, [])

  const signInWithEmail = useCallback(async (
    email:    string,
    password: string,
    isSignUp: boolean,
  ): Promise<string | null> => {
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) return error.message
    return null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  // Returns the current JWT — passed as Bearer token to Express
  const getToken = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  return (
    <AuthContext.Provider value={{
      user, session, isLoading,
      signInWithGoogle, signInWithEmail, signOut, getToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}