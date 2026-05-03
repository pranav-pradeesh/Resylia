'use client'

import { useState } from 'react'

interface EscalationForm {
  department: string
  concern_type: 'safety' | 'harassment' | 'burnout' | 'toxic' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  issue_description: string
  affected_people: number
  timeframe: 'ongoing' | 'past_week' | 'past_month' | 'long_term'
  previous_reports: boolean
  preferred_contact: 'anonymous' | 'email' | 'phone'
  contact_info: string
}

export default function AnonymousEscalationPage() {
  const [form, setForm] = useState<EscalationForm>({
    department: '',
    concern_type: 'other',
    severity: 'medium',
    issue_description: '',
    affected_people: 1,
    timeframe: 'ongoing',
    previous_reports: false,
    preferred_contact: 'anonymous',
    contact_info: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [anonymousToken, setAnonymousToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/report-anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      setSubmitted(true)
      setAnonymousToken(data.escalation.anonymous_token)

      // Store token in session storage for later retrieval
      sessionStorage.setItem('escalation_token', data.escalation.anonymous_token)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusCheck = async () => {
    const token = sessionStorage.getItem('escalation_token') || anonymousToken
    if (!token) {
      setError('No escalation token found')
      return
    }

    try {
      const response = await fetch(`/api/report-anonymous?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status')
      }

      alert(`Status: ${data.escalation.status}\nSubmitted: ${data.escalation.submitted_at}`)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check status')
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✅</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Report Submitted Successfully
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your anonymous report has been submitted to our HR team. You will be contacted if additional information is needed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your Anonymous Token:</h3>
              <code className="text-sm bg-gray-200 px-3 py-2 rounded block break-all">
                {anonymousToken}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Save this token to check your report status
              </p>
            </div>
            
            <button
              onClick={handleStatusCheck}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3"
            >
              Check Report Status
            </button>
            
            <button
              onClick={() => setSubmitted(false)}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛡️</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Anonymous Workplace Report
            </h1>
            
            <p className="text-gray-600 mb-4">
              Your identity will remain anonymous. This report goes directly to HR leadership, bypassing local management.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p><strong>For immediate safety concerns, please contact local authorities or emergency services.</strong></p>
              <p className="mt-2">This system is monitored during business hours and responses may take up to 24 hours.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department (Optional, but helps us investigate)
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">I prefer not to say</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Concern Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Concern
              </label>
              <select
                value={form.concern_type}
                onChange={(e) => setForm({ ...form, concern_type: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="safety">Safety Concern</option>
                <option value="harassment">Harassment</option>
                <option value="burnout">Severe Burnout</option>
                <option value="toxic">Toxic Environment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'low', label: 'Low', color: 'gray' },
                  { value: 'medium', label: 'Medium', color: 'yellow' },
                  { value: 'high', label: 'High', color: 'orange' },
                  { value: 'critical', label: 'Critical', color: 'red' },
                ].map(({ value, label, color }) => (
                  <label key={value} className="relative">
                    <input
                      type="radio"
                      name="severity"
                      value={value}
                      checked={form.severity === value}
                      onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
                      className="sr-only"
                      required
                    />
                    <div className={`text-center py-3 px-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.severity === value
                        ? `border-${color}-500 bg-${color}-50`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please describe what happened
              </label>
              <textarea
                value={form.issue_description}
                onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide as much detail as you're comfortable sharing..."
                required
              />
            </div>

            {/* Additional Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many people are affected?
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.affected_people}
                  onChange={(e) => setForm({ ...form, affected_people: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeframe
                </label>
                <select
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="past_week">Past week</option>
                  <option value="past_month">Past month</option>
                  <option value="long_term">Long-term issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have you reported this before?
                </label>
                <select
                  value={form.previous_reports.toString()}
                  onChange={(e) => setForm({ ...form, previous_reports: e.target.value === 'true' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred contact method
                </label>
                <select
                  value={form.preferred_contact}
                  onChange={(e) => setForm({ ...form, preferred_contact: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="anonymous">Remain completely anonymous</option>
                  <option value="email">Email updates</option>
                  <option value="phone">Phone updates</option>
                </select>
              </div>
            </div>

            {/* Contact Info (if not anonymous) */}
            {form.preferred_contact !== 'anonymous' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <input
                  type={form.preferred_contact === 'email' ? 'email' : 'tel'}
                  value={form.contact_info}
                  onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={form.preferred_contact === 'email' ? 'your@email.com' : '+1 (555) 123-4567'}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This information will be encrypted and only used for this report
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors text-lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Anonymous Report'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              This system is designed to protect your anonymity while ensuring serious concerns are addressed.
              Reports are reviewed by HR leadership and appropriate action will be taken.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}