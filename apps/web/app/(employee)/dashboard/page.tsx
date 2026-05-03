'use client'

import { useEffect, useState } from 'react'

interface UserStats {
  lastCheckin: string | null
  currentEnergy: number
  currentStress: number
  moodStreak: number
  ptoPlanned: boolean
  nextPtoDate: string | null
  daysWithoutBreak: number
  weeklyMeetings: number
  focusTimeToday: number
  peerMatchAvailable: boolean
}

const quickActions = [
  { icon: '⚡', label: 'Quick Check-in', href: '/(employee)/checkin' as const, color: 'bg-emerald-50 hover:bg-emerald-100' },
  { icon: '🎯', label: 'Focus Time', href: '/employee/focus' as const, color: 'bg-purple-50 hover:bg-purple-100' },
  { icon: '📅', label: 'Skip Meetings', href: '/employee/meeting-fatigue' as const, color: 'bg-blue-50 hover:bg-blue-100' },
  { icon: '🗓️', label: 'Plan PTO', href: '/employee/pto' as const, color: 'bg-cyan-50 hover:bg-cyan-100' },
  { icon: '🤝', label: 'Find Peer', href: '/employee/peers' as const, color: 'bg-amber-50 hover:bg-amber-100' },
  { icon: '📊', label: 'My Insights', href: '/employee/insights' as const, color: 'bg-rose-50 hover:bg-rose-100' },
] as const

type QuickAction = typeof quickActions[number]

function QuickActionLink({ action }: { action: QuickAction }) {
  return (
    <a href={action.href} className={`block ${action.color} rounded-2xl p-4 transition-all hover:scale-[1.02]`}>
      <span className="text-2xl">{action.icon}</span>
      <p className="text-sm font-medium text-gray-700 mt-1">{action.label}</p>
    </a>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="animate-pulse h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="bg-emerald-500 rounded-2xl p-6 mb-6 h-40 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl p-4 h-64 animate-pulse" />
      </div>
    </div>
  )
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employee/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600">How are you feeling today?</p>
        </div>

        {/* Wellness Score Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Wellness Score</h2>
            <span className="text-3xl">🌟</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-emerald-100 text-sm">Energy Level</p>
              <p className="text-2xl font-bold">{data?.currentEnergy || 0}/10</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Stress Level</p>
              <p className="text-2xl font-bold">{data?.currentStress || 0}/10</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <QuickActionLink key={action.label} action={action} />
            ))}
          </div>
        </div>

        {/* Health Stats */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Health Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mood Streak</span>
              <span className="font-semibold text-gray-900">{data?.moodStreak || 0} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Days Without Break</span>
              <span className="font-semibold text-gray-900">{data?.daysWithoutBreak || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Weekly Meetings</span>
              <span className="font-semibold text-gray-900">{data?.weeklyMeetings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Focus Time Today</span>
              <span className="font-semibold text-gray-900">{data?.focusTimeToday || 0}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">PTO Planned</span>
              <span className="font-semibold text-gray-900">
                {data?.ptoPlanned ? 'Yes' : 'No'}
              </span>
            </div>
            {data?.nextPtoDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Next PTO</span>
                <span className="font-semibold text-gray-900">{data.nextPtoDate}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Peer Match Available</span>
              <span className="font-semibold text-gray-900">
                {data?.peerMatchAvailable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}