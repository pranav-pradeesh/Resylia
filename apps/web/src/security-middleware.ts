import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

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

  // Remove sensitive headers
  response.headers.delete('Server')
  response.headers.set('X-Powered-By', 'Resylia')

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