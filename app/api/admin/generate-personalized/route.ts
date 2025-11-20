import { NextRequest, NextResponse } from 'next/server'
import { encryptPayloadV3 } from '@/lib/tokenEngine'
import { createLinkRecord, saveEmailMapping } from '@/lib/linkDatabaseSql'
import { buildLinkWithEmail } from '@/lib/linkUrlBuilderWithEmail'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails, expirationHours, once, fpBinding, link_format } = body
    
    // Validate and set link_format (default to 'C' if not provided or invalid)
    const linkFormat: 'A' | 'B' | 'C' = (link_format && ['A', 'B', 'C'].includes(link_format)) 
      ? link_format as 'A' | 'B' | 'C'
      : 'C'

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
    const expiresAt = Math.floor(Date.now() / 1000) + (expiration * 60 * 60) // Unix timestamp in seconds

    // Get template configuration from request
    const { templateId, templateMode, loadingScreen, loadingDuration } = body

    // Get IP and User-Agent for device binding
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // PRIORITY ZERO FIX: Validate emails are not blank
    const validEmails = emails.filter((email: string) => email && email.trim() && email.includes('@'))
    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid email is required' },
        { status: 400 }
      )
    }

    // Generate links for all emails using v3 token engine
    const links = await Promise.all(
      validEmails.map(async (email: string) => {
        try {
          const linkId = randomUUID()
          const normalizedEmail = email.toLowerCase().trim()

          // PRIORITY ZERO FIX: Reject if email is blank
          if (!normalizedEmail || normalizedEmail === '') {
            throw new Error('Email is required')
          }

          // Create v3 token
          const token = await encryptPayloadV3(
            {
              linkId,
              email: normalizedEmail,
              type: 'personalized',
              expiresAt,
              once: once ?? false, // Default to false (multi-use)
            },
            {
              ip: fpBinding ? ip : undefined,
              userAgent: fpBinding ? userAgent : undefined,
              fpBinding: fpBinding ?? false,
            }
          )

          // Save email mapping for personalized links (needed for format C)
          const mappingId = randomUUID()
          await saveEmailMapping(mappingId, normalizedEmail, linkId)

          // Create link record in database
          const link = await createLinkRecord({
            type: 'personalized',
            session_identifier: token,
            link_token: token, // Legacy alias
            name: `Personal_${normalizedEmail.split('@')[0]}`,
            email: normalizedEmail,
            template_id: templateId || null,
            template_mode: templateMode || null,
            language: null,
            loading_screen: loadingScreen || null,
            loading_duration: loadingDuration || null,
            expires_at: expiresAt,
            link_format: linkFormat,
          })

          // PRIORITY ZERO FIX: Build proper link with email
          // Type A: /api/secure-redirect?token={token}&email={email}
          // Type B: /?token={token}&sid={session}&email={email}
          // Type C: /?sid={session}
          let finalUrl: string
          if (linkFormat === 'A') {
            // Type A: Use secure-redirect endpoint
            finalUrl = buildLinkWithEmail({
              baseUrl,
              type: 'A',
              token,
              email: normalizedEmail,
            })
          } else if (linkFormat === 'B') {
            // Type B: Include token, sid, and email
            finalUrl = buildLinkWithEmail({
              baseUrl,
              type: 'B',
              token,
              email: normalizedEmail,
              sid: null, // Will be generated
            })
          } else {
            // Type C: Only sid (user enters email)
            finalUrl = buildLinkWithEmail({
              baseUrl,
              type: 'C',
              token,
              email: null, // User enters email
              sid: null, // Will be generated
            })
          }

          return {
            email: normalizedEmail,
            link: finalUrl,
            id: linkId,
            token: token,
            mappingId: linkFormat === 'C' ? mappingId : undefined,
            format: linkFormat,
            expiresAt: expiresAt * 1000, // Convert to milliseconds for response
            expiresAtFormatted: new Date(expiresAt * 1000).toISOString(),
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

