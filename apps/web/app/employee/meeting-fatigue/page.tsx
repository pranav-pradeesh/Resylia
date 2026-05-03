'use client'

import { useEffect, useState } from 'react'

interface MeetingLoadData {
  dailyAverage: number
  weeklyTotal: number
  meetingBlocking: boolean
  focusTimeRemaining: number
  recurringMeetings: number
  fatigueScore: number
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  fatigueIndicators: string[]
  recommendations: string[]
}

export default function MeetingFatiguePage() {
  const [data, setData] = useState<MeetingLoadData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employee/meeting-load')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#f59e0b'
      default: return '#22c55e'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-2">Analyzing meeting patterns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Fatigue Fighter ⚡</h1>
        <p className="text-gray-500">Take control of your calendar</p>

        {data && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
              <div className="text-center">
                <div
                  className="text-5xl font-bold"
                  style={{ color: getRiskColor(data.riskLevel) }}
                >
                  {data.fatigueScore}
                </div>
                <p className="text-gray-500 text-sm">Fatigue Score</p>
                <div className="mt-2 text-sm font-medium" style={{ color: getRiskColor(data.riskLevel) }}>
                  {data.riskLevel.toUpperCase()} RISK
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Your Meeting Load</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-800">{data.dailyAverage.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">hrs/day</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-800">{data.weeklyTotal}</p>
                  <p className="text-xs text-gray-500">hrs/week</p>
                </div>
              </div>
            </div>

            {data.meetingBlocking && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
                <p className="text-red-700 font-medium">⚠️ No Focus Time Left</p>
                <p className="text-red-600 text-sm mt-1">
                  Your calendar has almost no free time for deep work.
                </p>
              </div>
            )}

            {data.fatigueIndicators.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Fatigue Indicators</h3>
                <div className="space-y-2">
                  {data.fatigueIndicators.map((indicator, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span>⚠️</span>
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Recommendations</h3>
              <div className="space-y-2">
                {data.recommendations.length > 0 ? (
                  data.recommendations.map((rec, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-green-700">✅ Your meeting load looks healthy!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 mt-4 text-white text-center">
              <p className="font-medium">Quick Wins</p>
              <p className="text-sm text-purple-100">Decline 1 optional meeting today</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}