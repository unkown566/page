'use client'

import { useState, useEffect, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { useSearchParams } from 'next/navigation'
import { getClientCaptchaConfig, type CaptchaProvider } from '@/lib/captchaConfigClient'
import { getCaptchaRotationConfig, getRotatedProvider } from '@/lib/captchaRotation'
import PrivateCaptchaGate from './PrivateCaptchaGate'
import { redirectToSafeSiteWithReason } from '@/lib/redirectWithReason'
import { API_ROUTES } from '@/lib/api-routes'

interface CaptchaGateUnifiedProps {
  onVerified: () => void
}

export default function CaptchaGateUnified({ onVerified }: CaptchaGateUnifiedProps) {
  const searchParams = useSearchParams()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCaptcha, setShowCaptcha] = useState(true)
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'success' | 'error'>('waiting')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const turnstileRef = useRef<any>(null)
  
  // Guard against multiple onVerified() calls (FIX #1: Settings check race condition)
  const verifiedRef = useRef(false)
  
  // Get CAPTCHA configuration (client-safe, env vars only)
  const captchaConfig = getClientCaptchaConfig()
  
  // Check if rotation is enabled and get rotated provider
  const rotationConfig = getCaptchaRotationConfig()
  const baseProvider = captchaConfig.provider
  const provider: CaptchaProvider = rotationConfig.enabled 
    ? getRotatedProvider(rotationConfig)
    : baseProvider

  // Require real Turnstile site key - no test mode fallback
  // User must configure real Turnstile keys in admin settings or environment variables
  let turnstileSiteKey: string | null = null
  if (captchaConfig.turnstile?.siteKey && captchaConfig.turnstile.siteKey.trim() !== '') {
    turnstileSiteKey = captchaConfig.turnstile.siteKey
  }
  
  // If no site key configured, show error
  if (!turnstileSiteKey) {
  }

  // Check settings first - if CAPTCHA is disabled, skip it
  // FIX #1: Removed onVerified dependency, added guard against multiple calls
  // FIX #4: Added settings response validation
  useEffect(() => {
    async function checkSettings() {
      // Guard: Don't check settings if already verified
      if (verifiedRef.current) return
      
      try {
        // Load settings
        const settingsResponse = await fetch('/api/admin/settings')
        
        // FIX #4: Validate response structure
        if (!settingsResponse.ok) {
          throw new Error(`Settings API returned ${settingsResponse.status}`)
        }
        
        const responseData = await settingsResponse.json()
        
        // FIX #4: Validate response is an object
        if (!responseData || typeof responseData !== 'object') {
          throw new Error('Invalid settings response structure')
        }
        
        // API returns { success: true, settings: {...} } or just settings object
        const settings = responseData.settings || responseData
        
        // FIX #4: Validate settings structure
        if (!settings.security || typeof settings.security !== 'object') {
          setShowCaptcha(true)
          return
        }
        
        // Check both gate setting and feature setting (support both structures)
        const layer2Captcha = settings.security.gates?.layer2Captcha
        const captchaEnabled = settings.security.captcha?.enabled
        const captchaProvider = settings.security.captcha?.provider
        
        // Check if CAPTCHA gate is disabled (correct path: settings.security.gates.layer2Captcha)
        if (layer2Captcha === false || captchaEnabled === false || captchaProvider === 'none') {
          // FIX #1: Guard against multiple calls
          if (!verifiedRef.current) {
            verifiedRef.current = true
            onVerified()
          }
          return
        }
        
        setShowCaptcha(true)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Settings check error:', error)
        }
        // Fail open - show CAPTCHA (safer than blocking)
        setShowCaptcha(true)
      }
    }
    
    checkSettings()
  }, []) // FIX #1: Removed onVerified dependency - only run once on mount

  // Get link token from URL query string
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Try both useSearchParams and direct URL parsing as fallback
    const token = searchParams.get('token') || new URLSearchParams(window.location.search).get('token')
    
    if (token) {
      setLinkToken(token)
      // Store in sessionStorage for persistence across re-renders
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('link_token', token)
      }
    } else {
      // Wait a bit to see if token appears (race condition with Next.js routing)
      setTimeout(() => {
        const retryToken = searchParams.get('token') || new URLSearchParams(window.location.search).get('token')
        if (!retryToken) {
          redirectToSafeSiteWithReason('token_invalid')
        } else {
          setLinkToken(retryToken)
        }
      }, 200)
      return
    }
  }, [searchParams])

  // Load Turnstile script manually (only for Turnstile provider)
  useEffect(() => {
    if (provider !== 'turnstile') return
    
    // Check if script already loaded
    if (typeof window !== 'undefined' && (window as any).turnstile) {
      setScriptLoaded(true)
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      setScriptLoaded(true)
    }
    script.onerror = () => {
      setError('Failed to load Cloudflare Turnstile script. Please check your connection.')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup handled by React
    }
  }, [provider])

  const handleVerify = async (token?: string | null) => {
    // FIX #1: Guard against multiple verifications using ref (more reliable than sessionStorage)
    if (verifiedRef.current) {
      return
    }
    
    // Use provided token or fall back to state
    const tokenToUse = token || captchaToken
    
    if (!tokenToUse) {
      setError('CAPTCHA token missing. Please try again.')
      return
    }

    // FIX #2: Simplified token recovery - single source of truth with clear priority
    const tokenToVerify = linkToken || 
      (typeof window !== 'undefined' ? sessionStorage.getItem('link_token') : null) ||
      searchParams.get('token') ||
      (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null)

    if (!tokenToVerify) {
      redirectToSafeSiteWithReason('token_invalid')
      return
    }
    
    // Update state and sessionStorage if we recovered token from fallback
    if (tokenToVerify !== linkToken) {
      setLinkToken(tokenToVerify)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('link_token', tokenToVerify)
      }
    }

    setIsVerifying(true)
    setStatus('verifying')
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      // FIX #3: Add fallback if API route is undefined
      const verifyUrl = API_ROUTES.verifyCaptcha || '/api/security/challenge/verify'
      
      if (!API_ROUTES.verifyCaptcha) {
      }

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          captchaToken: tokenToUse, // Use generic field name
          linkToken: tokenToVerify, // Use the recovered token
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const result = await res.json()
      
      const isOk = result.ok === true
      const isSuccess = result.success === true
      
      if (isOk || isSuccess) {
        // FIX #1: Guard against multiple calls
        if (verifiedRef.current) {
          return // Already verified, don't call again
        }
        
        verifiedRef.current = true
        setIsVerifying(false)
        setStatus('success')
        
        // FIX #5: Store verification state AFTER setting verifiedRef
        sessionStorage.setItem('captcha_verified', 'true')
        sessionStorage.setItem('captcha_timestamp', Date.now().toString())
        if (result.payload) {
          sessionStorage.setItem('link_payload', JSON.stringify(result.payload))
        }
        
        setShowCaptcha(false)
        
        try {
          onVerified()
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error calling onVerified():', error)
          }
        }
      } else {
        setStatus('error')
        setIsVerifying(false)
        
        if (result.error === 'invalid-link-token') {
          redirectToSafeSiteWithReason('token_invalid')
          return
        }
        
        let errorMsg = 'Verification failed. Please try again.'
        if (result.errorCodes?.length) {
          errorMsg = `Verification failed: ${result.errorCodes.join(', ')}`
        } else if (result.error) {
          errorMsg = result.error
        }
        
        setError(errorMsg)
        setCaptchaToken(null)
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Verification error:', err)
      }
      setStatus('error')
      setIsVerifying(false)
      
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Verification timed out. Please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Network error. Please try again.')
      }
      
      setCaptchaToken(null)
    }
  }

  // Handle PrivateCaptcha verification
  const handlePrivateCaptchaVerified = (token: string) => {
    setCaptchaToken(token)
    handleVerify(token)
  }

  // FIX #5: Clear verification state on mount (BEFORE any checks)
  // This ensures fresh verification on each page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear any stale verification state immediately
      sessionStorage.removeItem('captcha_verified')
      sessionStorage.removeItem('captcha_timestamp')
      sessionStorage.removeItem('link_payload')
      // Reset verified ref
      verifiedRef.current = false
    }
    setShowCaptcha(true)
  }, []) // Run once on mount, before any other effects

  if (!showCaptcha) {
    return null
  }

  // Render PrivateCaptcha if configured
  if (provider === 'privatecaptcha' && captchaConfig.privatecaptcha) {
    return (
      <PrivateCaptchaGate
        onVerified={handlePrivateCaptchaVerified}
        siteKey={captchaConfig.privatecaptcha.siteKey}
        endpoint={captchaConfig.privatecaptcha.endpoint}
        displayMode={captchaConfig.privatecaptcha.displayMode}
        theme={captchaConfig.privatecaptcha.theme}
        lang={captchaConfig.privatecaptcha.lang}
        startMode={captchaConfig.privatecaptcha.startMode}
      />
    )
  }

  // Render Turnstile (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Cloudflare-style header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#F6821F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#F6821F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#F6821F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verify you're human
            </h1>
            <p className="text-sm text-gray-600">
              Complete the security check to continue
            </p>
          </div>

          {/* Cloudflare Turnstile Widget */}
          <div className="flex justify-center mb-6">
            {!turnstileSiteKey ? (
              <div className="w-[300px] h-[65px] bg-red-50 border border-red-200 rounded flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-red-600 font-medium">CAPTCHA not configured</p>
                  <p className="text-xs text-red-500 mt-1">Please configure Turnstile keys</p>
                </div>
              </div>
            ) : scriptLoaded || (typeof window !== 'undefined' && (window as any).turnstile) ? (
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={async (token) => {
                  // FIX #1: Use ref guard instead of sessionStorage check
                  if (verifiedRef.current) {
                    return
                  }
                  
                  if (token) {
                    setCaptchaToken(token)
                    setError(null)
                    setStatus('verifying')
                    setIsVerifying(true)
                    
                    // Verify immediately - no test mode bypass
                    setTimeout(() => {
                      handleVerify(token)
                    }, 100)
                  }
                }}
                onError={() => {
                  setCaptchaToken(null)
                  setStatus('error')
                  setError('Verification failed. Please try again.')
                }}
                onExpire={() => {
                  setCaptchaToken(null)
                  setStatus('waiting')
                  setError('Verification expired. Please verify again.')
                }}
                options={{
                  theme: 'light',
                  size: 'normal',
                }}
              />
            ) : (
              <div className="w-[300px] h-[65px] bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading verification...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status messages */}
          {status === 'waiting' && !captchaToken && scriptLoaded && (
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Click the checkbox above to verify
              </p>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-600">Verification successful</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {captchaToken && status !== 'verifying' && status !== 'success' && (
            <button
              onClick={() => handleVerify()}
              disabled={isVerifying || !captchaToken}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded text-sm transition-colors duration-200"
            >
              {isVerifying ? 'Verifying...' : 'Continue'}
            </button>
          )}

          {/* Cloudflare footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Protected by{' '}
              <span className="font-semibold text-gray-600">Cloudflare</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


