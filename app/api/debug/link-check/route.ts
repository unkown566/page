import { NextRequest, NextResponse } from 'next/server'
import { getLink } from '@/lib/linkDatabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    const link = await getLink(token)
    
    if (!link) {
      return NextResponse.json({
        token,
        found: false,
        error: 'Link not found'
      })
    }

    return NextResponse.json({
      token,
      found: true,
      id: link.id,
      type: link.type,
      status: link.status,
      email: link.email,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      now: Date.now(),
      isExpired: link.expiresAt < Date.now(),
      daysUntilExpiry: ((link.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(2),
      allowedEmails: link.allowedEmails
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

