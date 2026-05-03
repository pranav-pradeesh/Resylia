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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
    .metric-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-value { font-family: 'DM Mono', monospace; font-size: 2.5rem; font-weight: 600; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .metric-label { color: #64748b; font-size: 0.875rem; font-weight: 500; margin-top: 4px; }
    .chart-container { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .risk-factor { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .risk-factor:last-child { border-bottom: none; }
    .risk-bar { width: 200px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .risk-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%); transition: width 0.3s ease; }
    .period-selector { display: flex; gap: 2px; background: #e2e8f0; padding: 4px; border-radius: 8px; }
    .period-btn { padding: 8px 16px; border: none; background: transparent; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .period-btn.active { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  `

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <style>{styles}</style>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 rounded-2xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <style>{styles}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into employee wellness and burnout prevention</p>
          
          {/* Period Selector */}
          <div className="period-selector mt-6">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                className={`period-btn ${period === days ? 'active' : ''}`}
                onClick={() => setPeriod(days)}
              >
                {days === 7 ? '7 days' : days === 30 ? '30 days' : days === 90 ? '90 days' : '1 year'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <div className="metric-value">{data?.total_employees || 0}</div>
            <div className="metric-label">Total Employees</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data?.daily_participants || 0}</div>
            <div className="metric-label">Daily Check-ins</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data?.participation_rate || 0}%</div>
            <div className="metric-label">Participation Rate</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data?.avg_burnout_risk || 0}</div>
            <div className="metric-label">Avg Burnout Risk</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* High Risk Trend */}
          <div className="chart-container">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">High Risk Trend</h3>
            <div className="space-y-4">
              {data?.high_risk_trend?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.date}</span>
                  <span className="text-lg font-semibold text-red-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team Health Distribution */}
          <div className="chart-container">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Team Health Distribution</h3>
            <div className="space-y-4">
              {data?.team_health_distribution?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.level}</span>
                  <span className="text-lg font-semibold text-green-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Risk Factors */}
        <div className="chart-container mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Risk Factors</h3>
          <div className="space-y-4">
            {data?.top_risk_factors?.map((item, index) => (
              <div key={index} className="risk-factor">
                <span className="text-sm font-medium text-gray-700">{item.factor}</span>
                <div className="flex items-center gap-4">
                  <div className="risk-bar">
                    <div 
                      className="risk-fill" 
                      style={{ width: `${Math.min(item.score * 10, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Risk */}
        <div className="chart-container mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Retention Risk</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.retention_risk?.map((item, index) => (
              <div key={index} className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{item.count}</div>
                <div className="text-sm text-gray-600">{item.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}