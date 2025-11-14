/**
 * Anomaly Detection and Behavior Scoring
 * Tracks user behavior patterns to detect suspicious activity
 */

export interface UserBehavior {
  requestRate: number        // Requests per minute
  failureRate: number        // Failed attempts ratio
  fingerprintChanges: number // How often fingerprint changes
  geoHops: number           // Geographic location changes
  lastRequestTime: number
  requestCount: number
  failureCount: number
  fingerprints: Set<string>
  locations: Set<string>
}

// In-memory behavior tracking (use Redis in production)
const behaviorCache = new Map<string, UserBehavior>()
const BEHAVIOR_TTL = 3600000 // 1 hour

// Cleanup old behavior data
setInterval(() => {
  const now = Date.now()
  for (const [key, behavior] of Array.from(behaviorCache.entries())) {
    if (now - behavior.lastRequestTime > BEHAVIOR_TTL) {
      behaviorCache.delete(key)
    }
  }
}, 300000) // Cleanup every 5 minutes

/**
 * Get or create behavior tracking for identifier (IP + fingerprint)
 */
export function getBehavior(identifier: string): UserBehavior {
  const cached = behaviorCache.get(identifier)
  if (cached) {
    return cached
  }
  
  const behavior: UserBehavior = {
    requestRate: 0,
    failureRate: 0,
    fingerprintChanges: 0,
    geoHops: 0,
    lastRequestTime: Date.now(),
    requestCount: 0,
    failureCount: 0,
    fingerprints: new Set(),
    locations: new Set(),
  }
  
  behaviorCache.set(identifier, behavior)
  return behavior
}

/**
 * Update behavior tracking
 */
export function updateBehavior(
  identifier: string,
  options: {
    fingerprint?: string
    location?: string
    failed?: boolean
  }
): UserBehavior {
  const behavior = getBehavior(identifier)
  const now = Date.now()
  
  // Update request count and rate
  behavior.requestCount++
  const timeSinceLastRequest = now - behavior.lastRequestTime
  const minutesSinceLastRequest = timeSinceLastRequest / 60000
  
  if (minutesSinceLastRequest > 0) {
    behavior.requestRate = behavior.requestCount / minutesSinceLastRequest
  }
  
  // Track fingerprint changes
  if (options.fingerprint) {
    if (!behavior.fingerprints.has(options.fingerprint)) {
      if (behavior.fingerprints.size > 0) {
        behavior.fingerprintChanges++
      }
      behavior.fingerprints.add(options.fingerprint)
    }
  }
  
  // Track location changes
  if (options.location) {
    if (!behavior.locations.has(options.location)) {
      if (behavior.locations.size > 0) {
        behavior.geoHops++
      }
      behavior.locations.add(options.location)
    }
  }
  
  // Track failures
  if (options.failed) {
    behavior.failureCount++
    behavior.failureRate = behavior.failureCount / behavior.requestCount
  }
  
  behavior.lastRequestTime = now
  return behavior
}

/**
 * Calculate anomaly score based on behavior
 */
export function calculateAnomalyScore(behavior: UserBehavior): {
  score: number
  reasons: string[]
} {
  let score = 0
  const reasons: string[] = []
  
  // High request rate (potential bot)
  if (behavior.requestRate > 10) {
    score += 20
    reasons.push(`High request rate: ${behavior.requestRate.toFixed(2)}/min`)
  }
  
  // High failure rate (potential brute force)
  if (behavior.failureRate > 0.5) {
    score += 30
    reasons.push(`High failure rate: ${(behavior.failureRate * 100).toFixed(1)}%`)
  }
  
  // Frequent fingerprint changes (potential evasion)
  if (behavior.fingerprintChanges > 3) {
    score += 25
    reasons.push(`Frequent fingerprint changes: ${behavior.fingerprintChanges}`)
  }
  
  // Geographic hopping (potential VPN/proxy abuse)
  if (behavior.geoHops > 2) {
    score += 20
    reasons.push(`Geographic location changes: ${behavior.geoHops}`)
  }
  
  // Too many unique fingerprints (suspicious)
  if (behavior.fingerprints.size > 5) {
    score += 15
    reasons.push(`Multiple fingerprints: ${behavior.fingerprints.size}`)
  }
  
  return { score, reasons }
}

/**
 * Get behavior identifier from request
 */
export function getBehaviorIdentifier(
  ip: string,
  fingerprint?: string
): string {
  return `${ip}-${fingerprint || 'no-fp'}`
}

