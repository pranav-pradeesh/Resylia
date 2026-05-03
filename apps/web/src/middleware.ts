import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.razorpay.com https://api.resend.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';"
  )
  
  // HTTPS enforcement (only in production)
  if (process.env.NODE_ENV === 'production') {
    if (request.url.startsWith('http://')) {
      const url = request.url.replace('http://', 'https://')
      return NextResponse.redirect(url, 301)
    }
  }
  
  // Cookie security
  response.headers.set('Set-Cookie', `__Secure-Session=${Date.now()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
  response.headers.set('Set-Cookie', `__Secure-Auth=${Date.now()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`)
  
  // Remove sensitive headers
  response.headers.delete('Server')
  response.headers.set('X-Powered-By', 'Resylia')
  
  // Add plan-based redirects to the middleware
  return handlePlanRules(response, request)
}

async function handlePlanRules(response: NextResponse, request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip plan rules for static assets and login/signup
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return response
  }
  
  // Check if this is a protected route that needs plan checking
  const protectedRoutes = [
    { path: '/api/ai/explain', requiredPlan: 'growth', feature: 'ai_explanation' },
    { path: '/api/benchmarking', requiredPlan: 'pro', feature: 'benchmarking' },
    { path: '/api/escalate', requiredPlan: 'pro', feature: 'anonymous_escalation' },
    { path: '/api/predictions', requiredPlan: 'growth', feature: 'prediction_days' },
  ]
  
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route.path)) {
      // Would add plan check here if we have the context
      // For now, we'll handle this in the API routes themselves
      continue
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}