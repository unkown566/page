import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { loadSettings, saveSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

/**
 * POST: Sync current admin settings to .env file
 * This endpoint loads current settings and writes them to .env
 */
export async function POST(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    console.log('[SYNC-ENV] 🔄 Syncing admin settings to .env file...')
    
    // Load current settings
    const currentSettings = await loadSettings()
    
    // Save settings (this will trigger writeSettingsToEnv)
    await saveSettings(currentSettings)
    
    console.log('[SYNC-ENV] ✅ Settings synced to .env file')
    
    return NextResponse.json({
      success: true,
      message: 'Settings synced to .env file successfully',
    })
  } catch (error: any) {
    console.error('[SYNC-ENV] ❌ Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync settings to .env',
        details: error.message,
      },
      { status: 500 }
    )
  }
}


