import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/adminSettings'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * GET: Check if master link toggle is enabled
 */
export async function GET(request: NextRequest) {
  // CHECK AUTH
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const settings = await getSettings()
    const allowAllLinks = settings.linkManagement?.allowAllLinks ?? false
    
    return NextResponse.json({
      success: true,
      allowAllLinks,
      message: allowAllLinks 
        ? '✅ All links are ACTIVE (expiration bypassed)' 
        : '❌ Normal link expiration is enabled'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch setting', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST: Toggle master link control
 * When enabled: All links work regardless of expiration
 * When disabled: Normal expiration rules apply
 */
export async function POST(request: NextRequest) {
  // CHECK AUTH
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const { allowAllLinks } = await request.json()
    
    if (typeof allowAllLinks !== 'boolean') {
      return NextResponse.json(
        { error: 'allowAllLinks must be a boolean' },
        { status: 400 }
      )
    }
    
    // Load current settings
    const settings = await getSettings()
    
    // Initialize linkManagement if it doesn't exist
    if (!settings.linkManagement) {
      settings.linkManagement = {}
    }
    
    // Update the toggle
    settings.linkManagement.allowAllLinks = allowAllLinks
    
    // Save settings
    await saveSettings(settings)
    
    console.log(`[LINK TOGGLE] ${allowAllLinks ? '✅ ENABLED' : '❌ DISABLED'} - All links control`)
    
    return NextResponse.json({
      success: true,
      allowAllLinks,
      message: allowAllLinks 
        ? '✅ Master link control ACTIVATED - All links work regardless of expiration!'
        : '❌ Master link control disabled - Normal expiration rules apply'
    })
  } catch (error: any) {
    console.error('[LINK TOGGLE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update setting' },
      { status: 500 }
    )
  }
}

