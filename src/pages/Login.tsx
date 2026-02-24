import { useState, type FormEvent } from 'react'
import { Navigate }   from 'react-router-dom'
import { useAuth }    from '@/contexts/AuthContext'
import { Brain, Mail, Lock, Chrome, Eye, EyeOff, ArrowRight } from 'lucide-react'

export function LoginPage() {
  const { user, isLoading, signInWithGoogle, signInWithEmail } = useAuth()

  const [mode,        setMode]        = useState<'signin' | 'signup'>('signin')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

  // Already logged in — go straight to app
  if (!isLoading && user) return <Navigate to="/app" replace />

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setError(null)
    setSuccessMsg(null)
    setSubmitting(true)

    const err = await signInWithEmail(email, password, mode === 'signup')
    setSubmitting(false)

    if (err) {
      setError(err)
    } else if (mode === 'signup') {
      setSuccessMsg('Account created! Check your email to confirm, then sign in.')
      setMode('signin')
    }
    // signin success → onAuthStateChange fires → redirect handled above
  }

  const handleGoogle = async () => {
    setError(null)
    await signInWithGoogle()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgb(var(--background))', padding: '24px 16px',
    }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius)',
          background: 'rgb(var(--primary))', color: 'rgb(var(--primary-foreground))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={22} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>
            ThinkMate
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>
            No answers. Only better questions.
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        padding: '32px 28px',
        borderRadius: 'var(--radius)',
        border: '1px solid rgb(var(--border))',
        background: 'rgb(var(--card))',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.375rem',
          fontWeight: 700, marginBottom: 6, textAlign: 'center',
        }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{
          fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))',
          textAlign: 'center', marginBottom: 24,
        }}>
          {mode === 'signin'
            ? 'Sign in to continue your learning journey'
            : 'Start reasoning better from today'}
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="flex items-center justify-center gap-3 w-full"
          style={{
            padding: '11px 16px', borderRadius: 'var(--radius)',
            border: '1.5px solid rgb(var(--border))',
            background: 'rgb(var(--background))',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            fontWeight: 500, fontSize: '0.9rem',
            color: 'rgb(var(--foreground))',
            transition: 'all 0.15s', marginBottom: 16,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--primary) / 0.4)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'}
        >
          <Chrome size={17} />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgb(var(--muted-foreground))' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'rgb(var(--muted-foreground))', pointerEvents: 'none',
            }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                borderRadius: 'var(--radius)',
                border: '1.5px solid rgb(var(--border))',
                background: 'rgb(var(--background))',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                color: 'rgb(var(--foreground))', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgb(var(--primary))'}
              onBlur={e  => (e.target as HTMLElement).style.borderColor = 'rgb(var(--border))'}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'rgb(var(--muted-foreground))', pointerEvents: 'none',
            }} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 36px 10px 36px',
                borderRadius: 'var(--radius)',
                border: '1.5px solid rgb(var(--border))',
                background: 'rgb(var(--background))',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                color: 'rgb(var(--foreground))', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgb(var(--primary))'}
              onBlur={e  => (e.target as HTMLElement).style.borderColor = 'rgb(var(--border))'}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgb(var(--muted-foreground))', padding: 2,
              }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Error / success */}
          {error && (
            <p style={{
              fontSize: '0.8125rem', color: 'rgb(var(--destructive))',
              padding: '8px 12px', borderRadius: 'var(--radius)',
              background: 'rgb(var(--destructive) / 0.08)',
              border: '1px solid rgb(var(--destructive) / 0.2)',
            }}>
              {error}
            </p>
          )}
          {successMsg && (
            <p style={{
              fontSize: '0.8125rem', color: 'rgb(var(--accent))',
              padding: '8px 12px', borderRadius: 'var(--radius)',
              background: 'rgb(var(--accent) / 0.08)',
              border: '1px solid rgb(var(--accent) / 0.2)',
            }}>
              {successMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2"
            style={{
              padding: '11px 16px', borderRadius: 'var(--radius)',
              background: submitting ? 'rgb(var(--muted))' : 'rgb(var(--primary))',
              color: submitting ? 'rgb(var(--muted-foreground))' : 'rgb(var(--primary-foreground))',
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem',
              boxShadow: submitting ? 'none' : 'var(--shadow-md)',
              transition: 'all 0.15s', marginTop: 4,
            }}
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Toggle mode */}
        <p style={{
          textAlign: 'center', marginTop: 20,
          fontSize: '0.875rem', color: 'rgb(var(--muted-foreground))',
        }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setSuccessMsg(null) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgb(var(--primary))', fontWeight: 600,
              fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              textDecoration: 'underline',
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}