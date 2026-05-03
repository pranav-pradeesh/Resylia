'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface PTORequest {
  id: string
  startDate: string
  endDate: string
  days: number
  status: string
  type: string
}

const ptoTypes = [
  { id: 'vacation', emoji: '🏖️', label: 'Vacation' },
  { id: 'sick', emoji: '🤒', label: 'Sick' },
  { id: 'personal', emoji: '🏠', label: 'Personal' },
  { id: 'mental_health', emoji: '🧘', label: 'Mental Health' },
]

export default function PTOPlannerPage() {
  const [requests, setRequests] = useState<PTORequest[]>([])
  const [showRequest, setShowRequest] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [balance, setBalance] = useState({ total: 20, used: 5, planned: 0 })

  const days = startDate && endDate ? Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
  const remaining = balance.total - balance.used - balance.planned

  const submitRequest = () => {
    if (!selectedType || !startDate || !endDate) return
    setRequests([...requests, { id: Date.now().toString(), startDate, endDate, days, status: 'pending', type: selectedType }])
    setShowRequest(false)
    setBalance({ ...balance, planned: balance.planned + days })
  }

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay() + i)
    return date
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Plan Your Time Off 🗓️</h1>
        <p className="text-gray-500">Plan ahead, stay recharged</p>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">PTO Balance</span>
            <span className="text-sm text-gray-500">{remaining} days remaining</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(balance.used / balance.total) * 100}%` }} />
            </div>
            <span className="text-lg font-bold text-gray-800">{remaining}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Calendar</h3>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-xs text-gray-400 font-medium">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString()
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                return (
                  <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                    isToday ? 'bg-emerald-500 text-white font-bold' : isWeekend ? 'text-gray-300' : 'text-gray-700'
                  }`}>{d.getDate()}</div>
                )
              })}
            </div>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Your Requests</h3>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{ptoTypes.find(t => t.id === req.type)?.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{req.days} day(s)</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>{req.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setShowRequest(!showRequest)}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold mt-4 hover:bg-emerald-600">
          {showRequest ? 'Cancel' : '+ Request Time Off'}
        </button>

        {showRequest && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4">
            <h3 className="font-semibold text-gray-800 mb-3">New Request</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {ptoTypes.map((type) => (
                <button key={type.id} onClick={() => setSelectedType(type.id)}
                  className={`p-2 rounded-xl text-left transition-all ${
                    selectedType === type.id ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <span className="text-lg">{type.emoji}</span>
                  <p className="text-sm font-medium text-gray-700">{type.label}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
            {days > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center mb-3">
                <p className="text-lg font-bold text-gray-800">{days}</p>
                <p className="text-sm text-gray-500">day(s)</p>
              </div>
            )}
            <button onClick={submitRequest} disabled={!selectedType || !startDate || !endDate}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50">
              Submit Request
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}