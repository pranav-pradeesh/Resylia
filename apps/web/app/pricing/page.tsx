'use client'

import { useState, useEffect } from 'react'
import { PLANS, calculatePrice, type Plan } from '@resylia/shared'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [seatCounts, setSeatCounts] = useState({
    starter: 10,
    growth: 10,
    pro: '10'
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleSeatChange = (plan: Plan, value: string | number) => {
    const numValue = typeof value === 'string' ? parseInt(value) : value
    const planConfig = PLANS[plan]
    
    if (planConfig.max_seats && numValue > planConfig.max_seats) {
      setErrors({ ...errors, [plan]: `${planConfig.name} plan supports up to ${planConfig.max_seats} seats. Upgrade to ${plan === 'starter' ? 'Growth' : 'Pro'} for more.` })
      setSeatCounts({ ...seatCounts, [plan]: planConfig.max_seats })
      return
    }
    
    if (numValue < 1) {
      setErrors({ ...errors, [plan]: 'Minimum 1 seat' })
      setSeatCounts({ ...seatCounts, [plan]: 1 })
      return
    }
    
    setErrors({ ...errors, [plan]: '' })
    setSeatCounts({ ...seatCounts, [plan]: value })
  }

  const getPriceInfo = (plan: Plan) => {
    const seats = typeof seatCounts[plan] === 'string' ? parseInt(seatCounts[plan] as string) : seatCounts[plan] as number
    const { price, isCapReached } = calculatePrice(plan, seats, billingCycle)
    const perSeat = billingCycle === 'annual' ? PLANS[plan].annual_per_seat : PLANS[plan].monthly_per_seat
    const cap = billingCycle === 'annual' ? PLANS[plan].annual_cap : PLANS[plan].monthly_cap
    
    return {
      perSeat,
      totalPrice: price,
      displayPrice: billingCycle === 'annual' ? Math.round(price / 12) : price,
      capReached: isCapReached,
      cap,
      seats
    }
  }

  const PricingCard = ({ plan, mostPopular = false }: { plan: Plan; mostPopular?: boolean }) => {
    const planConfig = PLANS[plan]
    const priceInfo = getPriceInfo(plan)
    
    return (
      <div className={`relative bg-white rounded-2xl shadow-lg p-8 ${mostPopular ? 'ring-2 ring-blue-500' : ''}`}>
        {mostPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </span>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{planConfig.name}</h3>
          <p className="text-gray-600">{getPlanDescription(plan)}</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline mb-4">
            <div className="flex items-center">
              <span className="text-4xl font-bold text-blue-600">₹{priceInfo.displayPrice}</span>
              <span className="text-gray-500 ml-2">per seat / month</span>
            </div>
            {billingCycle === 'annual' && (
              <div className="flex items-center ml-3">
                <span className="text-gray-400 line-through">₹{PLANS[plan].monthly_per_seat}</span>
                <span className="ml-2 text-green-600 font-semibold">Save 20%</span>
              </div>
            )}
          </div>
          
          {planConfig.monthly_cap && billingCycle === 'monthly' && (
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
              Never more than ₹{planConfig.monthly_cap}/month
              {priceInfo.capReached && (
                <span className="block mt-1">✓ Capped at ₹{planConfig.monthly_cap}/month</span>
              )}
            </div>
          )}
          
          {!planConfig.max_seats && (
            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
              Contact us for 100+ seats
            </div>
          )}
        </div>
        
        {/* Seat Calculator */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How many employees?
          </label>
          <div className="flex items-center">
            <input
              type={planConfig.max_seats ? "number" : "text"}
              min={1}
              max={planConfig.max_seats || undefined}
              value={seatCounts[plan]}
              onChange={(e) => handleSeatChange(plan, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of seats"
            />
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            {priceInfo.seats} seats × ₹{priceInfo.perSeat} = ₹{priceInfo.totalPrice.toLocaleString()}/{billingCycle === 'annual' ? 'year' : 'month'}
          </div>
          
          {errors[plan] && (
            <div className="mt-2 text-sm text-red-600">{errors[plan]}</div>
          )}
          
          {billingCycle === 'annual' && (
            <div className="mt-2 text-sm text-green-600">
              Effective monthly: ₹{priceInfo.displayPrice.toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Feature List */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xl">✓</span>
            <span className="text-gray-700">Daily check-ins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xl">✓</span>
            <span className="text-gray-700">Burnout score</span>
            {plan === 'starter' && <span className="text-xs text-gray-500 ml-2">(rule-based)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={planConfig.features.ai_explanation ? "text-green-500 text-xl" : "text-gray-400 text-xl"}>
              {planConfig.features.ai_explanation ? "✓" : "✗"}
            </span>
            <span className={planConfig.features.ai_explanation ? "text-gray-700" : "text-gray-400"}>
              AI-powered explanations
            </span>
            {plan !== 'starter' && <span className="text-xs text-blue-500 ml-2">(with Groq)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={planConfig.features.manager_nudges ? "text-green-500 text-xl" : "text-gray-400 text-xl"}>
              {planConfig.features.manager_nudges ? "✓" : "✗"}
            </span>
            <span className={planConfig.features.manager_nudges ? "text-gray-700" : "text-gray-400"}>
              Manager nudges
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={planConfig.features.slack_bot ? "text-green-500 text-xl" : "text-gray-400 text-xl"}>
              {planConfig.features.slack_bot ? "✓" : "✗"}
            </span>
            <span className={planConfig.features.slack_bot ? "text-gray-700" : "text-gray-400"}>
              Slack bot integration
            </span>
          </div>
          {planConfig.features.prediction_days > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span className="text-gray-700">{planConfig.features.prediction_days}-day burnout prediction</span>
            </div>
          )}
          {planConfig.features.anonymous_escalation && (
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span className="text-gray-700">Anonymous escalation</span>
            </div>
          )}
          {planConfig.features.benchmarking && (
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✓</span>
              <span className="text-gray-700">Industry benchmarking</span>
            </div>
          )}
        </div>
        
        {/* CTA Button */}
        <button
          onClick={() => {
            if (plan === 'pro') {
              window.location.href = 'mailto:sales@resylia.com'
            } else {
              // Handle trial signup
              window.location.href = `/api/payment/trial?plan=${plan}&seats=${priceInfo.seats}&billing=${billingCycle}`
            }
          }}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            mostPopular 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : plan === 'pro' 
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {plan === 'pro' ? 'Contact Sales' : 'Start Free Trial'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start with a 14-day free trial. No credit card required.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard plan="starter" />
          <PricingCard plan="growth" mostPopular={true} />
          <PricingCard plan="pro" />
        </div>
        
        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens when I exceed my seat limit?</h3>
              <p className="text-gray-600">You'll need to either upgrade your plan or purchase additional seats. We'll notify you when you're close to your limit.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Yes! All plans start with a 14-day free trial with full access to features. No credit card required to start.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPlanDescription(plan: Plan): string {
  const descriptions = {
    starter: "Perfect for small teams just getting started with wellness tracking",
    growth: "Ideal for growing teams that need AI-powered insights and Slack integration",
    pro: "Complete platform for organizations serious about employee wellness"
  }
  return descriptions[plan]
}