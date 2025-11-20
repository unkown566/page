import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateCSRFSecret, generateCSRFToken } from '@/lib/csrf'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let csrfSecret = cookieStore.get('csrf-secret')?.value
    
    // Generate new secret if not exists
    if (!csrfSecret) {
      csrfSecret = generateCSRFSecret()
    }
    
    // Generate token
    const token = generateCSRFToken(csrfSecret)
    
    if (!token) {
      console.error('[CSRF] Failed to generate token')
      return NextResponse.json(
        { error: 'Failed to generate CSRF token', token: null },
        { status: 500 }
      )
    }
    
    const response = NextResponse.json({ 
      token,
      success: true 
    })
    
    // Set CSRF secret in cookie (httpOnly, secure in production)
    response.cookies.set('csrf-secret', csrfSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return response
  } catch (error: any) {
    console.error('[CSRF] Error generating token:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate CSRF token',
        details: error?.message || 'Unknown error',
        token: null 
      },
      { status: 500 }
    )
  }
}










