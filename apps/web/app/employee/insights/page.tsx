'use client'

import { useState, useEffect } from 'react'

interface InsightData {
  energyTrend: 'up' | 'down' | 'stable'
  stressTrend: 'up' | 'down' | 'stable'
  avgEnergy: number
  avgStress: number
  bestDay: string
  worstDay: string
  meetingHours: number
  focusHours: number
  checkinStreak: number
  tips: string[]
  weeklyData: { day: string; energy: number; stress: number }[]
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setData({
        energyTrend: 'stable',
        stressTrend: 'stable',
        avgEnergy: 3.2,
        avgStress: 2.8,
        bestDay: 'Tuesday',
        worstDay: 'Monday',
        meetingHours: 18,
        focusHours: 12,
        checkinStreak: 5,
        tips: [
          'Your energy peaks mid-week. Schedule important tasks for Tuesday-Thursday.',
          'You work 6+ hours in meetings on Mondays. Try declining 1 optional meeting.',
          'It\'s been 15 days since your last break. Consider planning some PTO.',
        ],
        weeklyData: [
          { day: 'Mon', energy: 2.5, stress: 3.5 },
          { day: 'Tue', energy: 3.5, stress: 2.5 },
          { day: 'Wed', energy: 3.8, stress: 2.2 },
          { day: 'Thu', energy: 3.2, stress: 2.8 },
          { day: 'Fri', energy: 2.8, stress: 3.0 },
        ],
      })
      setLoading(false)
    }, 1000)
  }, [])

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '→'
    }
  }

  const getScale = (value: number) => (value / 5) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-2">Analyzing your data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">📊</span>
          <p className="text-gray-500 mt-2">No data yet. Complete check-ins to see insights.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Insights 📊</h1>
        <p className="text-gray-500">Trends, patterns, and tips for you</p>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">This Week</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Avg Energy</p>
              <p className="text-2xl font-bold text-gray-800">{data.avgEnergy.toFixed(1)}</p>
              <p className="text-xs">{getTrendEmoji(data.energyTrend)} {data.energyTrend}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Avg Stress</p>
              <p className="text-2xl font-bold text-gray-800">{data.avgStress.toFixed(1)}</p>
              <p className="text-xs">{getTrendEmoji(data.stressTrend)} {data.stressTrend}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1 h-2">
              {data.weeklyData.map((d, i) => (
                <div key={i} className="flex-1 bg-emerald-500 rounded-full" style={{ height: `${getScale(d.energy)}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              {data.weeklyData.map(d => <span key={d.day}>{d.day}</span>)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Patterns</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2"><span>✅</span><span className="text-sm text-gray-700">Best day</span></div>
              <span className="font-medium text-emerald-700">{data.bestDay}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2"><span>⚠️</span><span className="text-sm text-gray-700">Most stressful</span></div>
              <span className="font-medium text-amber-700">{data.worstDay}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-2"><span>📅</span><span className="text-sm text-gray-700">Meeting hours</span></div>
              <span className="font-medium text-purple-700">{data.meetingHours}h/week</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Check-in Streak</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">🔥</span>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{data.checkinStreak}</p>
              <p className="text-sm text-gray-500">days</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Tips For You</h3>
          <div className="space-y-2">
            {data.tips.map((tip, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 mt-4 text-white text-center">
          <p className="font-medium">Keep checking in!</p>
          <p className="text-sm text-emerald-100">More data = better insights</p>
        </div>
      </div>
    </div>
  )
}