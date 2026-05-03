import { ROLES, PERMISSIONS, type Role, type Permission } from '@resylia/shared'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAdminDb } from '@resylia/db'

export function hasPermission(userRole: Role | string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(userRole as 'admin')
}

export function requirePermission(permission: Permission) {
  return async function middleware(request: NextRequest) {
    // Check authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for middleware
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role from database
    const adminDb = getAdminDb()
    const { data: userData, error } = await adminDb
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single<{ [key: string]: any }>()

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasPermission((userData as any).role, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Add org_id to request headers for handler
    const requestWithUser = new Request(request)
    requestWithUser.headers.set('user-role', (userData as any).role)
    requestWithUser.headers.set('user-id', user.id)
    requestWithUser.headers.set('org-id', (userData as any).org_id)

    // Return the modified request for the handler to use
    return requestWithUser as NextRequest
  }
}

// Import requireFeature from plans instead
export { requireFeature } from '@resylia/shared'

