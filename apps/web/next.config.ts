 import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // nonce injected via middleware for inline scripts
              "script-src 'self' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",  // safe: no user-controlled content in styles
              "img-src 'self' data: https:",
              // Google Fonts are loaded by auth pages
              "font-src 'self' https://fonts.gstatic.com",
              // Supabase auth + Google/Slack OAuth token endpoints
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://js.stripe.com https://accounts.google.com https://slack.com",
              "frame-src https://js.stripe.com https://accounts.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              // Allow form POSTs to Google/Slack OAuth and our own routes
              "form-action 'self' https://accounts.google.com https://slack.com",
            ].join('; '),
          },
        ],
      },
      {
        // API routes: strict CORS — only same origin
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.resylia.com',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // Prevent accidental bundling of server secrets
  serverExternalPackages: ['@anthropic-ai/sdk'],
}

export default nextConfig

