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

    // Check if expired (but can be bypassed by master toggle)
    if (Date.now() > config.expiresAt) {
      try {
        const { getSettings } = await import('@/lib/adminSettings')
        const settings = await getSettings()
        if (settings.linkManagement?.allowAllLinks) {
          console.log('[LINK CONFIG] ⚠️ Link expired but allowAllLinks is ON - allowing access')
          // Master toggle is ON - allow expired config
        } else {
          // Master toggle is OFF - reject expired link
          return NextResponse.json({ valid: false, reason: 'expired' })
        }
      } catch (error) {
        console.error('[LINK CONFIG] Error checking master toggle:', error)
        // If error, use default (don't allow expired)
        return NextResponse.json({ valid: false, reason: 'expired' })
      }
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

