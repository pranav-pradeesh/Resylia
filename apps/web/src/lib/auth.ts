import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getAuthenticatedUser(request: NextRequest) {
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

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getOrgAndUser(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return null
  }

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

  // Get user profile with organization info
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('org_id, role, is_active, display_name, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, plan')
    .eq('id', profile.org_id)
    .single()

  if (orgError || !org) {
    return null
  }

  return {
    user,
    profile,
    org,
  }
}

export function requireAuth(request: NextRequest) {
  return getOrgAndUser(request)
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const auth = await requireAuth(request)
    if (!auth) {
      return null
    }

    if (!allowedRoles.includes(auth.profile.role)) {
      return null
    }

    return auth
  }
}

export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    const auth = await requireAuth(request)
    if (!auth) {
      return null
    }

    // Import permissions (in real app, would import from shared package)
    const permissions = {
      'checkin:write': ['employee', 'manager', 'hr', 'admin'],
      'checkin:read:own': ['employee', 'manager', 'hr', 'admin'],
      'checkin:read:team': ['manager', 'hr', 'admin'],
      'checkin:read:all': ['hr', 'admin'],
      'alerts:read': ['manager', 'hr', 'admin'],
      'analytics:read': ['hr', 'admin'],
      'billing:manage': ['admin'],
      'users:manage': ['admin'],
      'user:read': ['employee', 'manager', 'hr', 'admin'],
      'hr:read': ['hr', 'admin'],
      'manager:read': ['manager', 'admin'],
      'manager:write': ['manager', 'admin'],
    }

    const allowedRoles = permissions[permission] || []
    if (!allowedRoles.includes(auth.profile.role)) {
      return null
    }

    return auth
  }
}