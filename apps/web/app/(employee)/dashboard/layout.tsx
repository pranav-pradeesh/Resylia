import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Employee Dashboard - Personal Wellness & Productivity | Resylia',
  description: 'Personal wellness dashboard featuring mood tracking, productivity insights, and peer support. Monitor your wellbeing and improve work-life balance.',
  keywords: [
    'employee wellness',
    'personal dashboard',
    'mood tracking',
    'productivity insights',
    'work-life balance',
    'employee wellbeing',
    'personal wellness',
    'peer support',
    'mental health tracking',
    'workplace productivity',
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
    canonical: '/employee/dashboard',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/employee/dashboard',
    title: 'Employee Dashboard - Personal Wellness & Productivity',
    description: 'Personal wellness dashboard featuring mood tracking and productivity insights.',
    siteName: 'Resylia',
    images: [
      {
        url: '/og-employee-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Resylia Employee Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employee Dashboard - Personal Wellness',
    description: 'Track your wellbeing and improve productivity with personalized insights.',
    images: ['/og-employee-dashboard.png'],
  },
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  )
}