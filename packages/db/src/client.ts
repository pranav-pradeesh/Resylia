import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Admin client — uses SERVICE_ROLE_KEY, bypasses RLS.
 * ONLY used in trusted server-side contexts (API routes, webhooks, cron jobs).
 * NEVER import or expose this on the client side.
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables (admin client)')
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Singleton for API routes — avoids creating a new client per request
let _adminDb: SupabaseClient<Database> | null = null

export function getAdminDb(): SupabaseClient<Database> {
  if (!_adminDb) _adminDb = createAdminClient()
  return _adminDb
}

// Typed admin db for backwards compatibility
export const adminDb = {
  from<T extends keyof Database['public']['Tables']>(table: T) {
    return getAdminDb().from(table)
  }
} as {
  from<T extends keyof Database['public']['Tables']>(
    table: T
  ): ReturnType<SupabaseClient<Database>['from']>
}