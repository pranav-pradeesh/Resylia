import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resylia — Burnout Intelligence',
  description: 'Prevent burnout before it happens. Daily 30-second check-ins, AI coach, and team insights.',
  openGraph: {
    title: 'Resylia',
    description: 'Burnout intelligence for modern teams.',
    url: 'https://app.resylia.com',
    siteName: 'Resylia',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  )
}
