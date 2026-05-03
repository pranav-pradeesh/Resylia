import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { OrgSchema } from '@resylia/shared/src/validation'
import { rateLimiters } from '@resylia/shared/src/rate-limit'
import { createOrg, createUser } from '@resylia/db/src/users'
import { adminDb } from '@resylia/db/src/client'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await rateLimiters.api.limit(ip)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  // Verify the user is authenticated
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

// Check if user already has an org
  const { data: existing } = await adminDb
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single<{ org_id: string | null }>()

  if (existing?.org_id) {
    return NextResponse.json({ error: 'Already onboarded' }, { status: 409 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const result = OrgSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.format() }, { status: 400 })
  }

  const orgData = {
    name: result.data.name,
    slug: result.data.slug,
    seat_count: result.data.seat_count,
    plan: result.data.plan ?? 'starter',
  }

  // Check slug uniqueness
  const { count } = await adminDb
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('slug', result.data.slug)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'That URL slug is already taken' }, { status: 409 })
  }

  const org = await createOrg(orgData)
  await createUser({ id: user.id, org_id: org.id, role: 'admin' })

  return NextResponse.json({ org_id: org.id, slug: org.slug }, { status: 201 })
}


