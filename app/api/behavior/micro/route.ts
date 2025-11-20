/**
 * MICRO HUMAN VERIFICATION API - Phase 5.11
 * 
 * Endpoint: /api/behavior/micro
 * 
 * Purpose: Receive and process micro-interaction signals
 * 
 * SAFETY: Never blocks, only adds positive scores
 */

import { NextRequest, NextResponse } from 'next/server'
import { processMicroHumanSignals, type MicroHumanSignals } from '@/lib/behavioral/microHumanModel'
import { logBehaviorEvent } from '@/lib/securityMonitoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract signals from request
    const signals: MicroHumanSignals = {
      jitterVariance: body.jitterVariance,
      scrollCurveVar: body.scrollCurveVar,
      pointerCurvature: body.pointerCurvature,
      hesitationTime: body.hesitationTime,
      hoverDurations: body.hoverDurations,
      clickDelay: body.clickDelay,
      scrollPauses: body.scrollPauses,
      mouseAcceleration: body.mouseAcceleration,
    }
    
    // Process signals and calculate score
    const microScore = processMicroHumanSignals(signals)
    
    // Get IP and User-Agent for logging
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Log behavioral event (positive signals only)
    if (microScore.score > 0) {
      await logBehaviorEvent(
        ip,
        userAgent,
        'micro_human_signal',
        microScore.score,
        {
          signals: microScore.signals,
          confidence: microScore.confidence,
          reasons: microScore.reasons,
        }
      ).catch(() => {
        // Silent fail - logging is optional
      })
    }
    
    // Return micro human score
    return NextResponse.json({
      success: true,
      microHumanScore: microScore.score,
      confidence: microScore.confidence,
      signals: microScore.signals,
    })
    
  } catch (error) {
    // Fail silently - micro signals are optional
    return NextResponse.json({
      success: false,
      microHumanScore: 0,
    })
  }
}





