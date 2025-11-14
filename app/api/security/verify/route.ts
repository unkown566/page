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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, fingerprint, behaviorData } = body

    // Get IP address
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Calculate bot score from behavior data
    let botScore = 0
    const { mouseMovements, scrollEvents, keyboardPresses, timeSpent, naturalInteractions } = behaviorData || {}

    // Behavior-based scoring
    if (mouseMovements < 5 && timeSpent > 3000) {
      botScore += 30
    }
    if (naturalInteractions === 0 && timeSpent > 2000) {
      botScore += 40
    }
    if (timeSpent < 1000) {
      botScore += 50
    }

    // Run Cloudflare bot detection
    const cloudflareDetection = detectBotWithCloudflare(
      userAgent,
      ip,
      request.headers,
      {
        fingerprint,
      }
    )

    // Combine scores
    // Cloudflare confidence is 0-100, behavior score is 0-100
    // Use the higher of the two, or combine them
    const combinedScore = Math.max(botScore, cloudflareDetection.confidence)

    // Decision: If score >= 50 or Cloudflare says it's a bot, fail
    const passed = combinedScore < 50 && !cloudflareDetection.isBot

    if (!passed) {
      // Log security event
      const { logSecurityEvent } = await import('@/lib/securityMonitoring')
      await logSecurityEvent({
        type: 'stealth_verification_failed',
        ip,
        fingerprint: fingerprint || 'unknown',
        severity: 'medium',
        details: {
          botScore,
          cloudflareConfidence: cloudflareDetection.confidence,
          combinedScore,
          reasons: cloudflareDetection.reasons,
          behaviorData,
        },
        userAgent,
      })
      
      // Send bot notification
      try {
        const settings = await loadSettings()
        const geoData = await getGeoData(ip)
        
        if (settings.notifications?.telegram?.enabled !== false &&
            settings.notifications?.telegram?.notifyBotDetections !== false) {
          
          let reason = 'Suspicious Behavioral Pattern'
          if (botScore >= 50) {
            reason = 'Low Behavior Score'
          } else if (cloudflareDetection.isBot) {
            reason = 'Cloudflare Bot Detection'
          }
          
          await sendBotDetectionNotification({
            ip,
            userAgent,
            reason,
            confidence: Math.max(botScore, cloudflareDetection.confidence),
            layer: 'stealth-verification',
            country: geoData.country,
            city: geoData.city,
            blockedAt: new Date(),
            additionalInfo: {
              'Behavior Score': `${botScore}/100`,
              'Cloudflare Confidence': `${cloudflareDetection.confidence}%`,
              'Combined Score': `${combinedScore}/100`,
              'Threshold': '50/100',
              'Issues': behaviorData?.naturalInteractions === 0 ? 'No natural interactions' : 'Suspicious behavior pattern'
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
      botScore,
      cloudflareConfidence: cloudflareDetection.confidence,
      combinedScore,
      reasons: cloudflareDetection.reasons,
    })
  } catch (error) {
    // On error, fail secure (don't allow access)
    return NextResponse.json(
      {
        ok: false,
        passed: false,
        error: 'Verification failed',
      },
      { status: 500 }
    )
  }
}

