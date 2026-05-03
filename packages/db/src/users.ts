import { adminDb } from './client'

export interface UserRow {
  id: string
  org_id: string
  role: 'employee' | 'manager' | 'hr' | 'admin'
  department: string | null
  manager_id: string | null
  is_active: boolean
  created_at: string
  display_name: string | null
  email: string | null
}

export interface OrgRow {
  id: string
  name: string
  slug: string
  plan: string
  seat_count: number
  stripe_customer_id: string | null
  slack_team_id: string | null
  created_at: string
}

export async function getUserById(userId: string): Promise<UserRow | null> {
  const { data } = await adminDb
    .from('users')
    .select('*')
    .eq('id', userId)
    .single<{ [key: string]: any }>()
  return data as UserRow | null
}

export async function getOrgById(orgId: string): Promise<OrgRow | null> {
  const { data } = await adminDb
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single<{ [key: string]: any }>()
  return data as OrgRow | null
}

export async function getOrgBySlackTeamId(teamId: string): Promise<OrgRow | null> {
  const { data } = await adminDb
    .from('organizations')
    .select('*')
    .eq('slack_team_id', teamId)
    .single<{ [key: string]: any }>()
  return data as OrgRow | null
}

export async function getOrgByStripeCustomerId(customerId: string): Promise<OrgRow | null> {
  const { data } = await adminDb
    .from('organizations')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single<{ [key: string]: any }>()
  return data as OrgRow | null
}

export async function getTeamMembers(orgId: string, managerId?: string): Promise<UserRow[]> {
  let query = adminDb
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
  
  if (managerId) {
    query = query.eq('manager_id', managerId)
  }
  
  const { data } = await query
  return (data as UserRow[]) || []
}

export async function createOrg(input: {
  name: string
  slug: string
  plan: string
  seat_count: number
}): Promise<OrgRow> {
  const { data, error } = await adminDb
    .from('organizations')
    .insert(input)
    .select()
    .single<{ [key: string]: any }>()
  if (error) throw new Error(`Failed to create org: ${error.message}`)
  return data as OrgRow
}

export async function createUser(input: {
  id: string
  org_id: string
  role: string
  department?: string
  manager_id?: string
}): Promise<UserRow> {
  const { data, error } = await adminDb
    .from('users')
    .insert({ ...input, is_active: true })
    .select()
    .single<{ [key: string]: any }>()
  if (error) throw new Error(`Failed to create user: ${error.message}`)
  return data as UserRow
}

export async function updateSubscription(
  orgId: string,
  fields: {
    stripe_subscription_id?: string
    status?: string
    plan?: string
    seat_count?: number
    current_period_end?: string
  }
): Promise<void> {
  const { error } = await adminDb
    .from('subscriptions')
    .upsert({ org_id: orgId, ...fields }, { onConflict: 'org_id' })
  if (error) throw new Error(`Failed to update subscription: ${error.message}`)

  if (fields.plan || fields.seat_count) {
    await adminDb
      .from('organizations')
      .update({
        ...(fields.plan && { plan: fields.plan }),
        ...(fields.seat_count && { seat_count: fields.seat_count }),
      })
      .eq('id', orgId)
  }
}


