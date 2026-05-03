import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Resylia - AI-Powered Employee Burnout Prevention Platform',
  description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights and intelligent interventions.',
  keywords: ['employee wellness', 'burnout prevention', 'AI analytics', 'HR technology', 'employee engagement'],
  authors: [{ name: 'Resylia Team' }],
  creator: 'Resylia',
  publisher: 'Resylia',
}

export default function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="app-layout">
      {children}
    </div>
  )
}