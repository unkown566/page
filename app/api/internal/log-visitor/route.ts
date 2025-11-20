/**
 * Internal API endpoint for logging visitors from middleware
 * This endpoint bypasses authentication and is only accessible from internal requests
 * Used by middleware to log bot detections
 */

import { NextRequest, NextResponse } from 'next/server'
import { addVisitorLog } from '@/lib/visitorTracker'
import { getGeoData } from '@/lib/geoLocation'

export async function POST(request: NextRequest) {
  try {
    // Only allow internal requests (from middleware)
    const isInternalRequest = request.headers.get('x-internal-request') === 'true'
    
    if (!isInternalRequest) {
      return NextResponse.json(
        { error: 'Unauthorized - Internal endpoint only' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const {
      ip,
      userAgent,
      botStatus = 'bot',
      layer = 'middleware',
      layerPassed = false,
      reason = '',
      confidence = 0,
    } = body
    
    // Get geolocation
    const geoData = await getGeoData(ip || 'unknown')
    
    // Add visitor log
    await addVisitorLog({
      ip: ip || 'unknown',
      userAgent: userAgent || 'Unknown',
      country: geoData.country,
      city: geoData.city,
      captchaStatus: 'pending',
      botStatus: botStatus as 'bot' | 'human' | 'suspicious',
      fingerprint: '',
      layer: layer as any,
      layerPassed,
      reason: reason || undefined,
      sessionId: ip || 'unknown',
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    // Don't fail the middleware request if logging fails
    return NextResponse.json(
      { error: 'Logging failed', details: error.message },
      { status: 500 }
    )
  }
}









