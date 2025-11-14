import { NextRequest, NextResponse } from 'next/server'
import { verifySession, consumeSession } from '@/lib/sessions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session')

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Get IP and User-Agent
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Verify session
    const isValid = verifySession(sessionId, ip, userAgent)
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Get redirect URL from session or query
    const redirectUrl = searchParams.get('redirect') || 
                       process.env.DOCUMENT_BASE_URL || 
                       null

    if (!redirectUrl) {
      return NextResponse.json(
        { ok: false, error: 'No redirect URL configured' },
        { status: 400 }
      )
    }

    // Consume session (single-use)
    consumeSession(sessionId)

    // Perform server-side redirect (302)
    // Document URL never exposed to client
    return NextResponse.redirect(redirectUrl, {
      status: 302,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}






