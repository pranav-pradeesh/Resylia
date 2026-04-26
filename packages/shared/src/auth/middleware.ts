import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PERMISSIONS, type Permission } from '../roles'
import { logSecurityEvent } from '../audit'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; org_id: string; role: string; is_active: boolean }
      }
    }
  }
}

function getAdminDb(): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables (admin client)')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function withAuth(
  req: Request,
  handler: (userId: string, orgId: string, role: string) => Promise<Response>,
  requiredPermission: Permission
): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = getAdminDb()

    const { data: profile, error: profileError } = await (adminDb.from('users') as any)
      .select('org_id, role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allowed = (PERMISSIONS[requiredPermission] as readonly string[]).includes(profile.role)
    if (!allowed) {
      await logSecurityEvent(
        'unauthorized_access_attempt',
        { permission: requiredPermission, role: profile.role, path: new URL(req.url).pathname },
        { ip, userId: user.id }
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler(user.id, profile.org_id, profile.role)
  } catch (err) {
    console.error('[withAuth] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}