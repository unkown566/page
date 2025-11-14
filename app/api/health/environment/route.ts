import { NextRequest, NextResponse } from 'next/server'
import { detectSandbox } from '@/lib/sandboxDetection'

export async function POST(request: NextRequest) {
  try {
    // Server-side detection
    const serverDetection = await detectSandbox(request)

    // Get client-side results
    const body = await request.json()
    const clientResults = body.clientResults
    const clientScore = body.clientScore || { score: 0, reasons: [] }

    // Combine server and client scores
    let finalScore = serverDetection.confidence
    let allReasons = [...serverDetection.reasons]

    if (clientScore && typeof clientScore === 'object' && 'score' in clientScore) {
      finalScore += clientScore.score as number
      if (Array.isArray(clientScore.reasons)) {
        allReasons = [...allReasons, ...(clientScore.reasons as string[])]
      }
    }

    // Cap at 100
    finalScore = Math.min(finalScore, 100)

    const isSandbox = finalScore >= 60

    return NextResponse.json({
      isSandbox,
      confidence: finalScore,
      reasons: allReasons,
      fingerprint: serverDetection.fingerprint,
      detectionMethods: serverDetection.detectionMethod,
    })
  } catch (error) {
    return NextResponse.json({
      isSandbox: false,
      confidence: 0,
      reasons: ['Detection error'],
      error: true,
    })
  }
}



