import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resylia - AI-Powered Employee Burnout Prevention Platform',
  description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights, intelligent interventions, and comprehensive HR analytics. Transform workplace wellbeing with data-driven solutions.',
  keywords: [
    'employee wellness',
    'burnout prevention',
    'AI analytics',
    'HR technology',
    'employee engagement',
    'workplace wellbeing',
    'mental health at work',
    'employee productivity',
    'team health monitoring',
    'HR analytics platform',
    'employee retention',
    'workplace wellness programs',
  ],
  authors: [{ name: 'Resylia Team' }],
  creator: 'Resylia',
  publisher: 'Resylia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Resylia - AI-Powered Employee Burnout Prevention Platform',
    description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights and intelligent interventions.',
    siteName: 'Resylia',
    images: [
      {
        url: '/og-resylia.png',
        width: 1200,
        height: 630,
        alt: 'Resylia - AI Burnout Prevention Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resylia - AI-Powered Employee Burnout Prevention',
    description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights.',
    images: ['/og-resylia.png'],
  },
}

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Prevent Burnout Before It Happens
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered platform that proactively identifies employee burnout risks and provides intelligent interventions to keep your team healthy and productive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Get Started Free
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Prevent Burnout
          </h2>
          <p className="text-lg text-gray-600">
            Comprehensive wellness platform for employees, managers, and HR teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* For Employees */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">For Employees</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Daily check-ins in 30 seconds
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                AI-powered focus time optimization
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Peer support matching
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Smart PTO planning
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Personalized wellness insights
              </li>
            </ul>
          </div>

          {/* For Managers */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">For Managers</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Real-time team health dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Early burnout risk detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Meeting load analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Personalized coaching insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Team wellness metrics
              </li>
            </ul>
          </div>

          {/* For HR */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">For HR Teams</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Company-wide analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Predictive retention insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Anonymous feedback channels
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Wellness ROI measurement
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Compliance reporting
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">85%</div>
              <div className="text-gray-600">Faster burnout detection</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">70%</div>
              <div className="text-gray-600">Improved team engagement</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">60%</div>
              <div className="text-gray-600">Reduced absenteeism</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">45%</div>
              <div className="text-gray-600">Better retention rates</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Workplace Wellness?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of companies using Resylia to create healthier, more productive workplaces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Free Trial
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Resylia. All rights reserved. Built with ❤️ for healthier workplaces.
          </p>
        </div>
      </footer>
    </div>
  )
}