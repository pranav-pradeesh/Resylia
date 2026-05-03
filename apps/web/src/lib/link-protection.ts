import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper to get authenticated user inline (replaces missing @/lib/auth)
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: userData } = await supabase
      .from('users')
      .select('id, role, org_id')
      .eq('id', user.id)
      .single() as unknown as { data: { id: string; role: string; org_id: string } | null }
    return userData
  } catch {
    return null
  }
}

export async function protectLink(request: NextRequest, linkId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  // Fix: was `data: { link }` which is wrong — .single() returns the row directly
  const { data: link, error } = await supabase
    .from('links')
    .select('id, user_id, created_at, expires_at, is_public')
    .eq('id', linkId)
    .single()

  if (error || !link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  if ((link as any).expires_at && new Date((link as any).expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link has expired' }, { status: 410 })
  }

  const user = await getAuthenticatedUser(request)

  if (!(link as any).is_public) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export async function canEditLink(request: NextRequest, linkId: string): Promise<boolean> {
  const user = await getAuthenticatedUser(request)
  if (!user) return false

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: link } = await supabase
    .from('links')
    .select('user_id')
    .eq('id', linkId)
    .single()

  if (user.role === 'admin') return true

  if (user.role === 'manager') {
    const { data: teamLinks } = await supabase
      .from('links')
      .select('id')
      .eq('user_id', (link as any)?.user_id)
    return teamLinks ? teamLinks.length > 0 : false
  }

  return user.id === (link as any)?.user_id
}
