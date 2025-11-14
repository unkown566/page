/**
 * Analytics Events Endpoint
 * Records security events and anomalies
 * POST /api/analytics/events
 */

import { NextRequest, NextResponse } from 'next/server'
import { banIP } from '@/lib/ipBlocklist'
import { logSecurityEvent } from '@/lib/securityMonitoring'
import { sendBotDetectionNotification } from '@/lib/botNotifications'
import { loadSettings } from '@/lib/adminSettings'
import { getGeoData } from '@/lib/geoLocation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trap, timestamp } = body

    // Get IP address
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Log the honeypot trigger

    // Auto-ban the IP (permanent ban for honeypot triggers)
    banIP(ip, `Honeypot triggered: ${trap}`, true)

    // Log security event
    await logSecurityEvent({
      type: 'honeypot_triggered',
      ip,
      fingerprint: 'unknown',
      severity: 'high',
      details: {
        trap,
        timestamp,
      },
      userAgent,
    })

    // Send bot notification
    try {
      const settings = await loadSettings()
      const geoData = await getGeoData(ip)
      
      if (settings.notifications?.telegram?.enabled !== false &&
          settings.notifications?.telegram?.notifyBotDetections !== false) {
        
        await sendBotDetectionNotification({
          ip,
          userAgent,
          reason: `Honeypot Trap Triggered: ${trap}`,
          confidence: 95,
          layer: 'honeypot',
          country: geoData.country,
          city: geoData.city,
          blockedAt: new Date(),
          additionalInfo: {
            'Trap': trap,
            'Detection': 'Invisible link clicked',
            'Action': 'IP permanently banned'
          }
        }).catch((error) => {
        })
      }
    } catch (error) {
    }

    return NextResponse.json({
      ok: true,
      message: 'Honeypot trigger logged and IP banned',
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process honeypot trigger',
      },
      { status: 500 }
    )
  }
}

