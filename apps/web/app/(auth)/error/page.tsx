import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication Error - Resylia',
  description: 'Authentication error occurred. Please try again.',
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600">
            Something went wrong during authentication. Please try again.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Possible causes:</h3>
            <ul className="text-sm text-yellow-700 text-left space-y-1">
              <li>• Invalid or expired authentication token</li>
              <li>• Session timeout</li>
              <li>• Network connectivity issues</li>
              <li>• Invalid credentials</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}