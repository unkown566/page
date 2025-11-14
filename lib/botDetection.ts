// Backend bot detection utilities
// Silent detection - no user alerts, backend logging only

export interface BotDetectionResult {
  isBot: boolean
  confidence: number
  reasons: string[]
  userAgent: string
  fingerprint: string
}

// Detect bot from User-Agent
export function detectBotFromUserAgent(userAgent: string): string[] {
  const reasons: string[] = []
  const ua = userAgent.toLowerCase()

  // Known bot patterns
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'headless',
    'phantom', 'selenium', 'webdriver', 'puppeteer',
    'playwright', 'chromium', 'automation', 'test',
    'email', 'security', 'scanner', 'validator',
  ]

  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      reasons.push(`User-Agent contains: ${pattern}`)
    }
  }

  return reasons
}

// Detect datacenter IP (basic check)
export function isDatacenterIP(ip: string): boolean {
  // Common datacenter IP ranges (simplified)
  // In production, use MaxMind GeoIP2 or similar
  const datacenterRanges = [
    '192.168.', '10.', '172.16.',
  ]

  // Check if IP is in private ranges (likely datacenter)
  // Note: This is basic - use proper GeoIP service in production
  return datacenterRanges.some(range => ip.startsWith(range))
}

// Generate fingerprint
export function generateFingerprint(userAgent: string, ip: string): string {
  // Simple fingerprint - in production use more sophisticated methods
  const data = `${userAgent}-${ip}`
  // Use a simple hash (in production, use crypto)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Validate request origin
 * Assesses request authenticity and validates client integrity
 * @param userAgent Client user agent string
 * @param ip Client IP address
 * @param additionalChecks Optional additional validation checks
 * @returns Request validation result with confidence score
 */
export function validateRequestOrigin(
  userAgent: string,
  ip: string,
  additionalChecks?: {
    hasDevTools?: boolean
    refreshCount?: number
    suspiciousActivity?: boolean
  }
): BotDetectionResult {
  const reasons: string[] = []
  let confidence = 0

  // Check User-Agent
  const uaReasons = detectBotFromUserAgent(userAgent)
  reasons.push(...uaReasons)
  confidence += uaReasons.length * 10

  // Check datacenter IP
  if (isDatacenterIP(ip)) {
    reasons.push('Datacenter IP detected')
    confidence += 20
  }

  // Additional checks
  if (additionalChecks) {
    if (additionalChecks.hasDevTools) {
      reasons.push('DevTools detected')
      confidence += 30
    }
    if (additionalChecks.refreshCount && additionalChecks.refreshCount >= 5) {
      reasons.push(`Excessive refreshes: ${additionalChecks.refreshCount}`)
      confidence += 25
    }
    if (additionalChecks.suspiciousActivity) {
      reasons.push('Suspicious activity detected')
      confidence += 20
    }
  }

  const fingerprint = generateFingerprint(userAgent, ip)

  return {
    isBot: confidence >= 30, // Threshold for bot detection
    confidence: Math.min(confidence, 100),
    reasons,
    userAgent,
    fingerprint,
  }
}

// Log bot detection (for backend analytics)
export function logBotDetection(result: BotDetectionResult, email?: string) {
  // In production, send to logging service
  const logData = {
    timestamp: new Date().toISOString(),
    email: email || 'unknown',
    isBot: result.isBot,
    confidence: result.confidence,
    reasons: result.reasons,
    fingerprint: result.fingerprint,
    userAgent: result.userAgent,
  }

  // Log to console in development (will be disabled in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Bot Detection]', logData)
  }

  // In production, send to:
  // - Analytics service
  // - Logging service (DataDog, CloudWatch, etc.)
  // - Database for pattern analysis
  // - Alert system for high-confidence bots
}




