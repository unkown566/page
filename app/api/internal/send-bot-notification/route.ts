import { NextRequest, NextResponse } from 'next/server'
import { sendBotDetectionNotification, BotDetectionData } from '@/lib/botNotifications'

export const runtime = 'nodejs'  // Force Node.js runtime (not Edge)

export async function POST(request: NextRequest) {
  try {
    // Verify internal request
    if (request.headers.get('x-internal-request') !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const data: BotDetectionData = await request.json()
    
    // Parse blockedAt if it's a string
    if (typeof data.blockedAt === 'string') {
      data.blockedAt = new Date(data.blockedAt)
    }
    
    
    // Send notification
    await sendBotDetectionNotification(data)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}









