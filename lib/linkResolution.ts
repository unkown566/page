/**
 * LINK RESOLUTION - Multi-Mode Link Engine
 * 
 * Resolves token, email, and mappingId from various URL formats
 */

// PHASE 7.4: Use SQLite instead of JSON
import { getLinkByToken } from './linkDatabaseSql'
import { getEmailFromId } from './linkManagement'
import { getEmailByMappingId } from './linkDatabaseSql'
import { extractTokenFromFormattedUrl } from './linkUrlBuilder'
import { extractTokenFromUrl, extractEmailFromUrl } from './urlExtraction'
import { normalizeToken } from './tokenEngine'
import type { LinkFormat, LinkResolutionResult } from './linkManagerTypes'

/**
 * Extract mappingId from URL path (Type C format: /r/<mappingId>/<token>)
 */
function extractMappingIdFromPath(pathname: string): string | null {
  // Find "/r/" in pathname
  const rIndex = pathname.indexOf('/r/')
  if (rIndex === -1) {
    return null
  }
  
  // Extract everything after "/r/"
  const afterR = pathname.substring(rIndex + 3) // +3 to skip "/r/"
  const pathParts = afterR.split('/').filter(p => p) // Remove empty parts
  
  if (pathParts.length === 2) {
    // Format C: /r/<mappingId>/<token>
    return pathParts[0] // First part is mappingId
  }
  
  return null
}

/**
 * Resolve link parameters from request URL
 * 
 * PHASE 7.3: STRICT FORMAT DETECTION (NO AUTO-INFER)
 * 
 * Rules:
 * - Type A: /r/<token> - detected ONLY by pathname, NOT by query
 * - Type B: /?token=...&email=... - detected ONLY when token AND email exist
 * - Generic: /?token=... (no email) - detected when token exists, no email, link.type='generic'
 * - Type C: /r/<mappingId>/<token> - detected by path structure
 */
export async function resolveLinkFromRequest(
  requestUrl: string,
  searchParams: URLSearchParams,
  pathname: string
): Promise<LinkResolutionResult | null> {
  try {
    const urlObj = new URL(requestUrl)
    
    // PHASE 7.3 FIX: STRICT FORMAT DETECTION - Check Type C FIRST (path-based or query-based)
    // Check query params first (for secure-redirect calls)
    let mappingId = searchParams.get('mappingId')
    
    // If not in query, check pathname
    if (!mappingId) {
      mappingId = extractMappingIdFromPath(pathname)
    }
    
    if (mappingId) {
      // Type C: /r/<mappingId>/<token> OR ?token=...&mappingId=... (from secure-redirect)
      // Check query params first (for secure-redirect calls)
      let token = searchParams.get('token')
      
      // If not in query, extract from pathname
      if (!token) {
        token = extractTokenFromFormattedUrl(requestUrl)
      }
      
      if (!token) {
        return null
      }
      
      // PHASE 7.4 FIX: Normalize token with improved error handling
      try {
        token = normalizeToken(token)
      } catch (error) {
        console.error('[LINK-RESOLUTION] Token normalization failed:', {
          error: error instanceof Error ? error.message : String(error),
          rawToken: token?.substring(0, 50),
          pathname,
          format: 'Type C',
        })
        return null
      }
      
      // PHASE 7.4: Use SQLite instead of JSON
      const link = await getLinkByToken(token)
      if (!link) {
        return null
      }
      
      const email = await getEmailByMappingId(mappingId)
      console.log('[LINK-RESOLUTION] Detected Type C:', {
        token: token.substring(0, 20),
        mappingId: mappingId.substring(0, 20),
        hasEmail: !!email,
      })
      
      return {
        token,
        email,
        mappingId,
        linkFormat: 'C',
        resolvedFormat: 'C',
      }
    }
    
    // PHASE 7.3 FIX: Check Type A (path-based, /r/<token>)
    const isTypeAPath = pathname.includes('/r/') && !pathname.match(/\/r\/[^/]+\/[^/]+/)
    if (isTypeAPath) {
      // Format A: /r/<identifier> - identifier maps to token
      // Extract identifier from path (after /r/)
      const rIndex = pathname.indexOf('/r/')
      const afterR = pathname.substring(rIndex + 3)
      const identifier = afterR.split('/')[0] // Get first part (identifier)
      
      if (!identifier) {
        return null
      }
      
      // Check if it's a short identifier (8-12 chars, alphanumeric) or a long JWT token
      const isShortIdentifier = /^[0-9a-zA-Z]{8,12}$/.test(identifier)
      
      let token: string
      if (isShortIdentifier) {
        // Short identifier: resolve to token from database
        const { getTokenFromIdentifier } = await import('./linkIdentifier')
        const resolvedToken = await getTokenFromIdentifier(identifier)
        if (!resolvedToken?.token) {
          console.error('[LINK-RESOLUTION] Identifier not found:', identifier)
          return null
        }
        token = resolvedToken.token
      } else {
        // Long token (legacy support): use directly
        token = identifier
        // PHASE 7.4 FIX: Normalize token with improved error handling
        try {
          token = normalizeToken(token)
        } catch (error) {
          console.error('[LINK-RESOLUTION] Token normalization failed:', {
            error: error instanceof Error ? error.message : String(error),
            rawToken: token?.substring(0, 50),
            pathname,
            format: 'Type A',
          })
          return null
        }
      }
      
      // PHASE 7.4: Use SQLite instead of JSON
      const link = await getLinkByToken(token)
      if (!link) {
        return null
      }
      
      // PHASE 7.4: Type A email resolution - SQLite only, no fallbacks
      // Priority 1: Try link.email (Personalized Links only)
      let email: string | null = link.email || null
      
      // Priority 2: If not in link, try SQLite email_id_mappings table by linkId
      if (!email && link.id) {
        const { sql } = await import('./sql')
        const mappingRow = sql.get<{ email: string }>(
          'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
          [link.id]
        )
        if (mappingRow?.email) {
          email = mappingRow.email
        }
      }
      
      console.log('[LINK-RESOLUTION] Detected Type A:', {
        identifier: isShortIdentifier ? identifier : 'N/A',
        token: token.substring(0, 20),
        hasEmail: !!email,
        linkType: link.type,
      })
      
      return {
        token,
        email,
        mappingId: null,
        linkFormat: 'A',
        resolvedFormat: 'A',
      }
    }
    
    // PHASE 7.3 FIX: Check Type B (query-based, ?token=...&id=<identifier> or ?token=...&email=...)
    // CRITICAL: Must have token AND (identifier OR email) in query params
    let tokenFromQuery = extractTokenFromUrl(searchParams)
    if (!tokenFromQuery) {
      return null
    }
    
    // PHASE 7.4 FIX: Normalize token with improved error handling
    try {
      tokenFromQuery = normalizeToken(tokenFromQuery)
    } catch (error) {
      console.error('[LINK-RESOLUTION] Token normalization failed:', {
        error: error instanceof Error ? error.message : String(error),
        rawToken: tokenFromQuery?.substring(0, 50),
        pathname,
        format: 'Type B',
      })
      return null
    }
    
    // PHASE 7.4: Get link from SQLite instead of JSON
    const link = await getLinkByToken(tokenFromQuery)
    if (!link) {
      return null
    }
    
    // Check for identifier (new Format B) or email (legacy Format B)
    const identifier = searchParams.get('id')
    let emailFromQuery: string | null = null
    
    if (identifier) {
      // New Format B: identifier maps to email (scanner-safe)
      const { getEmailFromIdentifier } = await import('./linkIdentifier')
      emailFromQuery = await getEmailFromIdentifier(identifier)
      if (!emailFromQuery) {
        console.error('[LINK-RESOLUTION] Identifier not found for Format B:', identifier)
        return null
      }
    } else {
      // Legacy Format B: email in query param
      emailFromQuery = searchParams.get('email')
      if (emailFromQuery && emailFromQuery.trim() !== '') {
        try {
          emailFromQuery = decodeURIComponent(emailFromQuery).trim()
        } catch {
          emailFromQuery = emailFromQuery.trim()
        }
      } else {
        // Try extraction from other params (legacy support)
        emailFromQuery = extractEmailFromUrl(searchParams, urlObj.hash || null)
      }
    }
    
    // PHASE 7.3 FIX: Type B detection - MUST have email (from identifier or direct)
    if (emailFromQuery && emailFromQuery.trim() !== '' && emailFromQuery.includes('@')) {
      console.log('[LINK-RESOLUTION] Detected Type B:', {
        token: tokenFromQuery.substring(0, 20),
        identifier: identifier || 'N/A',
        email: emailFromQuery.substring(0, 20),
        linkType: link.type,
      })
      
      return {
        token: tokenFromQuery,
        email: emailFromQuery,
        mappingId: null,
        linkFormat: 'B',
        resolvedFormat: 'B',
      }
    }
    
        // PHASE 7.3 FIX: Generic Link (Type B without email in URL)
        // Pattern: /?token=... (no email param)
        // Detected when: token exists, email does NOT exist, link.type='generic'
        if (link.type === 'generic') {
          // PHASE 7.4: Get allowed emails count from SQLite
          const { sql } = await import('./sql')
          const allowedCount = sql.get<{ count: number }>(
            'SELECT COUNT(*) as count FROM email_allowlists WHERE link_id = ?',
            [link.id]
          )
          
          console.log('[LINK-RESOLUTION] Detected Generic Link:', {
            token: tokenFromQuery.substring(0, 20),
            allowedEmailsCount: allowedCount?.count || 0,
            note: 'Email will be entered by visitor or provided by sender',
          })
      
      return {
        token: tokenFromQuery,
        email: null, // Generic links don't have single email
        mappingId: null,
        linkFormat: 'B', // Generic uses Type B format (query mode)
        resolvedFormat: 'B',
      }
    }
    
    // PHASE 7.4: No fallback logic - if we reach here, the link format is invalid
    // Return null to indicate resolution failure
    console.error('[LINK-RESOLUTION] Invalid link format - token found but no valid format detected:', {
      token: tokenFromQuery.substring(0, 20),
      linkType: link.type,
      hasEmailInQuery: !!emailFromQuery,
    })
    
    return null
  } catch (error) {
    console.error('[LINK-RESOLUTION] Error resolving link:', error)
    return null
  }
}

/**
 * PHASE 7.5: Smart Auto-Healing Link Validation
 * 
 * Implements smart validation rules with auto-healing for all link formats.
 * 
 * Rules:
 * - Type A: Token exists, email resolved from SQLite
 * - Type B: Token exists, email in URL, email in allowlist (or allowlist empty = auto-heal)
 * - Type C: Token exists, mappingId resolves to email
 */
export interface SmartValidateInput {
  token: string | null
  email: string | null
  mappingId: string | null
  linkFormat?: 'A' | 'B' | 'C' | null
  pathname: string
  searchParams: URLSearchParams
}

export interface SmartValidateResult {
  valid: boolean
  reason: string
  type: 'A' | 'B' | 'C' | null
  email?: string | null
  link?: any
}

/**
 * Smart validate link with auto-healing
 * 
 * PHASE 7.5: Implements smart auto-healing validation rules
 */
export async function smartValidateLink(input: SmartValidateInput): Promise<SmartValidateResult> {
  try {
    const { token, email, mappingId, linkFormat, pathname, searchParams } = input
    
    // Rule 1: Detect link format automatically
    let detectedFormat: 'A' | 'B' | 'C' | null = linkFormat || null
    
    if (!detectedFormat) {
      // Auto-detect from URL structure
      if (mappingId && pathname.includes('/r/')) {
        detectedFormat = 'C'
      } else if (pathname.includes('/r/') && !email) {
        detectedFormat = 'A'
      } else if (token && email && email.includes('@')) {
        detectedFormat = 'B'
      }
    }
    
    // Must have token
    if (!token || token.trim() === '') {
      return {
        valid: false,
        reason: 'Token required',
        type: null,
      }
    }
    
    // Normalize token
    let normalizedToken: string
    try {
      normalizedToken = normalizeToken(token)
    } catch (error) {
      return {
        valid: false,
        reason: 'Invalid token format',
        type: detectedFormat,
      }
    }
    
    // Get link from database
    const link = await getLinkByToken(normalizedToken)
    if (!link) {
      return {
        valid: false,
        reason: 'Link not found in database',
        type: detectedFormat,
      }
    }
    
    // Check expiration
    const expiresAtMs = link.expires_at * 1000
    if (expiresAtMs && Date.now() > expiresAtMs) {
      return {
        valid: false,
        reason: 'Link expired',
        type: detectedFormat,
        link,
      }
    }
    
    // Check if used (only for personalized links)
    if (link.type === 'personalized' && link.used === 1) {
      return {
        valid: false,
        reason: 'Link already used',
        type: detectedFormat,
        link,
      }
    }
    
    // Rule 2: Type B Validation (Smart Auto-Healing)
    if (detectedFormat === 'B' || link.type === 'generic') {
      // Type B requires email in URL
      if (!email || !email.includes('@')) {
        return {
          valid: false,
          reason: 'Email required in URL for Type B links',
          type: 'B',
          link,
        }
      }
      
      // Check email against allowlist
      const { sql } = await import('./sql')
      const allowedEmails = sql.all<{ email: string }>(
        'SELECT email FROM email_allowlists WHERE link_id = ?',
        [link.id]
      )
      
      // Rule 3: Auto-Healing - If allowlist is empty, treat as valid for ANY email
      if (!allowedEmails || allowedEmails.length === 0) {
        console.log('[SMART-VALIDATE] Type B: Empty allowlist - auto-healing (allowing any email)')
        return {
          valid: true,
          reason: 'Valid Type B link (empty allowlist - auto-healed)',
          type: 'B',
          email: email.trim().toLowerCase(),
          link,
        }
      }
      
      // Check if email is in allowlist
      const allowedEmailsSet = new Set(allowedEmails.map(r => r.email.toLowerCase()))
      const isAllowed = allowedEmailsSet.has(email.trim().toLowerCase())
      
      if (!isAllowed) {
        return {
          valid: false,
          reason: 'Email not authorized for this link',
          type: 'B',
          email,
          link,
        }
      }
      
      return {
        valid: true,
        reason: 'Valid Type B link',
        type: 'B',
        email: email.trim().toLowerCase(),
        link,
      }
    }
    
    // Rule 4: Type A Validation
    if (detectedFormat === 'A' || (pathname.includes('/r/') && !mappingId)) {
      // Type A: Email resolved from SQLite
      let resolvedEmail: string | null = link.email || null
      
      if (!resolvedEmail && link.id) {
        const { sql } = await import('./sql')
        const mappingRow = sql.get<{ email: string }>(
          'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
          [link.id]
        )
        if (mappingRow?.email) {
          resolvedEmail = mappingRow.email
        }
      }
      
      if (!resolvedEmail) {
        return {
          valid: false,
          reason: 'Email not found for Type A token',
          type: 'A',
          link,
        }
      }
      
      return {
        valid: true,
        reason: 'Valid Type A link',
        type: 'A',
        email: resolvedEmail,
        link,
      }
    }
    
    // Rule 5: Type C Validation
    if (detectedFormat === 'C' || mappingId) {
      if (!mappingId) {
        return {
          valid: false,
          reason: 'MappingId required for Type C links',
          type: 'C',
          link,
        }
      }
      
      const resolvedEmail = await getEmailByMappingId(mappingId)
      if (!resolvedEmail) {
        return {
          valid: false,
          reason: 'Email not found for mappingId',
          type: 'C',
          link,
        }
      }
      
      return {
        valid: true,
        reason: 'Valid Type C link',
        type: 'C',
        email: resolvedEmail,
        link,
      }
    }
    
    // Unknown format
    return {
      valid: false,
      reason: 'Unknown link format',
      type: null,
      link,
    }
  } catch (error) {
    console.error('[SMART-VALIDATE] Error:', error)
    return {
      valid: false,
      reason: error instanceof Error ? error.message : 'Validation error',
      type: null,
    }
  }
}

