import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenId } from '@/lib/tokens'
import { createSession } from '@/lib/sessions'

// In-memory token consumption tracking (use Redis in production)
const consumedTokens = new Map<string, number>()

// Cleanup old consumed tokens
setInterval(() => {
  const now = Date.now()
  const TTL = 60 * 60 * 1000 // 1 hour

  for (const [tokenId, timestamp] of Array.from(consumedTokens.entries())) {
    if (now - timestamp > TTL) {
      consumedTokens.delete(tokenId)
    }
  }
}, 5 * 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, turnstileResponse, email } = body

    if (!token || !turnstileResponse) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get IP and User-Agent
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // 1. Verify Origin/Referer (CSRF protection)
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    // Allow same-origin or known domains
    if (origin && !origin.includes(new URL(request.url).hostname)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid origin' },
        { status: 403 }
      )
    }

    // 2. Verify HMAC token signature and expiry with fingerprint/IP binding
    // Get fingerprint from request if available
    const fingerprint = body.fingerprint || request.headers.get('x-fingerprint') || undefined
    
    const tokenResult = verifyToken(token, {
      fingerprint,
      ip,
      strictBinding: false, // Lenient mode - allow legitimate changes
    })
    
    if (!tokenResult.valid || !tokenResult.payload) {
      // Log security event for invalid token
      const { logSecurityEvent } = await import('@/lib/securityMonitoring')
      await logSecurityEvent({
        type: 'token_invalid',
        ip,
        fingerprint,
        severity: 'medium',
        details: { error: tokenResult.error },
        userAgent,
      })
      
      return NextResponse.json(
        { ok: false, error: tokenResult.error || 'Invalid token' },
        { status: 401 }
      )
    }

    // Check email matches
    if (email && tokenResult.payload.email !== email) {
      return NextResponse.json(
        { ok: false, error: 'Email mismatch' },
        { status: 401 }
      )
    }

    // 3. Verify Turnstile server-side
    // Get secret key from admin settings (admin panel is single source of truth)
    const { getSettings } = await import('@/lib/adminSettings')
    const adminSettings = await getSettings()
    const turnstileSecret = adminSettings.security.captcha.provider === 'turnstile' 
      ? adminSettings.security.captcha.turnstileSecretKey?.trim() 
      : undefined
    const isTestingMode = process.env.NODE_ENV === 'development'
    
    if (turnstileSecret) {
      // Check if using official Cloudflare Turnstile test tokens
      const { TURNSTILE_TEST_KEYS } = await import('@/lib/captchaConfigTypes')
      if (isTestingMode && (turnstileResponse === TURNSTILE_TEST_KEYS.SITE_KEY_PASS || turnstileResponse === TURNSTILE_TEST_KEYS.SITE_KEY_FAIL)) {
        // Testing mode: SITE_KEY_PASS = always pass, SITE_KEY_FAIL = always fail
        if (turnstileResponse === TURNSTILE_TEST_KEYS.SITE_KEY_FAIL) {
          return NextResponse.json(
            { ok: false, error: 'CAPTCHA verification failed (testing mode)' },
            { status: 403 }
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
              response: turnstileResponse,
              remoteip: ip,
            }),
          }
        )

        const turnstileResult = await turnstileVerifyResponse.json()
        if (!turnstileResult.success) {
          return NextResponse.json(
            { ok: false, error: 'CAPTCHA verification failed' },
            { status: 403 }
          )
        }
      }
    }

    // 4. Check if token already consumed (single-use)
    const tokenId = getTokenId(token)
    if (consumedTokens.has(tokenId)) {
      return NextResponse.json(
        { ok: false, error: 'Token already used' },
        { status: 403 }
      )
    }

    // 5. Mark token as consumed (atomic)
    consumedTokens.set(tokenId, Date.now())

    // 6. Create session
    const sessionId = createSession(
      tokenResult.payload.email,
      ip,
      userAgent
    )

    // 7. Return session ID
    return NextResponse.json({
      ok: true,
      sessionId,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

