'use client'

import { useEffect, useState, useRef } from 'react'
import { API_ROUTES } from '@/lib/api-routes'
import { getLoadingScreen, type LoadingScreenId } from '@/lib/loadingScreenRegistry'
import { IS_DEV, IS_LOCALHOST } from '@/src/utils/env'

interface StealthVerificationGateProps {
  onVerified: () => void
  email: string
  domain: string
  loadingScreenId?: LoadingScreenId | string // From link config
  duration?: number // From admin settings (1-10 seconds, default 5)
  language?: string // Detected from visitor, default 'en'
}

export default function StealthVerificationGate({
  onVerified,
  email,
  domain,
  loadingScreenId = 'meeting',
  duration = 5,
  language = 'en',
}: StealthVerificationGateProps) {
  const [isVerifying, setIsVerifying] = useState(true)
  const [behaviorData, setBehaviorData] = useState<any[]>([])
  const verificationAttempted = useRef(false)
  const settingsChecked = useRef(false)
  const isDevFastMode = IS_DEV || IS_LOCALHOST // PHASE 🦊 SPEED FIX

  // Component lifecycle
  useEffect(() => {
    return () => {
      // Cleanup
    }
  }, [])

  // Settings check - check if we should show loading page
  // Start with null to wait for settings, then default to true if not set
  const [showLoadingPage, setShowLoadingPage] = useState<boolean | null>(null)
  
  useEffect(() => {
    if (settingsChecked.current) return
    settingsChecked.current = true
    if (isDevFastMode) {
      setShowLoadingPage(false)
      setIsVerifying(false)
      onVerified()
      return
    }

    async function checkSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const responseData = await response.json()
        const settings = responseData.settings || responseData

        const layer4StealthVerification =
          settings.security?.gates?.layer4StealthVerification ?? true
        
        // Check if loading page should be shown (default: true)
        const showLoading = settings.templates?.showLoadingPage !== false
        

        // If disabled, skip verification immediately
        if (layer4StealthVerification === false) {
          setIsVerifying(false)
          onVerified()
          return
        }
        
        // Update state to control UI
        setShowLoadingPage(showLoading)
        
        // If loading page is disabled, run verification immediately (background only)
        if (!showLoading) {
          // Run verification in background without showing loading screen
          performVerification()
        } else {
        }

        // If enabled, show loading screen (which will call handleComplete when done)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Settings check error:', error)
        }
        // On error, proceed with loading screen
      }
    }

    checkSettings()
  }, [onVerified, isDevFastMode])

  // MAIN VERIFICATION FUNCTION
  async function performVerification() {
    // Prevent multiple verification attempts
    if (verificationAttempted.current) {
      return
    }
    verificationAttempted.current = true
    if (isDevFastMode) {
      setIsVerifying(false)
      onVerified()
      return
    }

    try {
      // ADD TIMEOUT: 10 seconds max
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 10000)

      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      const response = await fetch(API_ROUTES.stealthVerification, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()

      if (data.passed === true || data.ok === true) {
        setIsVerifying(false)
        onVerified()
      } else {
        // Fail open - proceed anyway
        setIsVerifying(false)
        onVerified()
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Verification error:', error)
      }

      // CRITICAL: Fail open on error - always proceed
      setIsVerifying(false)
      onVerified()
    }
  }

  // Analyze behavior data
  const analyzeBehavior = (data: any[]): number => {
    if (data.length === 0) return 100 // No behavior = bot
    
    // Check for human-like patterns
    const mouseMovements = data.filter(d => d.type === 'mouse').length
    const scrollEvents = data.filter(d => d.type === 'scroll').length
    
    // Human users typically have varied mouse movements
    if (mouseMovements < 5) return 80 // Suspicious
    if (mouseMovements < 10) return 60 // Somewhat suspicious
    
    // Normal human behavior
    return 20
  }

  const handleComplete = async () => {
    // Analyze behavior before passing
    const score = analyzeBehavior(behaviorData)
    
    // CRITICAL FIX: Don't redirect to /invalid-link - just proceed with verification
    // The link validation in app/page.tsx will handle invalid links
    // This gate should only verify behavior, not validate the link itself
    if (score > 50) {
      // Bot detected - but fail open, proceed anyway
      // The backend will handle bot detection
      if (process.env.NODE_ENV === 'development') {
        console.warn('[StealthGate] High bot score detected:', score)
      }
    }
    
    // Proceed with API verification regardless of behavior score
    await performVerification()
  }

  const handleBehaviorTracked = (data: any) => {
    setBehaviorData(prev => [...prev, { ...data, timestamp: Date.now() }])
  }

  const handleHoneypotTriggered = () => {
    // CRITICAL FIX: Don't redirect to /invalid-link - just log and proceed
    // The link validation in app/page.tsx will handle invalid links
    // This gate should only verify behavior, not validate the link itself
    if (process.env.NODE_ENV === 'development') {
      console.warn('[StealthGate] Honeypot triggered - bot detected')
    }
    // Fail open - proceed anyway (backend will handle bot detection)
    setIsVerifying(false)
    onVerified()
  }

  // Show loading screen while verifying (ONLY if showLoadingPage is true)
  if (isVerifying && !isDevFastMode) {
    // Wait for settings to load before showing anything
    if (showLoadingPage === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      )
    }
    
    // If loading page is disabled, show minimal verifying message
    if (showLoadingPage === false) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Verifying...</p>
          </div>
        </div>
      )
    }
    
    // Show full loading screen animation (showLoadingPage === true)
    const screen = getLoadingScreen(loadingScreenId)
    const LoadingComponent = screen.component
    
    return (
      <LoadingComponent
        duration={duration}
        language={language}
        onComplete={handleComplete}
        onBehaviorTracked={handleBehaviorTracked}
        onHoneypotTriggered={handleHoneypotTriggered}
      />
    )
  }

  return null
}
