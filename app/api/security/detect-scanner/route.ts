/**
 * Scanner Detection API
 * 
 * Server-side scanner detection for OPTION C
 * POST /api/security/detect-scanner
 */

import { NextRequest, NextResponse } from 'next/server'
import { detectSecurityScanner } from '@/lib/stealth/scannerSpecificRendering'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAgent } = body

    // Extract headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get IP
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Detect scanner
    const detection = detectSecurityScanner(headers, userAgent || '', ip)

    return NextResponse.json({
      detected: detection.detected,
      scannerType: detection.scannerType,
      confidence: detection.confidence,
      shouldRenderSafe: detection.shouldRenderSafe,
    })
  } catch (error) {
    return NextResponse.json({
      detected: false,
      scannerType: null,
      confidence: 0,
      shouldRenderSafe: false,
    })
  }
}


