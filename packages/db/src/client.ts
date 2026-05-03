import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
export type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      SUPABASE_SERVICE_ROLE_KEY: string
    }
  }
}

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

let _adminDb: SupabaseClient<Database> | null = null
export function getAdminDb(): SupabaseClient<Database> {
  if (!_adminDb) _adminDb = createAdminClient()
  return _adminDb
}

export const adminDb = {
  from<T extends keyof Database['public']['Tables']>(table: T) {
    return getAdminDb().from(table)
  }
} as {
  from<T extends keyof Database['public']['Tables']>(table: T): ReturnType<SupabaseClient<Database>['from']>
}

export const supabaseAdmin = {
  from<T extends keyof Database['public']['Tables']>(table: T) {
    return getAdminDb().from(table)
  }
} as {
  from<T extends keyof Database['public']['Tables']>(table: T): ReturnType<SupabaseClient<Database>['from']>
}