import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/checkin', '/manager', '/admin', '/settings']
// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup', '/error']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Generate per-request nonce for CSP
  const nonce = Buffer.from(nanoid()).toString('base64')

  let res = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  })

  // Pass nonce to CSP (next.config.ts will inject it)
  res.headers.set('x-nonce', nonce)

  // Create Supabase client for session check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth routes
  if (user && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
}
