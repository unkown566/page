/**
 * Security Challenge Verification Endpoint
 * Verifies CAPTCHA and security challenges
 * POST /api/security/challenge/verify
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadSettings } from '@/lib/adminSettings'
import { verifyToken } from '@/lib/tokens'
import { verifyCaptchaToken } from '@/lib/captchaProviders'
import { addVisitorLog } from '@/lib/visitorTracker'
import { getGeoData } from '@/lib/geoLocation'
import { sendBotDetectionNotification } from '@/lib/botNotifications'

function verifyLinkToken(
  rawToken: string,
  options?: {
    fingerprint?: string
    ip?: string
  }
): { valid: boolean; reason?: string; payload?: any } {
  if (!rawToken) return { valid: false, reason: 'missing' }

  // Type B/C tokens are timestamp-based (e.g., 1763058004035_a1b2c3) - don't verify as JWT
  // Type A tokens are JWTs (start with eyJ)
  const isSimpleToken = rawToken.includes('_') && !rawToken.includes('.') && !rawToken.startsWith('eyJ')
  
  if (isSimpleToken || rawToken.startsWith('gen_')) {
    // Simple token (Type B/C) - skip JWT verification
    // These tokens are validated against database in link-status API
    // NOTE: This only validates the link token format - CAPTCHA token still needs verification
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Simple token format detected - skipping JWT check (CAPTCHA still required)')
    }
    return { valid: true, payload: { type: 'simple' } }
  }

  // JWT token (Type A) - verify signature
  const result = verifyToken(rawToken, {
    fingerprint: options?.fingerprint,
    ip: options?.ip,
    strictBinding: false, // Lenient mode - allow legitimate changes
  })
  
  if (result.valid && result.payload) {
    return { valid: true, payload: result.payload }
  }

  // Return error reason from verification
  return { 
    valid: false, 
    reason: result.error || 'invalid',
  }
}

export async function POST(request: NextRequest) {
  try {
    // LOAD ADMIN SETTINGS
    const settings = await loadSettings()
    
    // CHECK IF CAPTCHA IS ENABLED IN SETTINGS
    if (settings.security?.gates?.layer2Captcha === false) {
      return NextResponse.json({
        ok: true,
        message: 'CAPTCHA disabled in settings'
      })
    }
    
    const body = await request.json()
    // Support both old field name (turnstileToken) and new generic name (captchaToken)
    const captchaToken = body.captchaToken || body.turnstileToken || body.privatecaptchaToken
    const sessionIdentifier = body.sessionIdentifier || body.linkToken || body.token // Legacy: linkToken
    
    // Get IP and fingerprint for token binding validation
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'Unknown'
    const fingerprint = body.fingerprint || request.headers.get('x-fingerprint') || undefined

    // 1️⃣ Verify the session identifier first (REQUIRED) (formerly: linkToken)
    if (!sessionIdentifier) {
      return NextResponse.json(
        { 
          ok: false, 
          success: false, 
          error: 'invalid-session-token', 
          reason: 'missing' 
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }
    
    const tokenCheck = verifyLinkToken(sessionIdentifier, {
      fingerprint,
      ip,
    })
    if (!tokenCheck.valid) {
      // Log security event for invalid token
      const { logSecurityEvent } = await import('@/lib/securityMonitoring')
      await logSecurityEvent({
        type: 'token_invalid',
        ip,
        fingerprint,
        severity: 'medium',
        details: { reason: tokenCheck.reason },
        userAgent: request.headers.get('user-agent') || 'Unknown',
      })
      return NextResponse.json(
        { 
          ok: false, 
          success: false, 
          error: 'invalid-link-token', 
          reason: tokenCheck.reason 
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    // 2️⃣ Verify CAPTCHA token is present
    if (!captchaToken) {
      return NextResponse.json(
        { ok: false, success: false, error: 'missing-captcha-token' },
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    // 3️⃣ Verify CAPTCHA using configured provider from admin settings
    // Get CAPTCHA config from admin settings directly (server-side only)
    const { getCaptchaConfigFromAdmin } = await import('@/lib/captchaConfigServer')
    const captchaConfig = await getCaptchaConfigFromAdmin()
    
    // If admin settings don't provide config, fall back to env vars
    const finalConfig = captchaConfig.provider !== 'none' 
      ? captchaConfig 
      : {
          provider: (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER as any) || 'none',
          turnstile: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? {
            siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            secretKey: process.env.TURNSTILE_SECRET_KEY,
          } : undefined,
        }
    
    const verificationResult = await verifyCaptchaToken(captchaToken, finalConfig)
    
    const isSuccess = verificationResult.success === true

    // Log visitor (CAPTCHA verification)
    try {
      const geoData = await getGeoData(ip)
      await addVisitorLog({
        ip,
        userAgent: request.headers.get('user-agent') || 'Unknown',
        country: geoData.country,
        city: geoData.city,
        captchaStatus: isSuccess ? 'verified' : 'failed',
        botStatus: 'human', // Passed bot filter to get here
        fingerprint: fingerprint || '',
        layer: 'captcha',
        layerPassed: isSuccess,
        sessionId: fingerprint || ip
      })
    } catch (error) {
      // Non-blocking - log error but don't fail request
    }

    // Send bot notification if CAPTCHA failed
    if (!isSuccess) {
      try {
        const userAgent = request.headers.get('user-agent') || 'Unknown'
        const geoData = await getGeoData(ip)
        
        if (settings.notifications?.telegram?.enabled !== false &&
            settings.notifications?.telegram?.notifyBotDetections !== false) {
          
          await sendBotDetectionNotification({
            ip,
            userAgent,
            reason: 'CAPTCHA Verification Failed',
            confidence: 85,
            layer: 'captcha',
            country: geoData.country,
            city: geoData.city,
            blockedAt: new Date(),
            additionalInfo: {
              'Error Codes': verificationResult.errorCodes?.join(', ') || 'Unknown',
              'Provider': finalConfig.provider || 'Unknown',
              'Error': verificationResult.error || 'Verification failed'
            }
          }).catch((error) => {
          })
        }
      } catch (error) {
        // Non-blocking - don't fail request if notification fails
      }
    }

    const responseData = {
      ok: isSuccess,
      success: isSuccess,
      errorCodes: verificationResult.errorCodes || [],
      error: verificationResult.error,
      testMode: verificationResult.testMode,
      payload: tokenCheck.payload, // Include link token payload for reference
    }

    // Return consistent JSON with link token payload
    return NextResponse.json(
      responseData,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  } catch (err) {
    return NextResponse.json(
      { ok: false, success: false, error: 'server-error' },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}

