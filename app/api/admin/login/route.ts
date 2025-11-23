import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    // Get admin password from settings
    const settings = await getSettings()
    const adminPassword = process.env.ADMIN_PASSWORD || 'pass12345'

    console.log('[LOGIN] Attempting login, password length:', password.length)
    console.log('[LOGIN] Admin password set:', !!adminPassword)

    // Simple password check (can be enhanced with hashing)
    if (password === adminPassword) {
      // Create session with 30 minute expiry
      const sessionData = {
        authenticated: true,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        expiry: Date.now() + (30 * 60 * 1000) // 30 minutes
      }

      const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')

      // Check if we're behind a proxy (NGINX) and if HTTPS is being used
      const isHttps = request.headers.get('x-forwarded-proto') === 'https' || 
                      request.url.startsWith('https://')
      const isProduction = process.env.NODE_ENV === 'production'
      
      // Only use secure flag if actually using HTTPS
      const useSecure = isHttps && isProduction

      console.log('[LOGIN] Setting cookies - HTTPS:', isHttps, 'Secure flag:', useSecure)

      const response = NextResponse.json({ success: true })
      
      // Set cookie with password AND session data for expiry checking
      response.cookies.set('admin_auth', adminPassword, {
        httpOnly: true,
        secure: useSecure,
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutes
        path: '/'
      })
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: useSecure,
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutes
        path: '/'
      })

      console.log('[LOGIN] ✅ Login successful, cookies set')
      return response
    }

    console.log('[LOGIN] ❌ Invalid password')
    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error: any) {
    console.error('[LOGIN] Error:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    )
  }
}

