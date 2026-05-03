'use client'

import { useState } from 'react'
import { requireFeature, createPlanErrorResponse, type Plan } from '@resylia/shared'

interface LockedFeatureProps {
  children: React.ReactNode
  currentPlan: Plan
  requiredFeature: string
  className?: string
  tooltip?: string
}

export default function LockedFeature({ 
  children, 
  currentPlan, 
  requiredFeature, 
  className = '',
  tooltip 
}: LockedFeatureProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const check = requireFeature(currentPlan, requiredFeature as any)
  
  if ('allowed' in check && check.allowed) {
    return <div className={className}>{children}</div>
  }

  const upgradePlan = ('upgradePlan' in check) ? check.upgradePlan : 'pro'
  const customTooltip = tooltip || `This feature is available on ${upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)} plan. Upgrade to unlock ${requiredFeature}.`

  return (
    <div className={className}>
      {/* Locked state */}
      <div 
        className="relative cursor-not-allowed opacity-50"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowModal(true)
        }}
      >
        {/* Lock icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-20 rounded-lg">
          <div className="bg-white rounded-full p-2 shadow-lg border border-gray-200">
            <span className="text-gray-600 text-lg">🔒</span>
          </div>
        </div>
        
        {/* Original content (grayed out) */}
        <div className="filter grayscale pointer-events-none">
          {children}
        </div>
        
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute z-50 w-64 p-3 mt-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg shadow-lg">
            {customTooltip}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upgrade to {upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)} Plan
              </h3>
              <p className="text-gray-600">
                {customTooltip}
              </p>
            </div>
            
            <div className="mb-6 space-y-2">
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span>Unlocked: {requiredFeature}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span>Full access to all {upgradePlan} features</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/pricing'}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Upgrade to {upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}