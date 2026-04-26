import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithOAuth(provider: 'google' | 'slack') {
  const supabase = createClient()

  // Map provider name to Supabase provider ID.
  // Slack user sign-in requires 'slack_oidc' (not 'slack', which is for bots).
  // Make sure 'Slack (OIDC)' is enabled in Supabase Dashboard → Authentication → Providers.
  const supabaseProvider = provider === 'slack' ? 'slack_oidc' : 'google'

  // Redirect back to our Next.js callback handler after OAuth completes
  const redirectTo = `${window.location.origin}/api/auth/v1/callback`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options: { redirectTo },
  })

  if (error) throw error
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}
