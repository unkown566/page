import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Secure Document Access',
  description: 'Verify your identity to access secure documents',
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

