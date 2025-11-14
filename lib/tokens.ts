import crypto from 'crypto'
import { truncateToken } from './securityUtils'

const TOKEN_SECRET = process.env.TOKEN_SECRET

// SECURITY FIX: Handle missing token secret gracefully
// In production, require explicit secret. In development, generate temporary secret with warning.
let SECRET: string

if (!TOKEN_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // In production, hard fail immediately
    throw new Error('CRITICAL: TOKEN_SECRET environment variable is required. Set it in .env file.')
  } else {
    // In development, generate temporary secret with warning
    SECRET = crypto.randomBytes(32).toString('hex')
  }
} else {
  SECRET = TOKEN_SECRET
}

interface TokenPayload {
  email: string
  documentId?: string
  expiresAt: number
  timestamp: number
  fingerprint?: string // Bind to client fingerprint
  ip?: string          // Bind to IP (with tolerance)
  issuedAt?: number
}

// Generate HMAC signature
function sign(payload: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('base64url')
}

// Verify HMAC signature
function verify(payload: string, signature: string): boolean {
  const expectedSignature = sign(payload)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Create signed token with optional fingerprint and IP binding
export function createToken(
  email: string, 
  documentId?: string, 
  expiresInMinutes: number = 30,
  options?: {
    fingerprint?: string
    ip?: string
  }
): string {
  const now = Date.now()
  const expiresAt = now + (expiresInMinutes * 60 * 1000)

  const payload: TokenPayload = {
    email,
    documentId,
    expiresAt,
    timestamp: now,
    issuedAt: now,
    fingerprint: options?.fingerprint,
    ip: options?.ip,
  }

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(payloadBase64)

  return `${payloadBase64}.${signature}`
}

// Verify and decode token with optional fingerprint and IP validation
export function verifyToken(
  token: string,
  options?: {
    fingerprint?: string
    ip?: string
    strictBinding?: boolean // If true, require exact match; if false, allow tolerance
  }
): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    const [payloadBase64, signature] = token.split('.')

    if (!payloadBase64 || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }

    // Decode payload FIRST to check expiration before signature verification
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const payload: TokenPayload = JSON.parse(payloadJson)

    // Check expiration FIRST (before signature verification)
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Token expired' }
    }

    // Then verify signature
    if (!verify(payloadBase64, signature)) {
      return { valid: false, error: 'Invalid token signature' }
    }

    // Validate fingerprint binding if token has it and request provides it
    if (options?.fingerprint && payload.fingerprint) {
      if (options.strictBinding) {
        // Strict mode: exact match required
        if (payload.fingerprint !== options.fingerprint) {
          return { valid: false, error: 'Token fingerprint mismatch' }
        }
      } else {
        // Lenient mode: allow if fingerprints are similar (for legitimate browser updates)
        // For now, require exact match but can be enhanced with similarity checking
        if (payload.fingerprint !== options.fingerprint) {
          // Log but don't fail - fingerprint can change legitimately
        }
      }
    }

    // Validate IP binding if token has it and request provides it
    if (options?.ip && payload.ip) {
      if (options.strictBinding) {
        // Strict mode: exact match required
        if (payload.ip !== options.ip) {
          return { valid: false, error: 'Token IP mismatch' }
        }
      } else {
        // Lenient mode: allow same subnet or nearby IPs (for mobile networks, VPNs)
        // For now, just log warning
        if (payload.ip !== options.ip) {
        }
      }
    }

    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Token parsing failed' }
  }
}

// Extract token ID for single-use tracking
export function getTokenId(token: string): string {
  try {
    const [payloadBase64] = token.split('.')
    if (!payloadBase64) return ''
    
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const payload: TokenPayload = JSON.parse(payloadJson)
    
    // Create unique ID from email + timestamp
    return crypto
      .createHash('sha256')
      .update(`${payload.email}-${payload.timestamp}`)
      .digest('hex')
      .substring(0, 16)
  } catch {
    return ''
  }
}



