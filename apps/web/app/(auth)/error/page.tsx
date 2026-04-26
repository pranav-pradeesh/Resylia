'use client'
import Link from 'next/link'

export default function AuthErrorPage() {
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
        .error-icon { font-size:48px; margin-bottom:24px; }
        .error-text { color:#fca5a5; margin-bottom:24px; }
        .button { display:inline-block; padding:12px 24px; background:#f59e0b; color:#0a0a0f; border-radius:8px; text-decoration:none; font-weight:500; }
        .button:hover { background:#fbbf24; }
      `}</style>

      <div className="card">
        <div className="logo">Resylia<span>.</span></div>
        <div className="error-icon">❌</div>
        <div className="error-text">
          <p>Authentication failed. This could be because:</p>
          <ul style={{ fontSize: '13px', lineHeight: '1.6', color: '#d1d5db' }}>
            <li>The OAuth provider is not configured</li>
            <li>The redirect URL is not authorized</li>
            <li>The session expired</li>
          </ul>
        </div>
        <Link href="/login" className="button">← Back to Login</Link>
      </div>
    </div>
  )
}
