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

    // PHASE 7.4: Check if expired (convert Unix timestamp to milliseconds)
    const expiresAtMs = config.expires_at * 1000
    if (Date.now() > expiresAtMs) {
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

    // PHASE 7.4: Check usage limit (for generic links, check captured count)
    // SQLite uses snake_case and stores boolean as 0/1
    if (config.type === 'generic' && config.captured_count !== null) {
      const totalEmails = config.total_emails || 0
      if (totalEmails > 0 && config.captured_count >= totalEmails) {
        return NextResponse.json({ valid: false, reason: 'max_uses' })
      }
    }

    // PHASE 7.4: For personalized links, check if already used (SQLite stores boolean as 0/1)
    if (config.type === 'personalized' && config.used === 1) {
      return NextResponse.json({ valid: false, reason: 'max_uses' })
    }

    return NextResponse.json({
      valid: true,
      expiresAt: expiresAtMs, // Return in milliseconds for compatibility
      usedCount: config.type === 'generic' ? (config.captured_count || 0) : (config.used === 1 ? 1 : 0),
    })
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

