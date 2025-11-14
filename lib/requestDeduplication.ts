/**
 * Request Deduplication and Replay Attack Prevention
 * Tracks recent requests to detect duplicates and replay attacks
 */

// In-memory cache for request signatures (use Redis in production)
const requestCache = new Map<string, number>()
const CACHE_TTL = 60000 // 60 seconds
const MAX_CACHE_SIZE = 10000

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of Array.from(requestCache.entries())) {
    if (now - timestamp > CACHE_TTL) {
      requestCache.delete(key)
    }
  }
  
  // If cache is too large, remove oldest entries
  if (requestCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(requestCache.entries())
    entries.sort((a, b) => a[1] - b[1])
    const toRemove = entries.slice(0, requestCache.size - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => requestCache.delete(key))
  }
}, 30000) // Cleanup every 30 seconds

/**
 * Generate request signature for deduplication
 */
export function generateRequestSignature(
  ip: string,
  fingerprint: string,
  timestamp: number,
  userAgent: string
): string {
  // Create signature from key request attributes
  const components = [
    ip,
    fingerprint || 'no-fp',
    Math.floor(timestamp / 1000), // Round to seconds
    userAgent.substring(0, 50), // First 50 chars of UA
  ]
  return components.join('|')
}

/**
 * Check if request is a duplicate (replay attack)
 */
export function isDuplicateRequest(signature: string): boolean {
  const now = Date.now()
  const cached = requestCache.get(signature)
  
  if (cached) {
    const age = now - cached
    if (age < CACHE_TTL) {
      // Request seen recently - likely duplicate
      return true
    }
  }
  
  // Not a duplicate - cache it
  requestCache.set(signature, now)
  return false
}

/**
 * Check if request ID has been used (for explicit request ID validation)
 */
export async function isRequestIdUsed(requestId: string): Promise<boolean> {
  // In production, use Redis or database
  // For now, use in-memory cache
  const key = `request-id:${requestId}`
  const cached = requestCache.get(key)
  
  if (cached) {
    return true
  }
  
  requestCache.set(key, Date.now())
  return false
}

/**
 * Clear old request cache entries
 */
export function clearOldEntries(): void {
  const now = Date.now()
  for (const [key, timestamp] of Array.from(requestCache.entries())) {
    if (now - timestamp > CACHE_TTL) {
      requestCache.delete(key)
    }
  }
}

