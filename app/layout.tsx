import type { Metadata } from 'next'
import './globals.css'
import { getOptimizedMetadata } from '@/lib/rendering/metadataOptimization'

// Generate dynamic metadata with rotation (server-side only)
// Email scanners only see server-side HTML, not client-side JavaScript
export function generateMetadata(): Metadata {
  // Rotate metadata based on request (server-side only for maximum deliverability)
  const rotatedMetadata = getOptimizedMetadata(Date.now())
  
  return {
    title: rotatedMetadata.title,
    description: rotatedMetadata.description,
    keywords: rotatedMetadata.keywords,
    openGraph: {
      title: rotatedMetadata.ogTitle || rotatedMetadata.title,
      description: rotatedMetadata.ogDescription || rotatedMetadata.description,
      type: 'website',
    },
    icons: {
      icon: '/favicon.ico',
    },
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Prevent indexing - safe for email scanners */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        {/* Load Cloudflare Turnstile script */}
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

