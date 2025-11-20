// API endpoint to manually update IP blocklist from external sources
import { NextRequest, NextResponse } from 'next/server'
import { updateIPBlocklist } from '@/lib/ipBlocklistUpdater'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check
    const authKey = request.headers.get('x-api-key')
    const expectedKey = process.env.BLOCKLIST_UPDATE_API_KEY
    
    if (expectedKey && authKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Update blocklist
    const updatedIPs = await updateIPBlocklist()
    
    return NextResponse.json({
      success: true,
      count: updatedIPs.length,
      timestamp: Date.now(),
      message: `Updated ${updatedIPs.length} IP addresses`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update blocklist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Same as GET, but allows body for future extensions
  return GET(request)
}











