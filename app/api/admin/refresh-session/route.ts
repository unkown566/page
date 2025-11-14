import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin_auth')?.value
    const sessionCookie = cookieStore.get('admin_session')?.value
    const adminPassword = process.env.ADMIN_PASSWORD
    
    // Check if authenticated
    if (!authCookie || !sessionCookie || !adminPassword || authCookie !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Check session validity and extend
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())
      const now = Date.now()
      
      // Check if expired
      if (now > sessionData.expiry) {
        return NextResponse.json(
          { success: false, error: 'Session expired' },
          { status: 401 }
        )
      }
      
      // Extend session by 30 minutes
      sessionData.lastActivity = now
      sessionData.expiry = now + (30 * 60 * 1000)
      const newSessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
      
      const response = NextResponse.json({ success: true, expiresIn: 30 * 60 })
      
      response.cookies.set('admin_session', newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60
      })
      response.cookies.set('admin_auth', adminPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60
      })
      
      return response
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Refresh failed' },
      { status: 500 }
    )
  }
}

