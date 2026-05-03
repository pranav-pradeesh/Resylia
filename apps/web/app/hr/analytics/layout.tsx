import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'HR Analytics - Employee Wellness Insights & Burnout Prevention | Resylia',
  description: 'Advanced employee wellness analytics and burnout prevention insights. Track trends, identify risk factors, and make data-driven decisions for workplace wellbeing.',
  keywords: [
    'HR analytics',
    'employee wellness data',
    'burnout prevention analytics',
    'workplace wellbeing metrics',
    'employee health insights',
    'HR data visualization',
    'employee engagement analytics',
    'team health tracking',
    'workplace analytics',
    'employee retention insights',
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
    canonical: '/hr/analytics',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/hr/analytics',
    title: 'HR Analytics - Employee Wellness Insights & Burnout Prevention',
    description: 'Advanced employee wellness analytics and burnout prevention insights.',
    siteName: 'Resylia',
    images: [
      {
        url: '/og-hr-analytics.png',
        width: 1200,
        height: 630,
        alt: 'Resylia HR Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HR Analytics - Employee Wellness Insights',
    description: 'Advanced analytics for employee wellness and burnout prevention.',
    images: ['/og-hr-analytics.png'],
  },
}

export default function HRAnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hr-analytics-layout">
      {children}
    </div>
  )
}