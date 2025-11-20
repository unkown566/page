'use client'

import { useEffect } from 'react'

// Debug component to check Turnstile loading
export default function CaptchaGateDebug() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkTurnstile = () => {
      const turnstile = (window as any).turnstile
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

      const script = document.querySelector('script[src*="turnstile"]')
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')

      return {
        turnstileAvailable: !!turnstile,
        siteKey: siteKey || 'NOT SET',
        scriptLoaded: !!script,
        cspMeta: !!metaCSP,
      }
    }

    const timer = setTimeout(() => {
      checkTurnstile()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return null
}



