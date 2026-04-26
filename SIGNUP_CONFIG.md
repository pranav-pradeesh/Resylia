# Signup Not Working - Configuration Checklist

## The Issue
OAuth signup is not working. This is typically because OAuth providers (Google, Slack) are not configured in Supabase.

## What Needs to Be Done

### 1. **Configure Google OAuth in Supabase**
   1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
   2. Select your project: `dfrguizoyiezjybctzbd`
   3. Go to **Authentication** → **Providers** → **Google**
   4. Enable Google provider
   5. Add your Google OAuth credentials:
      - Client ID (from Google Cloud Console)
      - Client Secret (from Google Cloud Console)
   
   **Google Cloud Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create/select a project
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Authorized redirect URIs: `https://dfrguizoyiezjybctzbd.supabase.co/auth/v1/callback`
   - Get Client ID and Client Secret

### 2. **Configure Redirect URLs in Supabase**
   1. Go to **Authentication** → **URL Configuration**
   2. Add Site URL: `http://localhost:3000` (for development)
   3. Add Redirect URLs:
      - `http://localhost:3000/api/auth/callback`
      - `http://localhost:3000/dashboard`
      - `http://localhost:3000/`

### 3. **Verify Environment Variables**
   Check `.env.local` has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dfrguizoyiezjybctzbd.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. **Test the Setup**
   1. Visit `http://localhost:3000/signup`
   2. Click "Sign up with Google"
   3. You should be redirected to Google login
   4. After authentication, you should return to `/dashboard`

### 5. **Debug if Still Broken**
   - Check browser console for errors
   - Visit `http://localhost:3000/api/debug/auth` to verify Supabase connection
   - Check Supabase logs for authentication errors
   - Ensure cookies are enabled in your browser

## Quick Test
Run: `curl http://localhost:3000/api/debug/auth`

This should return Supabase connection status.
