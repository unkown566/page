import { NextRequest, NextResponse } from 'next/server'
// PHASE 7.4: Use SQLite instead of JSON
import { getLinkByToken } from '@/lib/linkDatabaseSql'
import { getEmailFromId } from '@/lib/linkManagement'
import { getTokenType } from '@/lib/tokens'

export const dynamic = 'force-dynamic'

/**
 * EMAIL FROM TOKEN API
 * Type A Link Support - Fetch email from database using token
 * 
 * GET /api/email-from-token?token=<token>
 * GET /api/email-from-token?id=<id> (legacy)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const id = searchParams.get('id')
    const identifier = searchParams.get('identifier') // Format A: short identifier
    
    // Priority 0: Try identifier first (Format A with short identifier)
    if (identifier) {
      const { getTokenFromIdentifier } = await import('@/lib/linkIdentifier')
      const resolved = await getTokenFromIdentifier(identifier)
      
      if (!resolved || !resolved.token || !resolved.linkId) {
        console.error('[EMAIL-FROM-TOKEN] Identifier not found:', identifier.substring(0, 10))
        return NextResponse.json(
          { email: null, error: 'Identifier not found' },
          { status: 404 }
        )
      }
      
      // 🔥 FIX: Fetch link using linkId (NOT token) because Format A stores token in link_identifiers, not links.link_token
      const { sql } = await import('@/lib/sql')
      const link = sql.get<{
        id: string
        type: string
        email: string | null
        link_token: string | null
        session_identifier: string | null
      }>(
        'SELECT id, type, email, link_token, session_identifier FROM links WHERE id = ?',
        [resolved.linkId]
      )
      
      if (!link) {
        console.error('[EMAIL-FROM-TOKEN] Link not found via link_id:', {
          identifier: identifier.substring(0, 10),
          linkId: resolved.linkId,
        })
        return NextResponse.redirect(new URL('/invalid-link', request.nextUrl.origin))
      }
      
      // CRITICAL: Generic Links (Type B) don't have single email
      if (link.type === 'generic') {
        return NextResponse.json(
          { 
            email: null, 
            error: 'Generic Links cannot use Format A. Use Format B (query mode) instead.',
            hint: 'Generic Links require email in URL: /?token=xxx&email=yyy'
          },
          { status: 400 }
        )
      }
      
      // PHASE 7.4: Type A email resolution - SQLite only
      // Priority 1: Try link.email (Personalized Links only)
      let email: string | null = link.email || null
      
      // Priority 2: If not in link, try SQLite email_id_mappings table by linkId
      if (!email && link.id) {
        const mappingRow = sql.get<{ email: string }>(
          'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
          [link.id]
        )
        if (mappingRow?.email) {
          email = mappingRow.email
        }
      }
      
      if (!email) {
        console.error('[EMAIL-FROM-TOKEN] Email not found for identifier:', {
          identifier: identifier.substring(0, 10),
          linkId: link.id,
          linkType: link.type,
        })
        return NextResponse.json(
          { email: null, error: 'Email not found for identifier' },
          { status: 404 }
        )
      }
      
      // DEBUG: Log successful resolution
      if (process.env.NODE_ENV === 'development') {
        console.log('[EMAIL-FROM-TOKEN] Format A resolved successfully:', {
          identifier: identifier.substring(0, 10),
          email: email.substring(0, 20),
          token: resolved.token.substring(0, 20) + '...',
          linkId: resolved.linkId.substring(0, 10),
        })
      }
      
      return NextResponse.json({
        email,
        token: resolved.token,
        identifier,
        success: true, // Explicit success flag
      })
    }
    
        // Priority 1: Try token first
        if (token) {
          // PHASE 7.4: Use SQLite instead of JSON
        const tokenType = getTokenType(token)

        if (tokenType !== 'formatA') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[EMAIL-FROM-TOKEN] Non-Format A token blocked:', {
              tokenPreview: token.substring(0, 12),
              tokenType,
            })
          }
          return NextResponse.redirect(new URL('/invalid-link', request.nextUrl.origin))
        }

        const link = await getLinkByToken(token)
      
      if (!link) {
        console.error('[EMAIL-FROM-TOKEN] Link not found:', token.substring(0, 20))
        return NextResponse.redirect(new URL('/invalid-link', request.nextUrl.origin))
      }
      
      // CRITICAL: Generic Links (Type B) don't have single email
      if (link.type === 'generic') {
        // PHASE 7.4: Get allowed emails count from SQLite
        const { sql } = await import('@/lib/sql')
        const allowedCount = sql.get<{ count: number }>(
          'SELECT COUNT(*) as count FROM email_allowlists WHERE link_id = ?',
          [link.id]
        )
        
        console.error('[EMAIL-FROM-TOKEN] Generic Link cannot use Type A format:', {
          token: token.substring(0, 20),
          type: link.type,
          hasEmail: !!link.email,
          allowedEmailsCount: allowedCount?.count || 0,
        })
        return NextResponse.json(
          { 
            email: null, 
            error: 'Generic Links cannot use Format A. Use Format B (query mode) instead.',
            hint: 'Generic Links require email in URL: /?token=xxx&email=yyy'
          },
          { status: 400 }
        )
      }
      
      // PHASE 7.4: Type A email resolution - SQLite only, no fallbacks
      // Priority 1: Try link.email (Personalized Links only)
      let email: string | null = link.email || null
      
      // Priority 2: If not in link, try SQLite email_id_mappings table by linkId
      if (!email && link.id) {
        const { sql } = await import('@/lib/sql')
        const mappingRow = sql.get<{ email: string }>(
          'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
          [link.id]
        )
        if (mappingRow?.email) {
          email = mappingRow.email
        }
      }
      
      // PHASE 7.4: No fallback logic - if email not found, return error
      if (!email) {
        console.error('[EMAIL-FROM-TOKEN] Email not found for token:', {
          token: token.substring(0, 20),
          linkId: link.id,
          linkType: link.type,
        })
        return NextResponse.json(
          { email: null, error: 'Email not found for token' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        email,
        token,
      })
    }
    
    // Priority 2: Try id (legacy email-id mapping)
    if (id) {
      const email = await getEmailFromId(id)
      
      if (!email) {
        return NextResponse.json(
          { email: null, error: 'Email not found for id' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        email,
        id,
      })
    }
    
    // No token or id provided
    return NextResponse.json(
      { email: null, error: 'Token or id required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[EMAIL-FROM-TOKEN] Error:', error)
    return NextResponse.json(
      { email: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

