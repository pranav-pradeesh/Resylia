import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Viewport } from 'next'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Resylia - AI-Powered Employee Burnout Prevention Platform',
    template: '%s | Resylia'
  },
  description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights, intelligent interventions, and comprehensive HR analytics. Transform workplace wellbeing with data-driven solutions.',
  keywords: [
    'employee wellness',
    'burnout prevention',
    'AI analytics',
    'HR technology',
    'employee engagement',
    'workplace wellbeing',
    'mental health at work',
    'employee productivity',
    'team health monitoring',
    'HR analytics platform',
    'employee retention',
    'workplace wellness programs',
    'organizational health',
    'employee wellness tracker',
    'AI-powered wellness',
    'burnout detection',
    'workplace mental health',
    'team productivity tools',
    'HR wellness solutions'
  ],
  authors: [{ name: 'Resylia Team' }],
  creator: 'Resylia',
  publisher: 'Resylia',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Resylia - AI-Powered Employee Burnout Prevention Platform',
    description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights and intelligent interventions.',
    siteName: 'Resylia',
    images: [
      {
        url: '/og-resylia.png',
        width: 1200,
        height: 630,
        alt: 'Resylia - AI Burnout Prevention Platform',
        type: 'image/png',
      },
      {
        url: '/og-resylia-square.png',
        width: 800,
        height: 800,
        alt: 'Resylia - Wellness Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resylia - AI-Powered Employee Burnout Prevention',
    description: 'Proactively identify and prevent employee burnout with AI-powered wellness insights.',
    images: ['/og-resylia.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#3b82f6' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
  colorScheme: 'light',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://analytics.google.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* JSON-LD structured data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Resylia",
              "description": "AI-powered employee burnout prevention platform with real-time wellness analytics and intelligent interventions.",
              "url": process.env.NEXT_PUBLIC_BASE_URL,
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "299",
                "priceCurrency": "INR",
                "priceValidUntil": "2024-12-31",
                "seller": {
                  "@type": "Organization",
                  "name": "Resylia"
                }
              },
              "featureList": [
                "Real-time wellness tracking",
                "AI-powered burnout prediction",
                "Team health analytics",
                "Employee engagement metrics",
                "Privacy-focused insights"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150",
                "bestRating": "5",
                "worstRating": "1"
              },
              "author": {
                "@type": "Organization",
                "name": "Resylia",
                "url": process.env.NEXT_PUBLIC_BASE_URL
              }
            })
          }}
        />
        
        {/* Organization structured data */}
        <Script
          id="org-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Resylia",
              "description": "AI-powered employee wellness and burnout prevention platform",
              "url": process.env.NEXT_PUBLIC_BASE_URL,
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
                "width": 512,
                "height": 512
              },
              "sameAs": [
                "https://twitter.com/resylia",
                "https://linkedin.com/company/resylia"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "support@resylia.com",
                "contactType": "customer service"
              }
            })
          }}
        />
        
        {/* Security headers meta tags */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="format-detection" content="address=no" />
      </head>
      
      <body className="font-sans antialiased">
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
        )}
        
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        )}
        
        {children}
        
        {/* Cookie consent script */}
        <Script id="cookie-consent" strategy="afterInteractive">
          {`
            if (!localStorage.getItem('cookie-consent')) {
              // Show cookie consent banner logic here
              console.log('Cookie consent needed');
            }
          `}
        </Script>
      </body>
    </html>
  )
}