'use client'

import { useState, useEffect, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { useSearchParams } from 'next/navigation'
import { TURNSTILE_TEST_KEYS } from '@/lib/captchaConfigClient'

interface CaptchaGateProps {
  onVerified: () => void
}

export default function CaptchaGate({ onVerified }: CaptchaGateProps) {
  const searchParams = useSearchParams()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCaptcha, setShowCaptcha] = useState(true)
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'success' | 'error'>('waiting')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const turnstileRef = useRef<any>(null)

  // Use official Cloudflare Turnstile testing keys (for development)
  // Official test keys: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#test-keys
  // SITE_KEY_PASS = always pass (official test site key)
  // SITE_KEY_FAIL = always fail (official test site key)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_KEYS.SITE_KEY_PASS

  // Get link token from URL query string
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setLinkToken(token)
    } else {
      // Redirect to invalid link page instead of showing error
      window.location.href = '/invalid-link'
      return
    }
  }, [searchParams])

  // Load Turnstile script manually to ensure it loads
  useEffect(() => {
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
      // Cleanup
      const existingScript = document.querySelector('script[src*="turnstile"]')
      if (existingScript) {
        // Don't remove if other components might need it
      }
    }
  }, [])

  const handleVerify = async (token?: string | null) => {
    // Use provided token or fall back to state
    const tokenToUse = token || captchaToken
    
    if (!tokenToUse) {
      // Wait for token - don't show error
      return
    }

    if (!linkToken) {
      // Redirect to invalid link page
      window.location.href = '/invalid-link'
      return
    }

    setIsVerifying(true)
    setStatus('verifying')
    setError(null)

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const res = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          turnstileToken: tokenToUse, // Use the token parameter, not state
          linkToken: linkToken,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const result = await res.json()
      
      // Detailed response analysis

      // Check explicitly for true (not just truthy)
      const isOk = result.ok === true
      const isSuccess = result.success === true
      

      if (isOk || isSuccess) {
        
        // Stop verifying state immediately
        setIsVerifying(false)
        setStatus('success')
        
        // Store verification in session storage
        sessionStorage.setItem('captcha_verified', 'true')
        sessionStorage.setItem('captcha_timestamp', Date.now().toString())
        if (result.payload) {
          sessionStorage.setItem('link_payload', JSON.stringify(result.payload))
        }
        
        // Hide CAPTCHA immediately
        setShowCaptcha(false)
        
        // Call onVerified callback to trigger main page render
        try {
          onVerified()
        } catch (error) {
        }
      } else {
        setStatus('error')
        setIsVerifying(false)
        
        // Handle invalid link token - redirect to invalid link page
        if (result.error === 'invalid-link-token') {
          window.location.href = '/invalid-link'
          return
        }
        
        // Handle other errors
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

  // IMPORTANT: Always show CAPTCHA first - don't auto-verify from sessionStorage
  // This ensures users always see and complete the CAPTCHA challenge
  // The parent component will handle sessionStorage checks for the landing page only
  useEffect(() => {
    // Clear any existing sessionStorage to force fresh CAPTCHA verification
    // This prevents the CAPTCHA from being skipped
    const verified = sessionStorage.getItem('captcha_verified')
    if (verified === 'true') {
      sessionStorage.removeItem('captcha_verified')
      sessionStorage.removeItem('captcha_timestamp')
      sessionStorage.removeItem('link_payload')
    }
    // Always show CAPTCHA - don't auto-verify
    setShowCaptcha(true)
  }, [])

  // If already verified, don't render
  if (!showCaptcha) {
    return null
  }

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
            {scriptLoaded || typeof window !== 'undefined' && (window as any).turnstile ? (
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={async (token) => {
                  if (token) {
                    // Check if using official test token (always pass)
                    const isOfficialTestToken = token === TURNSTILE_TEST_KEYS.SITE_KEY_PASS
                    
                    setCaptchaToken(token)
                    setError(null)
                    setStatus('verifying')
                    setIsVerifying(true)
                    
                    // Auto-verify immediately for official test mode, small delay for production
                    const delay = isOfficialTestToken ? 50 : 100
                    
                    // Pass token directly to avoid state timing issues
                    setTimeout(() => {
                      handleVerify(token) // Pass token directly!
                    }, delay)
                  } else {
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

          {/* Status messages - minimal, removed "Please complete the verification" */}
          {status === 'waiting' && !captchaToken && scriptLoaded && (
            <div className="text-center">
              <p className="text-xs text-gray-400">
                Click the checkbox above to verify
              </p>
            </div>
          )}

          {/* Verifying state - minimal spinner only, no text */}
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

          {/* Manual verify button (if needed) */}
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

