import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    // Get admin password from settings
    const settings = await getSettings()
    const adminPassword = process.env.ADMIN_PASSWORD || 'pass12345'

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

      const response = NextResponse.json({ success: true })
      // Set cookie with password AND session data for expiry checking
      response.cookies.set('admin_auth', adminPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'https',
        sameSite: 'lax', // Changed from strict to lax to allow redirect flows
        maxAge: 30 * 60 // 30 minutes
      })
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'https',
        sameSite: 'lax', // Changed from strict to lax to allow redirect flows
        maxAge: 30 * 60 // 30 minutes
      })

      return response
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

