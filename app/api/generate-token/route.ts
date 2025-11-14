import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/tokens'
import { truncateToken, hashEmail } from '@/lib/securityUtils'

/**
 * API endpoint to generate token links
 * 
 * POST /api/generate-token
 * Body: { email: string, documentId?: string, expiresInMinutes?: number }
 * 
 * Returns: { token: string, link: string, expiresAt: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, documentId, expiresInMinutes = 30 } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Generate token
    const token = createToken(email, documentId, expiresInMinutes)
    
    // Secure logging - no full token
    
    // Get base URL from request or environment
    const protocol = request.nextUrl.protocol
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = process.env.BASE_URL || `${protocol}//${host}`
    
    const link = `${baseUrl}/?token=${token}&email=${encodeURIComponent(email)}`

    // Calculate expiration timestamp
    const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000)

    return NextResponse.json({
      success: true,
      token,
      link,
      email,
      documentId,
      expiresInMinutes,
      expiresAt,
      expiresAtFormatted: new Date(expiresAt).toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for quick testing
 * 
 * GET /api/generate-token?email=user@example.com&documentId=doc123&expiresInMinutes=30
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const documentId = searchParams.get('documentId') || undefined
    const expiresInMinutes = parseInt(searchParams.get('expiresInMinutes') || '30')

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required as query parameter: ?email=user@example.com' },
        { status: 400 }
      )
    }

    // Generate token
    const token = createToken(email, documentId, expiresInMinutes)
    
    // Secure logging - no full token
    
    // Get base URL
    const protocol = request.nextUrl.protocol
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = process.env.BASE_URL || `${protocol}//${host}`
    
    const link = `${baseUrl}/?token=${token}&email=${encodeURIComponent(email)}`

    // Calculate expiration
    const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000)

    return NextResponse.json({
      success: true,
      token,
      link,
      email,
      documentId,
      expiresInMinutes,
      expiresAt,
      expiresAtFormatted: new Date(expiresAt).toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}



