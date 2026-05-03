import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Daily Check-in - Track Your Wellness | Resylia',
  description: 'Quick daily wellness check-in to track your energy, stress levels, and mood. Takes less than 30 seconds and helps prevent burnout.',
  keywords: [
    'daily check-in',
    'wellness tracking',
    'mood monitoring',
    'stress management',
    'burnout prevention',
    'employee wellbeing',
    'mental health check',
    'personal wellness',
    'workplace wellness',
    'self-assessment',
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
    canonical: '/employee/checkin',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/employee/checkin',
    title: 'Daily Check-in - Track Your Wellness',
    description: 'Quick daily wellness check-in to track your energy, stress levels, and mood.',
    siteName: 'Resylia',
    images: [
      {
        url: '/og-daily-checkin.png',
        width: 1200,
        height: 630,
        alt: 'Resylia Daily Check-in',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Check-in - Track Your Wellness',
    description: 'Quick daily wellness check-in to track your energy, stress levels, and mood.',
    images: ['/og-daily-checkin.png'],
  },
}

export default function CheckinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="checkin-layout">
      {children}
    </div>
  )
}