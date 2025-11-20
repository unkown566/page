'use client'

import { useEffect, useState } from 'react'
import { generateFingerprint, getFingerprintHash } from '@/lib/fingerprinting'
import { generateHoneypotHTML, generateHoneypotCSS } from '@/lib/honeypot'
import { redirectToSafeSiteWithReason } from '@/lib/redirectWithReason'
import { API_ROUTES } from '@/lib/api-routes'
import { IS_DEV, IS_LOCALHOST } from '@/src/utils/env'

interface BotFilterGateProps {
  children: React.ReactNode
  onFiltered?: () => void
}

export default function BotFilterGate({ children, onFiltered }: BotFilterGateProps) {
  const [passed, setPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const isDevFastMode = IS_DEV || IS_LOCALHOST // PHASE 🦊 SPEED FIX

  // Track mount state to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only run on client after mount
    if (!isMounted || typeof window === 'undefined') return
    if (isDevFastMode) {
      setPassed(true)
      setLoading(false)
      return
    }
    
    
    // Step 0: Check settings first
    const checkSettings = async () => {
      try {
        const settingsResponse = await fetch('/api/admin/settings')
        const responseData = await settingsResponse.json()
        // API returns { success: true, settings: {...} }
        const settings = responseData.settings || responseData
        
        // Check both gate setting and feature setting (support both structures)
        const layer1BotFilter = settings.security?.gates?.layer1BotFilter
        const botFilterEnabled = settings.security?.botFilter?.enabled
        
        
        // Check if bot filter gate is disabled (correct path: settings.security.gates.layer1BotFilter)
        if (layer1BotFilter === false) {
          setPassed(true)
          setLoading(false)
          return true // Settings check complete, skip bot filter
        }
        
        // Also check if bot filter feature itself is disabled
        if (botFilterEnabled === false) {
          setPassed(true)
          setLoading(false)
          return true // Settings check complete, skip bot filter
        }
        
        return false // Settings check complete, continue with bot filter
      } catch (error) {
        // Fail secure - continue with bot filter check (default: enabled)
        return false
      }
    }
    
    // Run settings check first, then continue with bot filter logic
    const runBotFilterCheck = async () => {
      const shouldSkip = await checkSettings()
      if (shouldSkip) return // Bot filter disabled, exit early
      
      // IMPORTANT: Only skip bot detection if we're NOT on the CAPTCHA page
      // Check if we're currently showing CAPTCHA (by checking if captchaVerified is still false in parent)
      // For CAPTCHA page, always run bot detection first
      const captchaVerified = sessionStorage.getItem('captcha_verified')
      const isCaptcha = !captchaVerified || captchaVerified !== 'true'
      
      // Skip bot detection only if CAPTCHA was already verified AND we're past the CAPTCHA page
      if (!isCaptcha) {
        const captchaTimestamp = sessionStorage.getItem('captcha_timestamp')
        
        if (captchaVerified === 'true' && captchaTimestamp) {
          const timeDiff = Date.now() - parseInt(captchaTimestamp)
          // Valid for 30 minutes - if CAPTCHA passed recently, skip bot filter
          if (timeDiff < 30 * 60 * 1000) {
            setPassed(true)
            setLoading(false)
            return
          }
        }
      }

      // Step 1: Generate fingerprint
      const fingerprint = generateFingerprint()
      const fingerprintHash = getFingerprintHash(fingerprint)

      // Step 2: Check with bot filter API
      try {
        const response = await fetch(API_ROUTES.botFilter, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fingerprint: fingerprintHash }),
          cache: 'no-store',
        })

        if (response.redirected) {
          // Redirected to safe site - bot detected
          if (onFiltered) {
            onFiltered()
          }
          return
        }

        const data = await response.json()
        
        if (data.ok && data.passed) {
          setPassed(true)
        } else {
          // Bot detected - redirect with reason
          if (onFiltered) {
            onFiltered()
          }
          redirectToSafeSiteWithReason('bot_detected')
        }
      } catch (error) {
        // On error, assume bot and redirect with random parameters
        if (onFiltered) {
          onFiltered()
        }
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
      } finally {
        setLoading(false)
      }
    }
    
    runBotFilterCheck()
  }, [onFiltered, isMounted, isDevFastMode])

  // Inject honeypot CSS
  useEffect(() => {
    if (isDevFastMode) return
    const style = document.createElement('style')
    style.textContent = generateHoneypotCSS()
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [isDevFastMode])

  // During SSR and initial render, always show children to avoid hydration mismatch
  // After mount, we can check sessionStorage and show loading if needed
  if (!isMounted || isDevFastMode) {
    // Server render and initial client render - always show children
    // Don't wrap in extra div - children already has its own structure
    return <>{children}</>
  }

  // After mount, check if we're on CAPTCHA page
  const captchaVerified = typeof window !== 'undefined' 
    ? sessionStorage.getItem('captcha_verified') 
    : null
  const isCaptchaPage = !captchaVerified || captchaVerified !== 'true'

  // For CAPTCHA page, always show children immediately (don't block)
  if (isCaptchaPage) {
    return <>{children}</>
  }

  // Only show loading if we're past CAPTCHA verification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!passed) {
    // Bot detected - return null
    return null
  }

  // Passed bot filter - show children with honeypot
  // Inject honeypot only after mount to avoid hydration issues
  // Use useEffect to inject honeypot after hydration to avoid mismatch
  return (
    <>
      {children}
      {/* Inject honeypot fields after mount - use portal-like approach */}
      <HoneypotInjector />
    </>
  )
}

// Separate component for honeypot injection to avoid hydration issues
function HoneypotInjector() {
  useEffect(() => {
    // Inject honeypot after component mounts
    const honeypotHTML = generateHoneypotHTML()
    const container = document.createElement('div')
    container.innerHTML = honeypotHTML
    container.style.display = 'none'
    container.setAttribute('aria-hidden', 'true')
    document.body.appendChild(container)
    
    return () => {
      // Cleanup on unmount
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }, [])
  
  return null // Don't render anything in the component tree
}

