'use client'

import { useState } from 'react'

export default function EmployeeCheckinPage() {
  const [energy, setEnergy] = useState(5)
  const [stress, setStress] = useState(5)
  const [mood, setMood] = useState('neutral')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/employee/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          energy,
          stress,
          mood,
          notes,
        }),
      })

      if (response.ok) {
        alert('Check-in submitted successfully!')
        // Redirect to dashboard
        window.location.href = '/(employee)/dashboard'
      } else {
        alert('Failed to submit check-in')
      }
    } catch (error) {
      alert('Error submitting check-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Check-in</h1>
          <p className="text-gray-600">How are you feeling today?</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Energy Level (1-10)
              </label>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Low</span>
                <span className="text-sm text-gray-500">High</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-blue-600">{energy}</span>
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stress Level (1-10)
              </label>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Low</span>
                <span className="text-sm text-gray-500">High</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-red-600">{stress}</span>
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Current Mood
              </label>
              <div className="flex justify-around">
                {['😢', '😔', '😐', '🙂', '😊'].map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setMood(['sad', 'down', 'neutral', 'good', 'happy'][index])}
                    className={`text-3xl p-2 rounded-lg transition-colors ${
                      mood === ['sad', 'down', 'neutral', 'good', 'happy'][index]
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How was your day? Any challenges or wins?"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Check-in'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            This check-in takes less than 30 seconds and helps us understand how you're doing.
          </p>
        </div>
      </div>
    </div>
  )
}