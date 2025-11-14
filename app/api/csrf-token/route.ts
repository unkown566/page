import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateCSRFSecret, generateCSRFToken } from '@/lib/csrf'

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
    
    const response = NextResponse.json({ token })
    
    // Set CSRF secret in cookie (httpOnly, secure in production)
    response.cookies.set('csrf-secret', csrfSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}




