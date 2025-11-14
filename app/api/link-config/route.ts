import { NextRequest, NextResponse } from 'next/server'
import { getGenericLinkConfig } from '@/lib/linkManagement'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const config = await getGenericLinkConfig(token)

    if (!config) {
      return NextResponse.json({ valid: false }, { status: 404 })
    }

    // Check if expired
    if (Date.now() > config.expiresAt) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    // Check usage limit (for generic links, check captured count)
    if (config.type === 'generic' && config.capturedCount !== null) {
      const totalEmails = config.totalEmails || 0
      if (totalEmails > 0 && config.capturedCount >= totalEmails) {
        return NextResponse.json({ valid: false, reason: 'max_uses' })
      }
    }

    // For personalized links, check if already used
    if (config.type === 'personalized' && config.used) {
      return NextResponse.json({ valid: false, reason: 'max_uses' })
    }

    return NextResponse.json({
      valid: true,
      expiresAt: config.expiresAt,
      usedCount: config.type === 'generic' ? (config.capturedCount || 0) : (config.used ? 1 : 0),
    })
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

