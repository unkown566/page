/**
 * Link Management System
 * Handles Type A (personalized) and Type B (generic) links
 * Uses SQLite database (linkDatabaseSql.ts) - PHASE 7.4: Full SQLite Migration
 */

import {
  createLinkRecord,
  getLinkByToken,
  getLinkById,
  saveEmailMapping,
  getEmailByMappingId,
  type LinkRecord,
} from './linkDatabaseSql'
import { createToken } from './tokens'
import { randomUUID } from 'crypto'

// ===== TYPE A: PERSONALIZED LINKS =====

/**
 * Create a personalized link (Type A)
 * One email = One link, single-use, email hidden from URL
 */
export async function createPersonalizedLink(
  email: string,
  documentId?: string,
  expirationHours: number = 168,  // Changed from 24 (1 day) to 168 (7 days)
  templateId?: string,
  templateMode?: 'auto' | 'manual' | 'rotate',
  loadingScreen?: string,
  loadingDuration?: number
): Promise<{
  url: string
  id: string // Mapping ID (for Type C)
  linkId: string // Link ID (for identifier mapping)
  token: string
  expiresAt: number
  sessionIdentifier: string
  linkToken?: string  // Legacy alias
}> {
  
  // PHASE 7.4: Generate mapping ID for Type A/C links
  const mappingId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const docId = documentId || `doc_${mappingId}`
  const expirationMinutes = expirationHours * 60
  const token = createToken(email, docId, expirationMinutes)
  const expiresAt = Math.floor((Date.now() + (expirationHours * 60 * 60 * 1000)) / 1000) // Unix timestamp in seconds

  // PHASE 7.4: Save link to SQLite (Type A format - no email in URL)
  const linkRecord = await createLinkRecord({
    type: 'personalized',
    session_identifier: token,
    link_token: token,
    name: `Personal_${email.split('@')[0]}`,
    email: email.toLowerCase(),
    template_id: templateId || null,
    template_mode: templateMode || null,
    loading_screen: loadingScreen || null,
    loading_duration: loadingDuration || null,
    expires_at: expiresAt,
    link_format: 'A', // PHASE 7.4: Personalized links always use Format A (no email in URL)
  })

  // PHASE 7.4: Save email-ID mapping to SQLite
  await saveEmailMapping(mappingId, email, linkRecord.id)

  // PHASE 7.4: Return token and mapping ID (caller will build proper URL)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // Type A format: /r/<token> (no email in URL)
  const url = `/?token=${token}`

  return {
    url, // Type A format - caller should rebuild with buildFinalLinkURL
    id: mappingId, // Mapping ID (for Type C)
    linkId: linkRecord.id, // Link ID (for identifier mapping)
    token: token,
    sessionIdentifier: token,
    linkToken: token, // Legacy alias for compatibility
    expiresAt: expiresAt * 1000 // Convert back to milliseconds for compatibility
  }
}

/**
 * Get email from ID (Type A links)
 * PHASE 7.4: Uses SQLite instead of JSON
 * 
 * Handles:
 * - Direct mappingId lookup: getEmailByMappingId(id)
 * - link_id lookup: if id starts with 'link_', try without prefix
 * - link_id lookup: if id doesn't match, try finding by link_id in email_id_mappings
 */
export async function getEmailFromId(id: string): Promise<string | null> {
  // Priority 1: Try direct mappingId lookup
  let email = await getEmailByMappingId(id)
  if (email) return email
  
  // Priority 2: If id starts with 'link_', try without prefix
  if (id.startsWith('link_')) {
    const mappingId = id.replace('link_', '')
    email = await getEmailByMappingId(mappingId)
    if (email) return email
  }
  
  // Priority 3: Try finding by link_id in email_id_mappings table
  const { sql } = await import('./sql')
  const mappingRow = sql.get<{ email: string }>(
    'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
    [id.startsWith('link_') ? id : `link_${id}`]
  )
  
  return mappingRow?.email || null
}

/**
 * Save email-ID mapping (Type A links)
 * PHASE 7.4: Uses SQLite instead of JSON
 */
export async function saveEmailIdMapping(id: string, email: string): Promise<void> {
  // Get link ID from token if available, otherwise use id as linkId
  // For now, we'll need to find the link by token or create a link_id
  // This is a simplified version - the full implementation should find the link_id
  const linkId = `link_${id}`
  await saveEmailMapping(id, email, linkId)
}

// ===== TYPE B: GENERIC LINKS WITH EMAIL LIST =====

/**
 * Create a generic link (Type B)
 * One link for multiple emails from uploaded list
 * PHASE 7.4: Uses SQLite instead of JSON
 */
export async function createGenericLink(
  name: string,
  allowedEmails: string[],
  expirationDays: number = 365,  // Changed from 7 days to 365 (1 year)
  templateId?: string
): Promise<{
  url: string
  token: string
  totalEmails: number
  expiresAt: number
}> {
  const token = `${Date.now()}_${Math.random().toString(36).substring(7)}`
  const expiresAt = Math.floor((Date.now() + (expirationDays * 24 * 60 * 60 * 1000)) / 1000) // Unix timestamp in seconds

  // Normalize emails (lowercase, deduplicate)
  const normalizedEmails = Array.from(new Set(allowedEmails.map(e => e.toLowerCase())))

  // PHASE 7.4: Save link to SQLite (Type B format - email in query param)
  const linkRecord = await createLinkRecord({
    type: 'generic',
    session_identifier: token,
    link_token: token,
    name,
    email: null, // Generic links don't have single email
    template_id: templateId || null,
    expires_at: expiresAt,
    total_emails: normalizedEmails.length,
    link_format: 'B', // PHASE 7.4: Generic links use Format B (email in query param)
  })

  // PHASE 7.4: Save allowed emails to email_allowlists table
  // TODO: Implement email_allowlists insertion here
  // For now, we'll need to add this functionality

  return {
    url: `/?token=${token}`, // Type B format - email will be in query param
    token,
    totalEmails: normalizedEmails.length,
    expiresAt: expiresAt * 1000 // Convert back to milliseconds for compatibility
  }
}

/**
 * Get generic link configuration
 * PHASE 7.4: Uses SQLite instead of JSON
 */
export async function getGenericLinkConfig(token: string): Promise<LinkRecord | null> {
  const link = await getLinkByToken(token)
  if (link && link.type === 'generic') {
    return link
  }
  return null
}

/**
 * Save generic link configuration
 * PHASE 7.4: Uses SQLite instead of JSON
 * TODO: Implement SQLite update logic
 */
export async function saveGenericLinkConfig(token: string, config: {
  expiresAt: number
  maxUses?: number | null
  singleUse?: boolean
  usedCount?: number
  usedEmails?: string[]
  createdAt?: number
}): Promise<void> {
  const existingLink = await getLinkByToken(token)
  
  if (existingLink && existingLink.type === 'generic') {
    // PHASE 7.4: Update existing link in SQLite
    // TODO: Implement SQLite UPDATE query
    const { sql } = await import('./sql')
    const expiresAt = Math.floor(config.expiresAt / 1000) // Convert to Unix timestamp
    sql.run(
      'UPDATE links SET expires_at = ?, captured_count = ? WHERE id = ?',
      [expiresAt, config.usedCount || 0, existingLink.id]
    )
  } else {
    // PHASE 7.4: Create new generic link in SQLite
    const expiresAt = Math.floor(config.expiresAt / 1000) // Convert to Unix timestamp
    await createLinkRecord({
      type: 'generic',
      session_identifier: token,
      link_token: token,
      name: null,
      email: null,
      template_id: null,
      expires_at: expiresAt,
      total_emails: 0,
      link_format: 'B',
    })
  }
}

/**
 * Increment link usage (Type B)
 * PHASE 7.4: Updates SQLite stats
 * TODO: Implement SQLite update logic
 */
export async function incrementLinkUsage(token: string, email: string): Promise<void> {
  // PHASE 7.4: Update captured_count in SQLite
  const { sql } = await import('./sql')
  sql.run(
    'UPDATE links SET captured_count = captured_count + 1 WHERE session_identifier = ? OR link_token = ?',
    [token, token]
  )
}

/**
 * Check if link was already used by email (Type B)
 * PHASE 7.4: Uses SQLite instead of JSON
 * TODO: Implement SQLite lookup
 */
export async function checkLinkUsage(token: string, email: string): Promise<boolean> {
  // PHASE 7.4: Check captured_emails table
  const { sql } = await import('./sql')
  const link = await getLinkByToken(token)
  if (!link) return false
  
  const captured = sql.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM captured_emails WHERE link_id = ? AND email = ?',
    [link.id, email.toLowerCase()]
  )
  
  return (captured?.count || 0) > 0
}

// ===== LINK VALIDATION =====

/**
 * Check if link can be used
 * Validates expiration, status, and email authorization
 * PHASE 7.4: Uses SQLite instead of JSON
 */
export async function canUseLink(
  sessionIdentifier: string,
  email?: string
): Promise<{
  canUse: boolean
  reason?: string
  link?: LinkRecord
}> {
  const link = await getLinkByToken(sessionIdentifier)

  if (!link) {
    return { canUse: false, reason: 'link_not_found' }
  }

  if (link.status !== 'active') {
    return { canUse: false, reason: 'link_inactive' }
  }

  // Check expiration (but can be bypassed by master toggle)
  const expiresAtMs = link.expires_at * 1000 // Convert Unix timestamp to milliseconds
  if (expiresAtMs < Date.now()) {
    // Check if master toggle is enabled
    try {
      const { getCachedSettings } = await import('./adminSettings')
      const settings = getCachedSettings()
      if (settings.linkManagement?.allowAllLinks) {
        // Master toggle is ON - allow expired links
        console.log('[LINK VALIDATION] ⚠️ Link expired but allowAllLinks is ON - allowing access')
        // Fall through to allow usage
      } else {
        // Master toggle is OFF - reject expired link
        return { canUse: false, reason: 'link_expired' }
      }
    } catch (error) {
      console.error('[LINK VALIDATION] Error checking master toggle:', error)
      // If error, use default (don't allow expired links)
      return { canUse: false, reason: 'link_expired' }
    }
  }

  // Type A: Check if already used
  if (link.type === 'personalized') {
    if (link.used === 1) { // SQLite stores boolean as 0/1
      return { canUse: false, reason: 'link_already_used' }
    }
  }

  // Type B: Check email authorization
  if (link.type === 'generic' && email) {
    const normalizedEmail = email.toLowerCase()

    // PHASE 7.4: Check if email is in allowed list (SQLite)
    const { sql } = await import('./sql')
    const allowed = sql.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM email_allowlists WHERE link_id = ? AND email = ?',
      [link.id, normalizedEmail]
    )
    
    if ((allowed?.count || 0) === 0) {
      return { canUse: false, reason: 'email_not_authorized' }
    }

    // Check if email already captured
    if (await checkLinkUsage(sessionIdentifier, normalizedEmail)) {
      return { canUse: false, reason: 'email_already_captured' }
    }
  }

  return { canUse: true, link }
}

