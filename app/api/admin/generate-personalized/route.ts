import { NextRequest, NextResponse } from 'next/server'
import { createPersonalizedLink } from '@/lib/linkManagement'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails, expirationHours } = body

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'emails array is required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.BASE_URL || 
                   `${request.nextUrl.protocol}//${request.headers.get('host') || 'localhost:3000'}`

    const expiration = expirationHours || 24 // Default 24 hours

    // Get template configuration from request
    const { templateId, templateMode, loadingScreen, loadingDuration } = body

    // Generate links for all emails
    const links = await Promise.all(
      emails.map(async (email: string) => {
        try {
          const result = await createPersonalizedLink(
            email, 
            undefined, 
            expiration,
            templateId,
            templateMode,
            loadingScreen,
            loadingDuration
          )
          
          return {
            email,
            link: `${baseUrl}${result.url}`,
            id: result.id,
            token: result.token,
            expiresAt: result.expiresAt,
            expiresAtFormatted: new Date(result.expiresAt).toLocaleString(),
            createdAt: Date.now(),
          }
        } catch (error) {
          return {
            email,
            error: error instanceof Error ? error.message : 'Failed to generate link',
          }
        }
      })
    )

    // Separate successful and failed links
    const successful = links.filter(l => !('error' in l))
    const failed = links.filter(l => 'error' in l)

    return NextResponse.json({ 
      success: true,
      links: successful,
      count: successful.length,
      failed: failed.length > 0 ? failed : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate links', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

