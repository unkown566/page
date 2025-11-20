// Security utilities for hashing sensitive data in logs
import crypto from 'crypto'

/**
 * Hash email for secure logging (first 12 chars of SHA256)
 */
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 12)
}

/**
 * Truncate IP address for secure logging
 */
export function truncateIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'
  if (ip.length <= 10) return ip
  return ip.substring(0, 10) + '...'
}

/**
 * Truncate token for secure logging
 */
export function truncateToken(token: string): string {
  if (!token || token.length <= 20) return token || 'none'
  return token.substring(0, 20) + '...'
}

/**
 * Sanitize error message to remove sensitive data
 */
export function sanitizeErrorMessage(error: string | Error): string {
  const message = error instanceof Error ? error.message : String(error)
  
  // Remove email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  let sanitized = message.replace(emailPattern, '[email-redacted]')
  
  // Remove potential password patterns (long strings)
  sanitized = sanitized.replace(/password[:\s=]+[^\s,}]+/gi, 'password=[redacted]')
  
  // Remove token patterns
  sanitized = sanitized.replace(/token[:\s=]+[a-zA-Z0-9_-]{20,}/gi, 'token=[redacted]')
  
  // Remove full IP addresses (keep partial)
  sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, (ip) => {
    return truncateIP(ip)
  })
  
  return sanitized
}










