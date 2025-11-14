'use client'

import { useEffect } from 'react'

// Debug component to check Turnstile loading
export default function CaptchaGateDebug() {
  if (typeof window === 'undefined') return null

  const checkTurnstile = () => {
    const turnstile = (window as any).turnstile
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    
    
    // Check script
    const script = document.querySelector('script[src*="turnstile"]')
    
    // Check CSP
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    
    return {
      turnstileAvailable: !!turnstile,
      siteKey: siteKey || 'NOT SET',
      scriptLoaded: !!script,
      cspMeta: !!metaCSP,
    }
  }

  useEffect(() => {
    // Check after a delay to allow script to load
    const timer = setTimeout(() => {
      checkTurnstile()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return null
}



