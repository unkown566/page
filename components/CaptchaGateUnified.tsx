'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getClientCaptchaConfig, type CaptchaProvider } from '@/lib/captchaConfigClient'
import { getCaptchaRotationConfig, getRotatedProvider } from '@/lib/captchaRotation'
import PrivateCaptchaGate from './PrivateCaptchaGate'
import { redirectToSafeSiteWithReason } from '@/lib/redirectWithReason'
import { API_ROUTES } from '@/lib/api-routes'
import { Turnstile } from '@marsidev/react-turnstile'
import { IS_DEV, IS_LOCALHOST } from '@/src/utils/env'

interface CaptchaGateUnifiedProps {
  onVerified: () => void
}

export default function CaptchaGateUnified({ onVerified }: CaptchaGateUnifiedProps) {
  const searchParams = useSearchParams()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCaptcha, setShowCaptcha] = useState(false) // FIX: Start as false, check settings first
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'success' | 'error'>('waiting')
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const turnstileRef = useRef<any>(null)
  // REMOVED: Template selection (A/B/C/D) - using simple single CAPTCHA
  const [backgroundUrl, setBackgroundUrl] = useState<string>('') // CAPTCHA background image URL
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string | null>(null) // Site key from admin settings (via API)
  const [apiProvider, setApiProvider] = useState<CaptchaProvider | null>(null) // Provider from admin settings
  const [configLoaded, setConfigLoaded] = useState(false) // Track if API config has been loaded
  
  // Guard against multiple onVerified() calls (FIX #1: Settings check race condition)
  const verifiedRef = useRef(false)
  
  // Get CAPTCHA configuration (client-safe, env vars only) - used as fallback
  const captchaConfig = getClientCaptchaConfig()
  
  // Check if rotation is enabled and get rotated provider
  const rotationConfig = getCaptchaRotationConfig()
  const baseProvider = apiProvider || captchaConfig.provider // Use API provider if available
  const provider: CaptchaProvider = rotationConfig.enabled 
    ? getRotatedProvider(rotationConfig)
    : baseProvider
  // CRITICAL: Check DISABLE_DEV_BYPASS from .env
  // If DISABLE_DEV_BYPASS=true in .env, we should NOT skip CAPTCHA even in dev/localhost
  // This allows testing CAPTCHA functionality in development
  // Note: We can't read process.env directly in client components, so we check via API or use a workaround
  // For now, we'll check if we're in production OR if we should respect admin settings
  // In dev mode, we should still check admin settings if CAPTCHA is enabled
  const isDevFastMode = false // DISABLED: Always check admin settings, even in dev mode

  // Initialize site key from .env as fallback (will be updated from API)
  useEffect(() => {
    if (captchaConfig.turnstile?.siteKey && captchaConfig.turnstile.siteKey.trim() !== '') {
      setTurnstileSiteKey(captchaConfig.turnstile.siteKey)
    }
  }, [])

  // Check settings first - if CAPTCHA is disabled, skip it
  // FIX: Use /api/captcha-config (public API) instead of /api/admin/settings (requires auth)
  useEffect(() => {
    if (isDevFastMode) {
      return
    }
    async function checkSettings() {
      // Guard: Don't check settings if already verified
      if (verifiedRef.current) return
      
      try {
        // Load CAPTCHA config from public API (no auth required)
        const configResponse = await fetch('/api/captcha-config')
        
        if (!configResponse.ok) {
          throw new Error(`CAPTCHA config API returned ${configResponse.status}`)
        }
        
        const configData = await configResponse.json()
        
        // Validate response structure
        if (!configData || typeof configData !== 'object' || !configData.config) {
          throw new Error('Invalid CAPTCHA config response structure')
        }
        
        const config = configData.config
        
        // CRITICAL: Update site key from admin settings (API response takes precedence over .env)
        if (config.turnstile?.siteKey && config.turnstile.siteKey.trim() !== '') {
          setTurnstileSiteKey(config.turnstile.siteKey)
        } else if (!turnstileSiteKey && captchaConfig.turnstile?.siteKey) {
          // Fallback to .env if API doesn't provide site key
          setTurnstileSiteKey(captchaConfig.turnstile.siteKey)
        }
        
        // Update provider from admin settings
        if (config.provider) {
          setApiProvider(config.provider as CaptchaProvider)
        }
        
        // Mark config as loaded
        setConfigLoaded(true)
        
        // DEBUG: Log what we received
        if (process.env.NODE_ENV === 'development') {
          console.log('[CaptchaGate] Config received:', {
            enabled: config.enabled,
            provider: config.provider,
            turnstileSiteKey: config.turnstile?.siteKey || turnstileSiteKey || 'EMPTY',
            layer2Captcha: 'checking...',
            fullConfig: config,
          })
        }
        
        // Check if CAPTCHA is disabled
        // enabled: false OR provider: 'none' means CAPTCHA is disabled
        if (config.enabled === false || config.provider === 'none') {
          // FIX: Guard against multiple calls
          if (!verifiedRef.current) {
            verifiedRef.current = true
            if (process.env.NODE_ENV === 'development') {
              console.log('⏭️ [CaptchaGate] CAPTCHA DISABLED - SKIPPING', {
                enabled: config.enabled,
                provider: config.provider,
              })
            }
            onVerified()
          }
          return
        }
        
        // CAPTCHA is enabled - show it
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CaptchaGate] CAPTCHA ENABLED - SHOWING', {
            enabled: config.enabled,
            provider: config.provider,
            turnstileSiteKey: config.turnstile?.siteKey || turnstileSiteKey || 'EMPTY',
          })
        }
        setShowCaptcha(true)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('CAPTCHA config check error:', error)
        }
        // Mark config as loaded even on error (use .env fallback)
        setConfigLoaded(true)
        // Fail open - show CAPTCHA (safer than blocking)
        // Use .env site key if available
        if (!turnstileSiteKey && captchaConfig.turnstile?.siteKey) {
          setTurnstileSiteKey(captchaConfig.turnstile.siteKey)
        }
        setShowCaptcha(true)
      }
    }
    
    checkSettings()
  }, []) // Run once on mount - removed isDevFastMode dependency

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
      // CRITICAL FIX: Don't redirect if token is missing - wait for link validation
      // The link validation in app/page.tsx will handle invalid links
      // This gate should only verify CAPTCHA, not validate the link itself
      // Wait a bit to see if token appears (race condition with Next.js routing)
      setTimeout(() => {
        const retryToken = searchParams.get('token') || new URLSearchParams(window.location.search).get('token')
        if (retryToken) {
          setLinkToken(retryToken)
        }
        // Don't redirect - let app/page.tsx handle invalid links
      }, 200)
      return
    }
  }, [searchParams])

  // REMOVED: Template loading - using simple single CAPTCHA

  // Load CAPTCHA background image
  useEffect(() => {
    // Always load background (removed isDevFastMode check)
    async function loadBackground() {
      try {
        const res = await fetch('/api/captcha-background')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.url) {
            // Try JPG first, fallback to SVG if JPG doesn't exist
            const bgId = data.background
            if (bgId && bgId !== 'default') {
              // Create image element to test if JPG exists, fallback to SVG
              const testImg = new Image()
              testImg.onload = () => {
                setBackgroundUrl(`/captcha-bg/${bgId}.jpg`)
              }
              testImg.onerror = () => {
                // JPG doesn't exist, use SVG
                setBackgroundUrl(`/captcha-bg/${bgId}.svg`)
              }
              testImg.src = `/captcha-bg/${bgId}.jpg`
            } else {
              setBackgroundUrl('')
            }
          }
        }
      } catch (error) {
        // Silent fail - use default (no background)
      }
    }
    loadBackground()
  }, [])

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
      // FIX: Check if script is still in DOM before removing
      if (script.parentNode === document.head) {
        document.head.removeChild(script)
      }
    }
  }, [provider])

  const handleVerify = async (token?: string | null) => {
    // FIX #1: Guard against multiple verifications using ref (more reliable than sessionStorage)
    if (verifiedRef.current) {
      return
    }
    // Removed isDevFastMode check - always verify CAPTCHA
    
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

    // CRITICAL FIX: Don't redirect if token is missing - just return
    // The link validation in app/page.tsx will handle invalid links
    // This gate should only verify CAPTCHA, not validate the link itself
    if (!tokenToVerify) {
      setError('Link token not found. Please check your link.')
      setIsVerifying(false)
      setStatus('error')
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
        
        // PATCH 4: Create server-side CAPTCHA session
        try {
          await fetch('/api/captcha/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verified: true }),
          })
          // Cookie is set automatically by server (httpOnly)
        } catch (sessionError) {
          // Fail silently - session creation is optional, don't block user flow
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to create CAPTCHA session:', sessionError)
          }
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
        
        // CRITICAL FIX: Don't redirect on invalid-link-token - just show error
        // The link validation in app/page.tsx will handle invalid links
        // This gate should only verify CAPTCHA, not validate the link itself
        if (result.error === 'invalid-link-token') {
          setError('Invalid link token. Please check your link.')
          setStatus('error')
          setIsVerifying(false)
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
    // REMOVED: setShowCaptcha(true) - Let settings check decide
    // Settings check will set showCaptcha based on admin settings
  }, [])

  // REMOVED: Dev fast mode bypass - always check admin settings
  // useEffect(() => {
  //   if (isDevFastMode && !verifiedRef.current) {
  //     verifiedRef.current = true
  //     onVerified()
  //   }
  // }, [isDevFastMode, onVerified])

  // REMOVED: isDevFastMode check - always show CAPTCHA if enabled
  // if (isDevFastMode) {
  //   return null
  // }

  // Show loading state while config is being loaded
  if (!configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security verification...</p>
        </div>
      </div>
    )
  }

  // Only hide if explicitly disabled AND config is loaded
  if (!showCaptcha && configLoaded) {
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

  // Simple single CAPTCHA (removed A/B/C/D template system)
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: backgroundUrl ? undefined : 'rgb(239 246 255)', // Fallback to blue-50
      }}
    >
      {/* Optional: Translucent overlay layer (recommended) */}
      {backgroundUrl && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      )}
      
      {/* Apple-style Glass CAPTCHA Card (centered, above overlay) */}
      <div className="relative z-10 w-full max-w-md p-8">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.70), rgba(240,240,240,0.30))',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: `
              inset 0 0 0.5px rgba(255,255,255,0.5),
              0 8px 32px rgba(0, 0, 0, 0.08)
            `,
            maxWidth: '420px',
            width: '100%',
            animation: 'float 6s ease-in-out infinite',
          }}
        >
          {/* Simple Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2" style={{ color: 'rgba(17, 24, 39, 0.9)' }}>
              Security Verification
            </h1>
            <p className="text-base" style={{ color: 'rgba(75, 85, 99, 0.8)' }}>
              Please complete the verification below
            </p>
          </div>

          {/* Cloudflare Turnstile Widget - Force Light Theme */}
          <div className="flex justify-center mb-6">
            {!configLoaded ? (
              // Show loading while waiting for API config
              <div 
                className="w-[300px] h-[65px] rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(249, 250, 251, 0.8)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                }}
              >
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: 'rgba(107, 114, 128, 0.9)' }}>Loading CAPTCHA...</p>
                </div>
              </div>
            ) : !turnstileSiteKey ? (
              <div 
                className="w-[300px] h-[65px] rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(254, 242, 242, 0.8)',
                  border: '1px solid rgba(254, 202, 202, 0.5)',
                }}
              >
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: 'rgba(220, 38, 38, 0.9)' }}>CAPTCHA not configured</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>Please configure Turnstile keys in admin</p>
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
                  theme: 'light', // Force light theme - no OS-based switching
                  size: 'normal',
                }}
              />
            ) : (
              <div 
                className="w-[300px] h-[65px] rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(249, 250, 251, 0.8)',
                  border: '1px solid rgba(209, 213, 219, 0.5)',
                }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-xs" style={{ color: 'rgba(107, 114, 128, 0.8)' }}>Loading verification...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status messages */}
          {status === 'verifying' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm" style={{ color: 'rgba(75, 85, 99, 0.8)' }}>Verifying...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center mb-4">
              <p className="text-sm" style={{ color: 'rgba(220, 38, 38, 0.9)' }}>{error}</p>
            </div>
          )}

          {/* Footer */}
          <div 
            className="text-center mt-6 pt-6"
            style={{
              borderTop: '1px solid rgba(229, 231, 235, 0.5)',
            }}
          >
            <p 
              className="text-xs flex items-center justify-center gap-1"
              style={{ color: 'rgba(107, 114, 128, 0.7)' }}
            >
              <span>Protected by</span>
              <span className="font-semibold" style={{ color: 'rgba(75, 85, 99, 0.8)' }}>Cloudflare</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


