// Persistent fingerprint storage for successful logins with atomic operations
// Tracks email + fingerprint + IP to prevent repeat access
import 'server-only'

import { secureReadJSON, secureUpdateJSON } from './secureFileSystem'
import { migrateFileIfNeeded } from './fileMigration'
import path from 'path'
import crypto from 'crypto'

interface FingerprintRecord {
  email: string
  fingerprint: string
  ip: string
  timestamp: number
  sessionIdentifier?: string  // New name (formerly: linkToken)
  linkToken?: string           // Legacy alias for backward compatibility
}

interface FingerprintCache {
  [key: string]: FingerprintRecord
}

// Client metadata storage (formerly: fingerprints)
// Migrate old file name on first access
const LEGACY_FILE = path.join(process.cwd(), '.fingerprints.json')
const STORAGE_FILE = path.join(process.cwd(), '.client-metadata.json')
const RECORD_TTL = 365 * 24 * 60 * 60 * 1000 // 1 year

// Migrate old file name if needed (runs once on module load)
if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  migrateFileIfNeeded(LEGACY_FILE, STORAGE_FILE)
}

// Generate fingerprint key from email + fingerprint + IP
function generateFingerprintKey(email: string, fingerprint: string, ip: string): string {
  const data = `${email.toLowerCase()}:${fingerprint}:${ip}`
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
}

// Check if fingerprint has already completed login (atomic read)
export async function hasCompletedLogin(
  email: string,
  fingerprint: string,
  ip: string
): Promise<boolean> {
  const cache = await secureReadJSON<FingerprintCache>(STORAGE_FILE, {})
  const key = generateFingerprintKey(email, fingerprint, ip)
  const record = cache[key]
  
  if (!record) {
    return false
  }
  
  // Check if expired
  const now = Date.now()
  if (now - record.timestamp > RECORD_TTL) {
    // Clean up expired entry
    await secureUpdateJSON<FingerprintCache>(STORAGE_FILE, {}, (c) => {
      const newCache = { ...c }
      delete newCache[key]
      return newCache
    })
    return false
  }
  
  return true
}

// Record successful login with fingerprint (atomic update)
export async function recordSuccessfulLogin(
  email: string,
  fingerprint: string,
  ip: string,
  sessionIdentifier?: string  // New name (formerly: linkToken)
): Promise<void> {
  const key = generateFingerprintKey(email, fingerprint, ip)
  const now = Date.now()
  
  await secureUpdateJSON<FingerprintCache>(STORAGE_FILE, {}, (cache) => {
    // Clean expired entries
    const cleanedCache: FingerprintCache = {}
    for (const [k, v] of Object.entries(cache)) {
      if (now - v.timestamp < RECORD_TTL) {
        cleanedCache[k] = v
      }
    }
    
    // Add/update record
    cleanedCache[key] = {
      email: email.toLowerCase(),
      fingerprint,
      ip,
      timestamp: now,
      sessionIdentifier,
      linkToken: sessionIdentifier, // Legacy alias for backward compatibility
    }
    
    return cleanedCache
  })
}

// Get all records for an email (atomic read)
export async function getRecordsForEmail(email: string): Promise<FingerprintRecord[]> {
  const cache = await secureReadJSON<FingerprintCache>(STORAGE_FILE, {})
  const emailLower = email.toLowerCase()
  return Object.values(cache).filter(record => record.email === emailLower)
}

