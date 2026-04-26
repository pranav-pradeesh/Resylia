'use client'
import { useEffect, useState } from 'react'

interface HRAnalytics {
  total_employees?: number
  daily_participants?: number
  participation_rate?: number
  avg_burnout_risk?: number
  high_risk_trend?: { date: string; count: number }[]
  team_health_distribution?: { level: string; count: number }[]
  top_risk_factors?: { factor: string; score: number }[]
  retention_risk?: { category: string; count: number }[]
}

export default function HRAnalyticsDashboard() {
  const [data, setData] = useState<HRAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/hr/analytics?days=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&display=swap');
    * { box-sizing:border-box; }
    body { font-family:'DM Mono',monospace; background:#0a0a0f; color:#f1f0eb; }
    h1 { font-family:'DM Serif Display',serif; font-size:36px; letter-spacing:-1px; margin-bottom:8px; }
    .subtitle { font-size:13px; color:#6b7280; margin-bottom:32px; }
    .period-selector { display:flex; gap:8px; margin-bottom:32px; }
    .btn { padding:8px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:#9ca3af; font-family:'DM Mono',monospace; font-size:12px; cursor:pointer; transition:all 0.15s; }
    .btn.active { border-color:#f59e0b; color:#f59e0b; background:rgba(245,158,11,0.08); }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:32px; }
    .card { background:#111118; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:24px; }
    .stat { font-family:'DM Serif Display',serif; font-size:40px; letter-spacing:-1px; margin-bottom:4px; }
    .label { font-size:11px; color:#6b7280; letter-spacing:1px; text-transform:uppercase; }
    .chart { background:#111118; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:24px; margin-bottom:24px; }
    .chart-title { font-size:13px; color:#9ca3af; margin-bottom:20px; }
    .risk-level-low { color:#86efac; }
    .risk-level-medium { color:#fbbf24; }
    .risk-level-high { color:#f87171; }
  `

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: '#0a0a0f', minHeight: '100vh', color: '#f1f0eb', padding: '32px' }}>
      <style>{styles}</style>

      <h1>HR Analytics</h1>
      <div className="subtitle">Organization-wide employee wellness insights</div>

      <div className="period-selector">
        {[7, 14, 30, 90].map((p) => (
          <button
            key={p}
            className={`btn ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            Last {p} days
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#6b7280' }}>Loading analytics…</div>}

      {!loading && data && (
        <>
          {/* Key Metrics */}
          <div className="grid">
            <div className="card">
              <div className="stat">{data.total_employees || 0}</div>
              <div className="label">Total Employees</div>
            </div>
            <div className="card">
              <div className="stat">{((data.participation_rate ?? 0) * 100).toFixed(0)}%</div>
              <div className="label">Participation Rate</div>
            </div>
            <div className="card">
              <div className="stat">{data.daily_participants || 0}</div>
              <div className="label">Daily Participants</div>
            </div>
            <div className="card">
              <div className={`stat ${(data.avg_burnout_risk ?? 0) > 0.6 ? 'risk-level-high' : 'risk-level-medium'}`}>
                {((data.avg_burnout_risk ?? 0) * 100).toFixed(0)}%
              </div>
              <div className="label">Avg Burnout Risk</div>
            </div>
          </div>

          {/* Health Distribution */}
          {data.team_health_distribution && (
            <div className="chart">
              <div className="chart-title">Team Health Distribution</div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-around' }}>
                {data.team_health_distribution.map((item) => {
                  let color = '#86efac'
                  if (item.level === 'medium') color = '#fbbf24'
                  if (item.level === 'high') color = '#f87171'
                  
                  return (
                    <div key={item.level} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', color, marginBottom: '8px' }}>{item.count}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>
                        {item.level} Risk
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* High Risk Trend */}
          {data.high_risk_trend && data.high_risk_trend.length > 0 && (
            <div className="chart">
              <div className="chart-title">High Risk Employees Trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                {data.high_risk_trend.map((item) => (
                  <div key={item.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max((item.count / 10) * 80, 4)}px`,
                        background: '#f87171',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <div style={{ fontSize: '9px', color: '#4b5563' }}>{item.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Risk Factors */}
          {data.top_risk_factors && data.top_risk_factors.length > 0 && (
            <div className="chart">
              <div className="chart-title">Top Risk Factors</div>
              <div>
                {data.top_risk_factors.map((factor) => (
                  <div key={factor.factor} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px' }}>{factor.factor}</div>
                    <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>
                      {(factor.score * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retention Risk */}
          {data.retention_risk && data.retention_risk.length > 0 && (
            <div className="chart">
              <div className="chart-title">Retention Risk</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {data.retention_risk.map((item) => (
                  <div
                    key={item.category}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{item.count}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
