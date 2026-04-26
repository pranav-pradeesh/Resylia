'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardData {
  streak: number
  checkins: { date: string; energy: number; stress: number; workload: number }[]
  last_checkin: string | null
  checked_in_today: boolean
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employee/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      background: '#0a0a0f',
      minHeight: '100vh',
      color: '#f1f0eb',
      padding: '32px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .layout { max-width: 680px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo { font-family: 'DM Serif Display', serif; font-size: 20px; letter-spacing: -0.5px; }
        .sign-out { font-size: 12px; color: #6b7280; text-decoration: none; }
        .sign-out:hover { color: #9ca3af; }
        .streak-block { text-align: center; padding: 40px 0; }
        .streak-num { font-family: 'DM Serif Display', serif; font-size: 80px; line-height: 1; color: #f59e0b; }
        .streak-unit { font-size: 13px; color: #6b7280; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
        .checkin-btn { display: block; width: 100%; padding: 18px; background: #f59e0b; color: #0a0a0f; border: none; border-radius: 12px; font-family: 'DM Mono', monospace; font-size: 15px; font-weight: 500; text-align: center; text-decoration: none; cursor: pointer; margin: 24px 0; transition: opacity 0.2s; }
        .checkin-btn:hover { opacity: 0.85; }
        .checkin-btn.done { background: rgba(34,197,94,0.12); color: #86efac; border: 1px solid rgba(34,197,94,0.25); cursor: default; }
        .checkin-btn.done:hover { opacity: 1; }
        .section-label { font-size: 11px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
        .chart-container { background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .chart-legend { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9ca3af; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .chart { display: flex; align-items: flex-end; gap: 6px; height: 100px; }
        .bar-group { flex: 1; display: flex; gap: 2px; align-items: flex-end; }
        .bar { flex: 1; border-radius: 2px 2px 0 0; transition: opacity 0.2s; min-height: 4px; }
        .bar:hover { opacity: 0.7; }
        .bar-date { text-align: center; font-size: 9px; color: #6b7280; margin-top: 6px; }
        .empty-state { text-align: center; padding: 40px; color: #6b7280; font-size: 13px; }
        .skeleton { background: rgba(255,255,255,0.05); border-radius: 8px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div className="layout">
        <div className="header">
          <div className="logo">Resylia</div>
          <a href="/auth/signout" className="sign-out">sign out</a>
        </div>

        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 200, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 160 }} />
          </div>
        ) : data ? (
          <>
            <div className="streak-block">
              <div className="streak-num">{data.streak > 0 ? `🔥${data.streak}` : '—'}</div>
              <div className="streak-unit">day streak</div>
            </div>

            {data.checked_in_today ? (
              <div className="checkin-btn done">✓ Checked in today</div>
            ) : (
              <Link href="/checkin" className="checkin-btn">
                Start today's check-in →
              </Link>
            )}

            <div className="chart-container">
              <div className="section-label">Your last 14 days</div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#f59e0b' }} />
                  stress
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#34d399' }} />
                  energy
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#818cf8' }} />
                  workload
                </div>
              </div>

              {data.checkins.length === 0 ? (
                <div className="empty-state">No check-ins yet. Start your streak today.</div>
              ) : (
                <>
                  <div className="chart">
                    {[...data.checkins].reverse().map((c, i) => (
                      <div key={i}>
                        <div className="bar-group">
                          <div className="bar" style={{ height: `${(c.stress / 5) * 90}px`, background: '#f59e0b' }} title={`Stress: ${c.stress}`} />
                          <div className="bar" style={{ height: `${(c.energy / 5) * 90}px`, background: '#34d399' }} title={`Energy: ${c.energy}`} />
                          <div className="bar" style={{ height: `${(c.workload / 5) * 90}px`, background: '#818cf8' }} title={`Workload: ${c.workload}`} />
                        </div>
                        <div className="bar-date">{c.date.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">Failed to load. Refresh the page.</div>
        )}
      </div>
    </div>
  )
}
