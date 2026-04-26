import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'
  const error = url.searchParams.get('error') // OAuth error from provider
  const errorDescription = url.searchParams.get('error_description')

  // Handle OAuth errors from provider
  if (error) {
    console.error('[auth/callback] OAuth error:', { error, error_description: errorDescription })
    return NextResponse.redirect(new URL(`/error?message=OAuth%20error:${encodeURIComponent(error)}`, url.origin))
  }

  if (code) {
    const cookieStore = await cookies()
    // Use ANON_KEY for auth operations — SERVICE_ROLE_KEY is NOT for auth callbacks
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: any) => cookieStore.set({ name, value: '', ...options }),
        },
      }
    )

    const { error: sessionError, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!sessionError) {
      return NextResponse.redirect(new URL(next, url.origin))
    }

    console.error('[auth/callback] session exchange failed:', sessionError.message)
    return NextResponse.redirect(new URL('/error?message=Session%20exchange%20failed', url.origin))
  }

  // No code and no error - redirect to error
  return NextResponse.redirect(new URL('/error?message=Invalid%20request', url.origin))
}