'use client'
import { useState } from 'react'
import { signInWithOAuth } from '@/lib/auth/client'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuth(provider: 'google' | 'slack') {
    setLoading(provider)
    setError(null)
    try {
      await signInWithOAuth(provider)
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.')
      setLoading(null)
    }
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
        .footer-link { text-align:center; font-size:12px; color:#6b7280; margin-top:32px; }
        .footer-link a { color:#f59e0b; text-decoration:none; }
      `}</style>

      <div className="card">
        <div className="logo">Resylia<span>.</span></div>
        <div className="tagline">Burnout intelligence platform</div>

        <button
          className="oauth-btn"
          onClick={() => handleOAuth('google')}
          disabled={!!loading}
        >
          <GoogleIcon />
          {loading === 'google' ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <button
          className="oauth-btn"
          onClick={() => handleOAuth('slack')}
          disabled={!!loading}
        >
          <SlackIcon />
          {loading === 'slack' ? 'Redirecting...' : 'Continue with Slack'}
        </button>

        {error && <div className="error">{error}</div>}

        <div className="footer-link">
          New to Resylia? <a href="/signup">Start your free trial →</a>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function SlackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 54 54">
      <path fill="#36C5F0" d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"/>
      <path fill="#2EB67D" d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"/>
      <path fill="#ECB22E" d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"/>
      <path fill="#E01E5A" d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387"/>
    </svg>
  )
}
