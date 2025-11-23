import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllCapturedEmails } from '@/lib/linkDatabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    // Get all captured emails (this function already uses correct column names)
    const captures = await getAllCapturedEmails()
    
    // Return notifications data
    return NextResponse.json({
      success: true,
      notifications: captures.map(capture => ({
        id: capture.id,
        email: capture.email,
        capturedAt: capture.capturedAt, // This is mapped from captured_at in mapRowToCapturedEmail
        provider: capture.provider,
        verified: capture.verified,
        attempts: capture.attempts,
      })),
      count: captures.length,
    })
  } catch (error: any) {
    console.error('[NOTIFICATIONS API] Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

