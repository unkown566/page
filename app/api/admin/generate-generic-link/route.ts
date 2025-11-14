import { NextRequest, NextResponse } from 'next/server'
import { parseEmailList } from '@/lib/emailListParser'
import { createGenericLink } from '@/lib/linkManagement'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const expirationDaysStr = formData.get('expirationDays') as string
    const file = formData.get('emailList') as File

    // Validate required fields
    if (!name || !expirationDaysStr || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: name, expirationDays, emailList' },
        { status: 400 }
      )
    }

    const expirationDays = parseInt(expirationDaysStr, 10)

    if (isNaN(expirationDays) || expirationDays < 1 || expirationDays > 365) {
      return NextResponse.json(
        { error: 'expirationDays must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Parse email list from uploaded file
    let allowedEmails: string[]
    try {
      allowedEmails = await parseEmailList(file)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to parse email list: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    if (allowedEmails.length === 0) {
      return NextResponse.json(
        { error: 'No valid emails found in uploaded file' },
        { status: 400 }
      )
    }

    // Create generic link
    const result = await createGenericLink(name, allowedEmails, expirationDays)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.BASE_URL || 
                   `${request.nextUrl.protocol}//${request.headers.get('host') || 'localhost:3000'}`

    return NextResponse.json({
      success: true,
      name,
      url: result.url,
      fullUrl: `${baseUrl}${result.url}`,
      token: result.token,
      totalEmails: result.totalEmails,
      expiresAt: result.expiresAt,
      expiresAtFormatted: new Date(result.expiresAt).toLocaleString(),
      preview: {
        first5: allowedEmails.slice(0, 5),
        total: allowedEmails.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}




