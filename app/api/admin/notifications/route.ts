import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllCapturedEmails } from '@/lib/linkDatabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    // Get all captured emails (this function uses captured_at column name)
    // If this fails, it means the database schema doesn't match - return empty array
    let captures
    try {
      captures = await getAllCapturedEmails()
    } catch (dbError: any) {
      // If database query fails (e.g., column doesn't exist), log and return empty
      console.error('[NOTIFICATIONS API] Database error (likely schema mismatch):', dbError.message || dbError)
      return NextResponse.json({
        success: true,
        notifications: [],
        count: 0,
        warning: 'Database schema mismatch - notifications temporarily unavailable',
      })
    }
    
    // Safely map captures to notifications format
    const notifications = captures.map(capture => ({
      id: capture.id || '',
      email: capture.email || '',
      capturedAt: capture.capturedAt || Date.now(), // Fallback to current time if missing
      provider: capture.provider || 'Unknown',
      verified: Boolean(capture.verified),
      attempts: capture.attempts || 0,
    }))
    
    // Return notifications data
    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    })
  } catch (error: any) {
    // Catch any unexpected errors and return gracefully
    console.error('[NOTIFICATIONS API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        details: error.message || 'Unknown error',
        notifications: [], // Return empty array instead of crashing
        count: 0,
      },
      { status: 500 }
    )
  }
}

