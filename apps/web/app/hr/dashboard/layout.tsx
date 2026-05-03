import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'HR Dashboard - Employee Wellness & Burnout Prevention | Resylia',
  description: 'Comprehensive employee wellness analytics and burnout prevention dashboard for HR professionals. Monitor team health, identify at-risk employees, and improve workplace wellbeing.',
  keywords: [
    'employee wellness',
    'burnout prevention',
    'HR analytics',
    'team health monitoring',
    'employee wellbeing',
    'workplace wellness',
    'HR dashboard',
    'employee engagement',
    'mental health at work',
    'team productivity',
  ],
  authors: [{ name: 'Resylia Team' }],
  creator: 'Resylia',
  publisher: 'Resylia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/hr/dashboard',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/hr/dashboard',
    title: 'HR Dashboard - Employee Wellness & Burnout Prevention',
    description: 'Comprehensive employee wellness analytics and burnout prevention dashboard for HR professionals.',
    siteName: 'Resylia',
    images: [
      {
        url: '/og-hr-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Resylia HR Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HR Dashboard - Employee Wellness & Burnout Prevention',
    description: 'Monitor team health and prevent burnout with AI-powered analytics.',
    images: ['/og-hr-dashboard.png'],
  },
}

export default function HRDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hr-dashboard-layout">
      {children}
    </div>
  )
}