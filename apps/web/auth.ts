import { type Role, type Permission } from '@resylia/shared'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function hasPermission(userRole: string, permission: Permission): boolean {
  const allowedRoles = permission.allowed_roles
  return allowedRoles.includes(userRole)
}

export function requirePermission(permission: Permission) {
  return async (request: NextRequest) => {
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
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!hasPermission(userData.role, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Add user to request context
    const requestWithUser = new Request(request)
    requestWithUser.headers.set('user-role', userData.role)
    requestWithUser.headers.set('user-id', user.id)

    return NextResponse.next({
      request: requestWithUser,
    })
  }
}

export function requireRoles(allowedRoles: Role[]) {
  return async (request: NextRequest) => {
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

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const requestWithUser = new Request(request)
    requestWithUser.headers.set('user-role', userData.role)
    requestWithUser.headers.set('user-id', user.id)

    return NextResponse.next({
      request: requestWithUser,
    })
  }
}

export async function getCurrentUser(request: NextRequest) {
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
    return null
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('role, display_name, email')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    return null
  }

  return {
    id: user.id,
    email: user.email!,
    role: userData.role,
    display_name: userData.display_name,
  }
}
