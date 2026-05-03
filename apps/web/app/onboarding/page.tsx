'use client'

import { useState, useEffect } from 'react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      const data = await response.json()
      
      if (data.onboarding_completed) {
        // Redirect to dashboard if already completed
        window.location.href = '/dashboard'
        return
      }
      
      setOrganization(data.organization)
      
      if (data.slack_connected) {
        setStep(2)
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      setError('Failed to load onboarding status')
    }
  }

  const handleConnectSlack = async () => {
    setLoading(true)
    try {
      // Check if organization is on the right plan
      if (organization?.plan === 'starter') {
        setError('Slack integration is available on Growth and Pro plans. [Upgrade to Growth](/pricing)')
        setLoading(false)
        return
      }

      // Initiate Slack OAuth flow for bot access
      const response = await fetch('/api/slack/bot-auth')
      const data = await response.json()
      
      if (data.auth_url) {
        window.location.href = data.auth_url
      }
    } catch (error) {
      console.error('Failed to start Slack auth:', error)
      setError('Failed to connect to Slack')
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skip_slack: true,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        window.location.href = '/dashboard'
      } else {
        setError('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setError('Failed to complete onboarding')
      setLoading(false)
    }
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Account Created</p>
                <p className="text-xs text-gray-500">Your workspace is ready</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Connect Slack Bot</p>
                <p className="text-xs text-gray-500">Optional - Setup daily check-ins</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > 3 ? '✓' : '3'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Invite Your Team</p>
                <p className="text-xs text-gray-500">Add team members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 Card - Connect Slack Bot */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Slack Bot
            </h2>
            <p className="text-gray-600 mb-6">
              Deliver check-ins directly in Slack DMs. No extra app to download.
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🎯</div>
              <div>
                <h3 className="font-semibold text-blue-900">Automated Daily Check-ins</h3>
                <p className="text-sm text-blue-700">Your team receives wellness check-ins in Slack DMs each morning</p>
              </div>
            </div>
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🤖</div>
              <div>
                <h3 className="font-semibold text-blue-900">Smart Manager Nudges</h3>
                <p className="text-sm text-blue-700">Managers get alerts when team members need support</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h3 className="font-semibold text-blue-900">Real-time Analytics</h3>
                <p className="text-sm text-blue-700">View team wellness metrics without leaving Slack</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              <div dangerouslySetInnerHTML={{ __html: error }} />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
            >
              Skip for now — I'll use email instead
            </button>
            
            <button
              onClick={handleConnectSlack}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : (
                'Connect Slack Workspace'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}