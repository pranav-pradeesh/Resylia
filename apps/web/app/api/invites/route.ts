import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@resylia/shared/src/auth/middleware'
import { rateLimiters } from '@resylia/shared/src/rate-limit'
import { InviteSchema } from '@resylia/shared/src/validation'
import { adminDb } from '@resylia/db/src/client'
import { getOrgById } from '@resylia/db/src/users'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

function getAuthAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const { success } = await rateLimiters.api.limit(ip)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  return withAuth(req, async (userId, orgId) => {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const result = InviteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 })
    }

    const { email, role, department } = result.data
    const org = await getOrgById(orgId)
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Check seat limit
    const { count: currentSeats } = await adminDb
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_active', true)

    if ((currentSeats ?? 0) >= org.seat_count) {
      return NextResponse.json(
        { error: 'Seat limit reached. Upgrade your plan to invite more members.' },
        { status: 403 }
      )
    }

    // Create a Supabase auth invite (user gets email with magic link)
    const authAdmin = getAuthAdmin()
    const { data: invite, error } = await authAdmin.auth.admin.inviteUserByEmail(email, {
      data: { org_id: orgId, role, department: department ?? null, invited_by: userId },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding/employee`,
    })

    if (error) {
      console.error('[invites] Supabase invite error:', error)
      return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
    }

    // Send branded welcome email
    await getResend().emails.send({
      from: 'Resylia <hello@resylia.com>',
      to: email,
      subject: `You've been invited to join ${org.name} on Resylia`,
      html: buildInviteEmail({ orgName: org.name, role, appUrl: process.env.NEXT_PUBLIC_APP_URL! }),
    })

    return NextResponse.json({ invited: email }, { status: 201 })
  }, 'users:manage')
}

function buildInviteEmail(opts: { orgName: string; role: string; appUrl: string }): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">You've been invited to Resylia</h2>
      <p><strong>${opts.orgName}</strong> has invited you to join their burnout intelligence platform as a <strong>${opts.role}</strong>.</p>
      <p>Resylia helps you track your wellbeing with a 30-second daily check-in and gives you personalized, science-backed suggestions to prevent burnout.</p>
      <p>Check your other email from Supabase to complete your account setup.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="color:#64748b;font-size:13px">Resylia — Burnout Intelligence Platform</p>
    </div>
  `
}
