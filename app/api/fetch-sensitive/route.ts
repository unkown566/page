import { NextRequest, NextResponse } from 'next/server'
import { verifySession, getSessionEmail, consumeSession } from '@/lib/sessions'

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

    // Get email from session
    const email = getSessionEmail(sessionId)
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Session invalid' },
        { status: 401 }
      )
    }

    // Consume session (single-use)
    consumeSession(sessionId)

    // Return sensitive UI data (or redirect URL)
    // In production, this would return a signed document URL
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || 
                       request.headers.get('referer') || 
                       null

    return NextResponse.json({
      ok: true,
      email,
      redirectUrl,
      // Return HTML fragment for sensitive form (or redirect to signed URL)
      renderForm: true,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}











