'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import QuickCheckin from '../components/QuickCheckin'
import Link from 'next/link'

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
    <Link href={action.href as any} className={`block ${action.color} rounded-2xl p-4 transition-all hover:scale-[1.02]`}>
      <span className="text-2xl">{action.icon}</span>
      <p className="text-sm font-medium text-gray-700 mt-1">{action.label}</p>
    </Link>
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
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EmployeeDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [showCheckin, setShowCheckin] = useState(false)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/employee/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleCheckinComplete = () => {
    setShowCheckin(false)
    fetchUserStats()
  }

  const getEnergyEmoji = (energy: number) => {
    if (energy >= 4) return '😊'
    if (energy >= 3) return '🙂'
    return '😐'
  }

  const getStressColor = (stress: number) => {
    if (stress <= 2) return 'text-emerald-600 bg-emerald-50'
    if (stress <= 3) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{greeting} 👋</h1>
          <p className="text-gray-500">Here's your wellness snapshot</p>
        </motion.div>

        {showCheckin && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <QuickCheckin onComplete={handleCheckinComplete} />
          </motion.div>
        )}

        {!showCheckin && stats?.lastCheckin && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Your current state</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl">{getEnergyEmoji(stats.currentEnergy)}</span>
                  <div>
                    <p className="text-2xl font-bold">Energy {stats.currentEnergy}/5</p>
                    <p className="text-emerald-100 text-sm">Last checked in {stats.moodStreak} days ago</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowCheckin(true)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium">
                Update ↻
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStressColor(stats.currentStress)}`}>
                  Stress: {stats.currentStress}/5
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {!stats?.lastCheckin && !showCheckin && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
            <span className="text-4xl">🌱</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">Start Your Check-in</h3>
            <p className="text-gray-500 text-sm mt-1">A 30-second pulse to track your wellness</p>
            <button onClick={() => setShowCheckin(true)} className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600">
              Quick Check-in ⚡
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
              <QuickActionLink action={action} />
            </motion.div>
          ))}
        </div>

        {stats && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Tips</h3>
            {stats.daysWithoutBreak > 20 && (
              <div className="bg-amber-50 rounded-xl p-3 mb-2">
                <div className="flex items-start gap-2">
                  <span>🛟</span>
                  <div>
                    <p className="text-sm font-medium text-amber-800">You've been working {stats.daysWithoutBreak} days without a break</p>
                    <Link href="/employee/pto" className="text-xs text-amber-700 font-medium underline">Plan now →</Link>
                  </div>
                </div>
              </div>
            )}
            {stats.weeklyMeetings > 20 && (
              <div className="bg-purple-50 rounded-xl p-3 mb-2">
                <div className="flex items-start gap-2">
                  <span>🎯</span>
                  <div>
                    <p className="text-sm font-medium text-purple-800">{stats.weeklyMeetings}h in meetings this week</p>
                    <Link href="/employee/meeting-fatigue" className="text-xs text-purple-700 font-medium underline">Block focus time →</Link>
                  </div>
                </div>
              </div>
            )}
            {stats.peerMatchAvailable && (
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span>🤝</span>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Someone wants to connect</p>
                    <Link href="/employee/peers" className="text-xs text-blue-700 font-medium underline">See who →</Link>
                  </div>
                </div>
              </div>
            )}
            {stats.daysWithoutBreak <= 20 && !stats.peerMatchAvailable && stats.weeklyMeetings <= 20 && (
              <p className="text-gray-500 text-sm">You're doing great! Keep it up.</p>
            )}
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <Link href="/employee/insights" className="text-sm text-gray-500 hover:text-gray-700">View detailed insights →</Link>
        </div>
      </div>
    </div>
  )
}