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
  
  // Note: Slack OAuth is primarily for bot access. For user sign-in, use Google.
  // Slack user sign-in would require a separate Slack app config.
  if (provider === 'slack') {
    throw new Error('Slack sign-in is not yet configured. Please use Google to sign in, then connect Slack in settings.')
  }
  
  // Set redirectTo to our Next.js API route that handles the OAuth callback
  const redirectTo = `${window.location.origin}/api/auth/v1/callback`
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  if (error) throw error
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}