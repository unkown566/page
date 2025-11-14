import { NextRequest, NextResponse } from 'next/server'
import { hasCompletedLogin } from '@/lib/fingerprintStorage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fingerprint } = body

    if (!email || !fingerprint) {
      return NextResponse.json(
        { hasCompleted: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get IP from request headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'Unknown'

    // Check if this fingerprint has already completed login
    const hasCompleted = await hasCompletedLogin(email, fingerprint, ip)

    return NextResponse.json({
      hasCompleted,
      email,
    })
  } catch {
    return NextResponse.json(
      { hasCompleted: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
