/**
 * LINK DATABASE SQL - SQLite Persistence Layer
 * 
 * Phase 5: Full implementation of SQLite link management
 * 
 * This module replaces all JSON storage for links.
 * All write operations MUST use transactions (sql.tx) to prevent race conditions.
 * 
 * Follows: /PROJECT_ARCHITECTURE/LINK_ENGINE_BLUEPRINT.md
 */

import { sql } from './sql'
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

// ============================================
// TypeScript Interfaces (matching init.sql schema)
// ============================================

/**
 * Link record matching the links table schema
 */
export interface LinkRecord {
  id: string
  type: 'personalized' | 'generic'
  session_identifier: string
  link_token: string | null
  name: string | null
  email: string | null
  status: 'active' | 'used' | 'expired' | 'deleted'
  template_id: string | null
  template_mode: 'auto' | 'manual' | 'rotate' | null
  language: string | null
  loading_screen: string | null
  loading_duration: number | null
  created_at: number // Unix timestamp in seconds
  expires_at: number // Unix timestamp in seconds
  used: number // 0 or 1 (boolean as INTEGER)
  used_at: number | null // Unix timestamp in seconds
  fingerprint: string | null
  ip: string | null
  total_emails: number | null
  captured_count: number | null
  pending_count: number | null
  link_format: 'A' | 'B' | 'C' // URL format: A=/r/<token>, B=/?id=<token>, C=/r/<mappingId>/<token>
}

/**
 * Email allowlist record (Type B links)
 */
export interface EmailAllowlistRecord {
  id: number
  link_id: string
  email: string
  created_at: number // Unix timestamp in seconds
  captured: number // 0 or 1 (boolean as INTEGER)
}

/**
 * Email ID mapping record (Type A links)
 */
export interface EmailIdMappingRecord {
  id: string
  email: string
  link_id: string
  created_at: number // Unix timestamp in seconds
}

/**
 * Open redirect record
 */
export interface OpenRedirectRecord {
  id: number
  link_id: string
  target_url: string
  encode: number // 0 or 1 (boolean as INTEGER)
  type: string | null
  subdomain: string | null
  created_at: number // Unix timestamp in seconds
}

/**
 * Input data for creating a new link
 */
export interface CreateLinkData {
  type: 'personalized' | 'generic'
  session_identifier: string
  link_token?: string | null
  name?: string | null
  email?: string | null
  template_id?: string | null
  template_mode?: 'auto' | 'manual' | 'rotate' | null
  language?: string | null
  loading_screen?: string | null
  loading_duration?: number | null
  expires_at: number // Unix timestamp in seconds
  total_emails?: number | null
  link_format?: 'A' | 'B' | 'C' // URL format: A=/r/<token>, B=/?id=<token>, C=/r/<mappingId>/<token>
}

/**
 * Input data for email mapping (Type A)
 */
export interface EmailMappingData {
  mapping_id: string
  email: string
  link_id: string
}

// ============================================
// Create / Save Functions
// ============================================

/**
 * Create a new link record in the database
 * 
 * Uses transaction to ensure atomicity.
 * Auto-generates id and created_at timestamp.
 * 
 * @param linkData Link data to create
 * @returns Created link record
 */
export async function createLinkRecord(linkData: CreateLinkData): Promise<LinkRecord> {
  console.log('[LINK DATABASE SQL] 🚀 Creating link record:', {
    type: linkData.type,
    session_identifier: linkData.session_identifier?.substring(0, 30) + '...',
    link_token: linkData.link_token?.substring(0, 30) + '...',
    email: linkData.email ? linkData.email.substring(0, 20) + '...' : null,
    expires_at: linkData.expires_at,
  })
  
  return await sql.tx((db) => {
    const id = randomUUID()
    const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    
    // Normalize email to lowercase if provided
    const normalizedEmail = linkData.email ? linkData.email.toLowerCase().trim() : null
    
    // Calculate initial counts for generic links
    const capturedCount = linkData.type === 'generic' ? 0 : null
    const pendingCount = linkData.type === 'generic' ? (linkData.total_emails || 0) : null
    
    // Validate and set link_format (default to 'C' if not provided or invalid)
    const linkFormat = (linkData.link_format && ['A', 'B', 'C'].includes(linkData.link_format)) 
      ? linkData.link_format 
      : 'C'
    
    console.log('[LINK DATABASE SQL] 📝 Inserting into database:', {
      id,
      session_identifier: linkData.session_identifier?.substring(0, 30) + '...',
      link_token: linkData.link_token?.substring(0, 30) + '...',
      status: 'active',
      expires_at: linkData.expires_at,
    })
    
    // Insert into links table using array parameters - use db, not sql
    const insertStmt = db.prepare(
      `INSERT INTO links 
       (id, type, session_identifier, link_token, name, email, status, template_id, 
        template_mode, language, loading_screen, loading_duration, created_at, 
        expires_at, used, total_emails, captured_count, pending_count, link_format)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    
    try {
      insertStmt.run(
        id,
        linkData.type,
        linkData.session_identifier,
        linkData.link_token || null,
        linkData.name || null,
        normalizedEmail,
        'active',
        linkData.template_id || null,
        linkData.template_mode || null,
        linkData.language || null,
        linkData.loading_screen || null,
        linkData.loading_duration || null,
        now,
        linkData.expires_at,
        0, // used
        linkData.total_emails || null,
        capturedCount,
        pendingCount,
        linkFormat,
      )
      console.log('[LINK DATABASE SQL] ✅ Link inserted successfully:', id)
    } catch (error: any) {
      console.error('[LINK DATABASE SQL] ❌ Insert failed:', error?.message || error)
      throw error
    }
    
    // Return the created record - use db, not sql
    const selectStmt = db.prepare('SELECT * FROM links WHERE id = ?')
    const record = selectStmt.get(id) as LinkRecord | undefined
    
    if (!record) {
      console.error('[LINK DATABASE SQL] ❌ Failed to retrieve created link:', id)
      throw new Error('Failed to create link record')
    }
    
    console.log('[LINK DATABASE SQL] ✅ Link record created and verified:', {
      id: record.id,
      session_identifier: record.session_identifier?.substring(0, 30) + '...',
      status: record.status,
    })
    
    return record
  })
}

/**
 * Save email mapping for Type A links
 * 
 * Maps an email to a link_id for personalized link resolution.
 * 
 * @param mappingId Unique mapping identifier
 * @param email Email address
 * @param linkId Link ID to map to
 */
export async function saveEmailMapping(
  mappingId: string,
  email: string,
  linkId: string
): Promise<void> {
  await sql.tx(async (db) => {
    const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    const normalizedEmail = email.toLowerCase().trim()
    
    // Insert into email_id_mappings
    sql.run(
      `INSERT INTO email_id_mappings (id, email, link_id, created_at)
       VALUES (?, ?, ?, ?)`,
      [mappingId, normalizedEmail, linkId, now]
    )
  })
}

/**
 * Activate a link (set status to 'active')
 * 
 * @param id Link ID to activate
 */
export async function activateLink(id: string): Promise<void> {
  await sql.tx(async (db) => {
    const result = sql.run(
      'UPDATE links SET status = ? WHERE id = ?',
      ['active', id]
    )
    
    if (result.changes === 0) {
      throw new Error(`Link with id ${id} not found`)
    }
  })
}

/**
 * Deactivate a link (set status to 'deleted')
 * 
 * @param id Link ID to deactivate
 */
export async function deactivateLink(id: string): Promise<void> {
  await sql.tx(async (db) => {
    const result = sql.run(
      'UPDATE links SET status = ? WHERE id = ?',
      ['deleted', id]
    )
    
    if (result.changes === 0) {
      throw new Error(`Link with id ${id} not found`)
    }
  })
}

// ============================================
// Lookup Functions
// ============================================

/**
 * Get link by token (session_identifier or link_token)
 * 
 * Searches both session_identifier and link_token fields.
 * 
 * @param token Token to search for
 * @returns Link record or null if not found
 */
export async function getLinkByToken(token: string): Promise<LinkRecord | null> {
  const row = sql.get<LinkRecord>(
    'SELECT * FROM links WHERE session_identifier = ? OR link_token = ?',
    [token, token]
  )
  
  return row || null
}

/**
 * Get link by ID
 * 
 * @param id Link ID
 * @returns Link record or null if not found
 */
export async function getLinkById(id: string): Promise<LinkRecord | null> {
  const row = sql.get<LinkRecord>(
    'SELECT * FROM links WHERE id = ?',
    [id]
  )
  
  return row || null
}

/**
 * Get email by mapping ID (Type A links)
 * 
 * Resolves email from email_id_mappings table.
 * 
 * @param mappingId Mapping ID to look up
 * @returns Email address or null if not found
 */
export async function getEmailByMappingId(mappingId: string): Promise<string | null> {
  const row = sql.get<{ email: string }>(
    'SELECT email FROM email_id_mappings WHERE id = ?',
    [mappingId]
  )
  
  return row?.email || null
}

/**
 * Check if a token exists in the database
 * 
 * @param token Token to check
 * @returns true if token exists, false otherwise
 */
export async function tokenExists(token: string): Promise<boolean> {
  const result = sql.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM links WHERE session_identifier = ? OR link_token = ?',
    [token, token]
  )
  
  return (result?.count || 0) > 0
}

/**
 * Resolve open redirect token
 * 
 * Looks up open redirect configuration for a link token.
 * Extracts token from open-redirect wrappers if needed.
 * 
 * @param url URL or token string (may contain open redirect wrappers)
 * @returns Open redirect record or null if not found
 */
export async function resolveOpenRedirectToken(url: string): Promise<OpenRedirectRecord | null> {
  // Extract token from URL if it contains query parameters or hash
  let token = url
  
  // Remove query parameter wrappers: ?token=, &token=, ?id=, &id=
  token = token.replace(/[?&](?:token|id)=([^&]*)/i, '$1')
  
  // Remove open redirect wrappers: %26id%3D... patterns
  try {
    token = decodeURIComponent(token)
    // Remove any remaining %26id%3D patterns
    token = token.replace(/%26id%3D([^&]*)/i, '$1')
  } catch {
    // If decoding fails, use original token
  }
  
  // Get link by token
  const link = await getLinkByToken(token)
  if (!link) {
    return null
  }
  
  // Get open redirect for this link
  const redirect = sql.get<OpenRedirectRecord>(
    'SELECT * FROM open_redirects WHERE link_id = ? LIMIT 1',
    [link.id]
  )
  
  return redirect || null
}

// ============================================
// Update Functions
// ============================================

/**
 * Mark a personalized link as used
 * 
 * Updates link status, used flag, used_at timestamp, fingerprint, and IP.
 * 
 * @param token Link token
 * @param fingerprint Device fingerprint
 * @param ip IP address
 * @returns Updated link record
 */
export async function markPersonalLinkUsed(
  token: string,
  fingerprint: string,
  ip: string
): Promise<LinkRecord> {
  return await sql.tx(async (db) => {
    const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    
    // Update link
    const result = sql.run(
      `UPDATE links 
       SET status = 'used', used = 1, used_at = ?, fingerprint = ?, ip = ?
       WHERE (session_identifier = ? OR link_token = ?) AND type = 'personalized'`,
      [now, fingerprint, ip, token, token]
    )
    
    if (result.changes === 0) {
      throw new Error(`Personalized link with token ${token} not found or already used`)
    }
    
    // Get updated record
    const updated = await getLinkByToken(token)
    if (!updated) {
      throw new Error('Failed to retrieve updated link record')
    }
    
    return updated
  })
}

/**
 * Update generic link usage statistics
 * 
 * Records email usage for Type B links and updates captured_count/pending_count.
 * 
 * @param token Link token
 * @param email Email address that used the link
 * @param fingerprint Device fingerprint
 * @param ip IP address
 * @returns Updated link record, or null if email was already captured
 */
export async function updateGenericLinkUsage(
  token: string,
  email: string,
  fingerprint: string,
  ip: string
): Promise<LinkRecord | null> {
  return await sql.tx(async (db) => {
    // 1. Lowercase the email
    const normalizedEmail = email.toLowerCase().trim()
    
    // 2. Check link exists and is type 'generic'
    const link = await getLinkByToken(token)
    if (!link) {
      throw new Error(`Link with token ${token} not found`)
    }
    
    if (link.type !== 'generic') {
      throw new Error(`Link with token ${token} is not a generic link`)
    }
    
    // 3. Validate email is in allowed_emails (email_allowlists table)
    const allowlistEntry = sql.get<EmailAllowlistRecord>(
      'SELECT * FROM email_allowlists WHERE link_id = ? AND email = ?',
      [link.id, normalizedEmail]
    )
    
    if (!allowlistEntry) {
      throw new Error(`Email ${normalizedEmail} is not in the allowlist for link ${link.id}`)
    }
    
    // 4. If already in validated_accounts (captured = 1) → return null
    if (allowlistEntry.captured === 1) {
      return null // Email already used
    }
    
    // 5. Start transaction (already in tx):
    // - Mark email as captured in email_allowlists
    sql.run(
      'UPDATE email_allowlists SET captured = 1 WHERE link_id = ? AND email = ?',
      [link.id, normalizedEmail]
    )
    
    // - Increment counters in links table
    sql.run(
      `UPDATE links 
       SET captured_count = COALESCE(captured_count, 0) + 1,
           pending_count = COALESCE(pending_count, 0) - 1
       WHERE id = ? AND type = 'generic'`,
      [link.id]
    )
    
    // 6. Commit (automatic with sql.tx)
    
    // 7. Return updated LinkRecord
    const updated = await getLinkById(link.id)
    if (!updated) {
      throw new Error('Failed to retrieve updated link record')
    }
    
    return updated
  })
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get all email allowlists for a link (Type B)
 * 
 * @param linkId Link ID
 * @returns Array of email allowlist records
 */
export async function getEmailAllowlists(linkId: string): Promise<EmailAllowlistRecord[]> {
  const rows = sql.all<EmailAllowlistRecord>(
    'SELECT * FROM email_allowlists WHERE link_id = ? ORDER BY created_at ASC',
    [linkId]
  )
  
  return rows
}

/**
 * Get all open redirects for a link
 * 
 * @param linkId Link ID
 * @returns Array of open redirect records
 */
export async function getOpenRedirects(linkId: string): Promise<OpenRedirectRecord[]> {
  const rows = sql.all<OpenRedirectRecord>(
    'SELECT * FROM open_redirects WHERE link_id = ? ORDER BY created_at ASC',
    [linkId]
  )
  
  return rows
}

// ============================================
// Consumed Tokens (v3 one-time-use tracking)
// ============================================

/**
 * Check if a token hash has been consumed
 */
export async function isTokenConsumed(tokenHash: string): Promise<boolean> {
  const row = sql.get<{ token_hash: string }>(
    'SELECT token_hash FROM consumed_tokens WHERE token_hash = ?',
    [tokenHash]
  )
  
  return row !== null
}

/**
 * Mark a token as consumed (one-time-use)
 */
export async function markTokenConsumed(
  tokenHash: string,
  linkId: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  sql.tx((db) => {
    db.prepare(
      'INSERT INTO consumed_tokens (token_hash, link_id, consumed_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)'
    ).run(
      tokenHash,
      linkId,
      Math.floor(Date.now() / 1000),
      ip || null,
      userAgent || null
    )
  })
}

