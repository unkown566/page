/**
 * CAPTCHA SESSION API - PATCH 1
 * 
 * Purpose: Server-side CAPTCHA session management
 * Prevents humans from re-seeing CAPTCHA after solving it once
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { randomUUID } from 'crypto'

/**
 * POST /api/captcha/session
 * Creates a new CAPTCHA session after successful verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { verified } = body
    
    if (!verified) {
      return NextResponse.json(
        { error: 'Verification required' },
        { status: 400 }
      )
    }
    
    // Get IP and User-Agent
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Generate session ID
    const sessionId = randomUUID()
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + 3600 // 1 hour expiration
    
    // Store session in database
    sql.run(
      `INSERT INTO captcha_sessions (sessionId, ip, userAgent, verifiedAt, expiresAt)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, ip, userAgent, now, expiresAt]
    )
    
    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      sessionId,
    })
    
    response.cookies.set('captcha_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    })
    
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/captcha/session
 * Checks if CAPTCHA session is valid
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('captcha_session')?.value
    
    if (!sessionId) {
      return NextResponse.json({
        verified: false,
      })
    }
    
    // Get IP and User-Agent for validation
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Check session in database
    const session = sql.get<{
      sessionId: string
      ip: string
      userAgent: string
      verifiedAt: number
      expiresAt: number
    }>(
      `SELECT * FROM captcha_sessions
       WHERE sessionId = ? AND ip = ? AND userAgent = ? AND expiresAt > ?`,
      [sessionId, ip, userAgent, Math.floor(Date.now() / 1000)]
    )
    
    if (session) {
      return NextResponse.json({
        verified: true,
        sessionId: session.sessionId,
      })
    }
    
    return NextResponse.json({
      verified: false,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






