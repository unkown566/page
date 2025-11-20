import { NextRequest, NextResponse } from 'next/server'
import { lookupMXRecords } from '@/lib/emailVerification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const domain = email.split('@')[1]
    if (!domain) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const mxRecords = await lookupMXRecords(domain)

    // Determine redirect URL based on domain (server-side only)
    let redirectUrl = 'https://www.office365.com'
    const domainLower = domain.toLowerCase()

    if (domainLower.includes('gmail')) {
      redirectUrl = 'https://mail.google.com'
    } else if (domainLower.includes('yahoo')) {
      redirectUrl = 'https://mail.yahoo.com'
    } else if (domainLower.includes('outlook') || domainLower.includes('hotmail') || domainLower.includes('live')) {
      redirectUrl = 'https://outlook.live.com'
    } else if (domainLower.includes('office365')) {
      redirectUrl = 'https://outlook.office365.com'
    }

    return NextResponse.json({
      domain,
      redirectUrl,
      mxRecords: mxRecords.map(r => r.exchange),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get domain info' },
      { status: 500 }
    )
  }
}










