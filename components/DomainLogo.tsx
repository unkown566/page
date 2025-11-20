'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'

interface DomainLogoProps {
  domain: string
}

export default function DomainLogo({ domain }: DomainLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!domain) return

    // Try Google's favicon service first (most reliable)
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    setLogoUrl(googleFaviconUrl)

    // Also try Clearbit logo API as a backup
    const clearbitUrl = `https://logo.clearbit.com/${domain}`
    
    // Test if Clearbit works
    const img = new Image()
    img.onload = () => {
      setLogoUrl(clearbitUrl)
    }
    img.onerror = () => {
      // Keep Google favicon
    }
    img.src = clearbitUrl
  }, [domain])

  if (!domain) return null

  return (
    <div className="flex justify-center mb-4">
      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
        {logoUrl ? (
          <NextImage
            src={logoUrl}
            alt={`${domain} logo`}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-contain"
            unoptimized
            onError={() => {
              setLogoUrl(null)
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            {domain.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

