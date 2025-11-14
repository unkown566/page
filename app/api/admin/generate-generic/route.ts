import { NextRequest, NextResponse } from 'next/server'
import { parseEmailList } from '@/lib/emailListParser'
import { createGenericLink } from '@/lib/linkManagement'

/**
 * Legacy endpoint - Use /api/admin/generate-generic-link instead
 * This endpoint is kept for backward compatibility but now requires email list
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get email list from form data first
    let formData: FormData | null = null
    try {
      formData = await request.formData()
    } catch {
      // Not form data, try JSON
    }

    let name: string
    let allowedEmails: string[] = []
    let expirationDays = 7

    if (formData) {
      // Form data (new format with file upload)
      name = formData.get('name') as string
      const expirationDaysStr = formData.get('expirationDays') as string
      const file = formData.get('emailList') as File

      if (!name || !expirationDaysStr || !file) {
        return NextResponse.json(
          { error: 'Missing required fields: name, expirationDays, emailList. Use /api/admin/generate-generic-link instead.' },
          { status: 400 }
        )
      }

      expirationDays = parseInt(expirationDaysStr, 10)
      allowedEmails = await parseEmailList(file)
    } else {
      // JSON body (legacy format - now requires emails array)
      const body = await request.json()
      const { name: bodyName, emails, expirationDays: bodyExpirationDays } = body

      if (!bodyName || !emails || !Array.isArray(emails)) {
        return NextResponse.json(
          { error: 'Missing required fields: name, emails (array). Use /api/admin/generate-generic-link with file upload instead.' },
          { status: 400 }
        )
      }

      name = bodyName
      allowedEmails = emails.map((e: string) => e.toLowerCase())
      expirationDays = bodyExpirationDays || 7
    }

    if (allowedEmails.length === 0) {
      return NextResponse.json(
        { error: 'No emails provided' },
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
      link: `${baseUrl}${result.url}`,
      fullUrl: `${baseUrl}${result.url}`,
      token: result.token,
      totalEmails: result.totalEmails,
      expiresAt: result.expiresAt,
      expiresAtFormatted: new Date(result.expiresAt).toLocaleString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

