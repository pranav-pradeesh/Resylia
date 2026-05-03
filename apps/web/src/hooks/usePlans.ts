import { useState, useEffect } from 'react'
import { type Plan, hasFeature, requireFeature } from '@resylia/shared'

export function usePlans() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('starter')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    fetchCurrentPlan()
  }, [])
  
  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/organizations/current')
      const data = await response.json()
      
      if (data.success) {
        setCurrentPlan(data.organization.plan)
      } else {
        setError('Failed to fetch plan information')
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error)
      setError('Failed to fetch plan information')
    } finally {
      setLoading(false)
    }
  }
  
  const canAccess = (feature: string) => {
    if (loading) return false
    return hasFeature(currentPlan, feature as any)
  }
  
  const getFeatureStatus = (feature: string) => {
    if (loading) return { allowed: false, loading: true }
    return requireFeature(currentPlan, feature as any)
  }
  
  return {
    currentPlan,
    loading,
    error,
    canAccess,
    getFeatureStatus,
    refreshPlan: fetchCurrentPlan,
  }
}