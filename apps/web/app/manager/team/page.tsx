'use client'

import { useEffect, useState } from 'react'

interface Intervention {
  id: string
  employeeId: string
  employeeName: string
  type: 'checkin_reminder' | 'one_on_one' | ' workload_review' | 'pto_encouragement' | 'burnout_alert'
  status: 'pending' | 'completed' | 'dismissed'
  createdAt: string
  completedAt?: string
  notes?: string
}

interface TeamMember {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical'
  lastCheckin: string
  riskScore: number
  canCreateIntervention: boolean
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/manager/team')
      .then(r => r.json())
      .then(d => {
        setTeam(d.team || [])
        setInterventions(d.interventions || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500'
      case 'warning': return 'bg-amber-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const createIntervention = async (memberId: string, type: string) => {
    try {
      const res = await fetch('/api/manager/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, type }),
      })
      if (res.ok) {
        const newIntervention = await res.json()
        setInterventions(prev => [newIntervention, ...prev])
      }
    } catch (err) {
      console.error('Failed to create intervention:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Team Overview</h1>
        <p className="text-gray-400 mb-8">Manage your team's wellbeing</p>

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Team Members</h2>
          <div className="space-y-3">
            {team.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(member.status)}`} />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-gray-400 text-sm">
                      Last check-in: {member.lastCheckin}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    Risk: {(member.riskScore * 100).toFixed(0)}%
                  </span>
                  {member.canCreateIntervention && (
                    <select
                      className="bg-gray-600 text-white text-sm px-3 py-1 rounded"
                      onChange={(e) => {
                        if (e.target.value) {
                          createIntervention(member.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">+ Action</option>
                      <option value="checkin_reminder">Send Reminder</option>
                      <option value="one_on_one">Schedule 1:1</option>
                      <option value="workload_review">Review Workload</option>
                      <option value="pto_encouragement">Encourage PTO</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {interventions.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Interventions</h2>
            <div className="space-y-3">
              {interventions.map(interv => (
                <div
                  key={interv.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{interv.employeeName}</div>
                    <div className="text-gray-400 text-sm">{interv.type.replace('_', ' ')}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      interv.status === 'completed' ? 'bg-green-900 text-green-300' :
                      interv.status === 'pending' ? 'bg-amber-900 text-amber-300' :
                      'bg-gray-600'
                    }`}
                  >
                    {interv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}