'use client'
import { useState } from 'react'
import { signInWithOAuth, signInWithEmail, createClient } from '@/lib/auth/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()

  async function handleOAuth(provider: 'google' | 'slack') {
    setLoading(provider)
    setError(null)
    try {
      await signInWithOAuth(provider)
    } catch (err: any) {
      setError(err?.message || 'Sign-up failed. Please try again.')
      setLoading(null)
    }
  }

  async function handleEmailSignup() {
    setLoading('email')
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth`
        }
      })
      if (error) throw error
      setMagicLinkSent(true)
    } catch (err: any) {
      setError(err?.message || 'Sign-up failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (magicLinkSent) {
    return (
      <div style={{
        fontFamily: "'DM Mono', monospace",
        background: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f1f0eb',
      }}>
        <div style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '48px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ marginBottom: '16px' }}>Check your email!</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            We sent a magic link to <strong>{email}</strong>
          </p>
          <Link href="/login" style={{ color: '#f59e0b', textDecoration: 'none' }}>
            Back to login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      background: '#0a0a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f1f0eb',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&display=swap');
        * { box-sizing:border-box; }
        .card { background:#111118; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:48px; width:100%; max-width:400px; }
        .logo { font-family:'DM Serif Display',serif; font-size:28px; margin-bottom:8px; }
        .logo span { color:#f59e0b; }
        .tagline { font-size:13px; color:#6b7280; margin-bottom:40px; }
        .oauth-btn { width:100%; padding:14px 20px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#f1f0eb; font-family:'DM Mono',monospace; font-size:14px; cursor:pointer; display:flex; align-items:center; gap:12px; margin-bottom:12px; transition:background 0.2s; }
        .oauth-btn:hover { background:rgba(255,255,255,0.08); }
        .oauth-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .divider { text-align:center; font-size:12px; color:#4b5563; margin:24px 0; }
        .error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#fca5a5; padding:12px 16px; border-radius:8px; font-size:13px; margin-top:16px; }
        .input { width:100%; padding:14px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); color:#f1f0eb; font-family:'DM Mono',monospace; font-size:14px; margin-bottom:12px; }
        .input:focus { outline:none; border-color:#f59e0b; }
        .submit-btn { width:100%; padding:14px; border-radius:8px; border:none; background:#f59e0b; color:#0a0a0f; font-family:'DM Mono',monospace; font-size:14px; font-weight:500; cursor:pointer; }
        .submit-btn:hover { opacity:0.9; }
        .footer-link { text-align:center; font-size:12px; color:#6b7280; margin-top:32px; }
        .footer-link a { color:#f59e0b; text-decoration:none; }
      `}</style>

      <div className="card">
        <div className="logo">Resylia<span>.</span></div>
        <div className="tagline">Start your 14-day free trial</div>

        <button
          className="oauth-btn"
          onClick={() => handleOAuth('google')}
          disabled={loading === 'google'}
        >
          {loading === 'google' ? '⏳ Signing up...' : '🔵 Sign up with Google'}
        </button>

        <button
          className="oauth-btn"
          onClick={() => handleOAuth('slack')}
          disabled={loading === 'slack'}
        >
          {loading === 'slack' ? '⏳ Signing up...' : '🟣 Sign up with Slack'}
        </button>

        <div className="divider">OR</div>

        <input
          type="email"
          className="input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="submit-btn"
          onClick={handleEmailSignup}
          disabled={loading === 'email' || !email || !password}
        >
          {loading === 'email' ? 'Creating account...' : 'Create account with email'}
        </button>

        {error && <div className="error">{error}</div>}

        <div className="footer-link">
          Already have an account? <Link href="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  )
}