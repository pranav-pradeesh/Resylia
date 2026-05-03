'use client'

import { useEffect, useState } from 'react'

interface TeamMember {
  id: string
  name: string
  energy: number
  stress: number
  burnoutRisk: number
  lastCheckin: string
  status: 'healthy' | 'warning' | 'critical'
}

interface ManagerDashboard {
  teamSize: number
  avgEnergy: number
  avgStress: number
  atRiskCount: number
  needsAttention: TeamMember[]
  recentActivity: { date: string; checkins: number }[]
}

export default function ManagerDashboardPage() {
  const [data, setData] = useState<ManagerDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/manager/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#86efac'
      case 'warning': return '#fbbf24'
      case 'critical': return '#f87171'
      default: return '#6b7280'
    }
  }

  const getRiskLabel = (risk: number) => {
    if (risk > 0.6) return 'Critical'
    if (risk > 0.4) return 'Warning'
    return 'Healthy'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-2">Loading team data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Team Dashboard</h1>
          <p className="text-gray-400">Monitor your team's wellbeing</p>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold">{data.teamSize}</div>
                <div className="text-gray-400 text-sm">Team Members</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-emerald-400">{data.avgEnergy.toFixed(1)}</div>
                <div className="text-gray-400 text-sm">Avg Energy</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-amber-400">{data.avgStress.toFixed(1)}</div>
                <div className="text-gray-400 text-sm">Avg Stress</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-red-400">{data.atRiskCount}</div>
                <div className="text-gray-400 text-sm">At Risk</div>
              </div>
            </div>

            {data.needsAttention.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Needs Attention</h2>
                <div className="space-y-3">
                  {data.needsAttention.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(member.status) }}
                        />
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-gray-400 text-sm">
                            Last check-in: {member.lastCheckin}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium`} style={{ color: getStatusColor(member.status) }}>
                          {getRiskLabel(member.burnoutRisk)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          Risk: {(member.burnoutRisk * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/manager/team" className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm">View Team</div>
                </a>
                <a href="/manager/interventions" className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm">Interventions</div>
                </a>
                <button className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm">Schedule 1:1s</div>
                </button>
                <button className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition">
                  <div className="text-2xl mb-2">🔔</div>
                  <div className="text-sm">Send Reminder</div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}