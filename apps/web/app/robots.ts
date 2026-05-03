import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/_next/',
          '/login/',
          '/signup/',
          '/admin/',
          '/settings/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}