'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'

interface HeaderProps {
  domain?: string
}

export default function Header({ domain }: HeaderProps) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)

  useEffect(() => {
    if (domain) {
      // Update favicon in document head
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      setFaviconUrl(favicon)
      
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (link) {
        link.href = favicon
      } else {
        const newLink = document.createElement('link')
        newLink.rel = 'icon'
        newLink.href = favicon
        document.getElementsByTagName('head')[0].appendChild(newLink)
      }
    }
  }, [domain])

  return (
    <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            {domain && faviconUrl && (
              <NextImage
                src={faviconUrl}
                alt={`${domain} icon`}
                width={32}
                height={32}
                className="w-8 h-8 rounded"
                unoptimized
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Secure Access
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {domain ? domain : 'Document Portal'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure Connection</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  )
}











