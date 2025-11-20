import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await getSettings()
    
    // Include networkRestrictions in response so middleware can read it
    const response = {
      success: true,
      settings: {
        ...settings,
        security: {
          ...settings.security,
          networkRestrictions: settings.security?.networkRestrictions || {
            allowVpn: true,
            allowProxy: true,
            allowDatacenter: true,
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




