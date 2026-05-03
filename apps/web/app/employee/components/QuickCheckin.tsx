'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const moods = [
  { emoji: '😊', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😩', label: 'Stressed', value: 'stressed' },
]
const emojis = ['😫', '😕', '😐', '🙂', '😊']

interface QuickCheckinProps {
  onComplete?: (data: CheckinData) => void
  compact?: boolean
}

interface CheckinData {
  energy: number
  stress: number
  mood: string
  note?: string
}

export default function QuickCheckin({ onComplete, compact = false }: QuickCheckinProps) {
  const [step, setStep] = useState(0)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(3)
  const [mood, setMood] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const data: CheckinData = { energy, stress, mood, note: note || undefined }
    
    if (onComplete) {
      onComplete(data)
    } else {
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) setJustCompleted(true)
      } catch (err) { console.error('Checkin failed:', err) }
    }
    setIsSubmitting(false)
  }

  if (justCompleted) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Check-in Complete!</h3>
        <p className="text-gray-600">Thanks for sharing how you're feeling.</p>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">How are you feeling?</span>
          <span className="text-xs text-gray-500">30 sec</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Energy</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button key={val} onClick={() => setEnergy(val)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    energy === val ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{val}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Stress</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button key={val} onClick={() => setStress(val)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    stress === val ? (val > 3 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{val}</button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Done ✓'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {step === 0 && (
        <motion.div key="step0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="text-center mb-6">
            <span className="text-4xl">⚡</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">How's your energy?</h3>
            <p className="text-sm text-gray-500">1 = drained, 5 = fully charged</p>
          </div>
          <div className="flex justify-center gap-2 mb-6">
            {emojis.map((emoji, i) => (
              <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => setEnergy(i + 1)}
                className={`w-14 h-14 rounded-2xl text-2xl transition-all ${
                  energy === i + 1 ? 'bg-emerald-500 ring-4 ring-emerald-200' : 'bg-gray-100 hover:bg-gray-200'
                }`}>{emoji}</motion.button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600">
            Continue →
          </button>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="text-center mb-6">
            <span className="text-4xl">🧠</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">Stress level?</h3>
            <p className="text-sm text-gray-500">1 = zen, 5 = overwhelmed</p>
          </div>
          <div className="flex justify-center gap-2 mb-6">
            {emojis.map((emoji, i) => (
              <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => setStress(i + 1)}
                className={`w-14 h-14 rounded-2xl text-2xl transition-all ${
                  stress === i + 1 ? (i + 1 > 3 ? 'bg-red-500 ring-4 ring-red-200' : 'bg-amber-500 ring-4 ring-amber-200') : 'bg-gray-100 hover:bg-gray-200'
                }`}>{emoji}</motion.button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">← Back</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600">Continue →</button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="text-center mb-6">
            <span className="text-4xl">😊</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">One word for your mood?</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {moods.map((m) => (
              <motion.button key={m.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setMood(m.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mood === m.value ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>{m.emoji} {m.label}</motion.button>
            ))}
          </div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional: Add a note"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">← Back</button>
            <button onClick={handleSubmit} disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Complete ✓'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}