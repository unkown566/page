import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await getSettings()
    
    // Include all settings middleware needs (networkRestrictions, notifications, etc.)
    const response = {
      success: true,
      settings: {
        ...settings,
        security: {
          ...settings.security,
          networkRestrictions: settings.security?.networkRestrictions || {
            allowVpn: process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true',
            allowProxy: process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true',
            allowDatacenter: process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true',
          },
        },
        notifications: settings.notifications || {
          telegram: {
            enabled: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && process.env.DISABLE_BOT_NOTIFICATIONS !== 'true',
            botToken: process.env.TELEGRAM_BOT_TOKEN || '',
            chatId: process.env.TELEGRAM_CHAT_ID || '',
          },
        },
      },
      fetchedAt: new Date().toISOString(),
      version: Date.now(), // Cache busting - changes every time
    }
    
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load settings',
      settings: null,
    }, { status: 500 })
  }
}




