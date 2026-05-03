'use client'

import { useState } from 'react'

export default function FocusTimePage() {
  const [activeSession, setActiveSession] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [selectedType, setSelectedType] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [sessions, setSessions] = useState<{id: string, type: string, duration: number, completed: boolean}[]>([])

  const focusTypes = [
    { id: 'deep_work', emoji: '🎯', label: 'Deep Work', color: 'bg-purple-500' },
    { id: 'admin', emoji: '📧', label: 'Admin Work', color: 'bg-blue-500' },
    { id: 'learning', emoji: '📚', label: 'Learning', color: 'bg-emerald-500' },
    { id: 'creative', emoji: '💡', label: 'Creative', color: 'bg-amber-500' },
  ]

  const durations = [30, 60, 90, 120]

  const startSession = () => {
    if (!selectedType) return
    setActiveSession(true)
    setTimeRemaining(selectedDuration * 60)
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setActiveSession(false)
          setSessions([...sessions, { id: Date.now().toString(), type: selectedType, duration: selectedDuration, completed: true }])
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTodayFocusTime = () => sessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0)

  if (activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-purple-200 mb-2">{focusTypes.find(f => f.id === selectedType)?.label} Session</p>
          <div className="text-8xl font-bold mb-4">{formatTime(timeRemaining)}</div>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setActiveSession(false)} className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium">
              Cancel
            </button>
            <button onClick={() => { setActiveSession(false); setSessions([...sessions, { id: Date.now().toString(), type: selectedType, duration: selectedDuration, completed: true }]) }} className="px-6 py-3 bg-white text-purple-700 rounded-xl font-medium">
              Done Early ✓
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Focus Time 🎯</h1>
        <p className="text-gray-500">Protect blocks for what matters</p>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{getTodayFocusTime()}</p>
              <p className="text-xs text-purple-600">min today</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{sessions.length}</p>
              <p className="text-xs text-emerald-600">total sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">What do you need?</h3>
          <div className="grid grid-cols-2 gap-2">
            {focusTypes.map((type) => (
              <button key={type.id} onClick={() => setSelectedType(type.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedType === type.id ? 'bg-purple-100 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                <span className="text-xl">{type.emoji}</span>
                <p className="text-sm font-medium text-gray-700 mt-1">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <h3 className="font-semibold text-gray-800 mb-3">How long?</h3>
          <div className="flex gap-2">
            {durations.map((dur) => (
              <button key={dur} onClick={() => setSelectedDuration(dur)}
                className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                  selectedDuration === dur ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>{dur}m</button>
            ))}
          </div>
        </div>

        <button onClick={startSession} disabled={!selectedType}
          className="w-full py-4 bg-purple-500 text-white rounded-2xl font-semibold mt-4 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed">
          Start Focus Session →
        </button>

        {sessions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {sessions.slice(-5).reverse().map((session) => (
                <div key={session.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{focusTypes.find(f => f.id === session.type)?.emoji}</span>
                    <span className="text-sm font-medium text-gray-800">{focusTypes.find(f => f.id === session.type)?.label}</span>
                  </div>
                  <span className="text-sm text-gray-600">{session.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}