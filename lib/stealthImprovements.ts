// Advanced Stealth & Evasion Improvements
// Techniques to evade detection, bypass filters, and remain undetectable

/**
 * Randomize response times to mimic human behavior
 */
export function randomizeDelay(min: number = 100, max: number = 500): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Obfuscate sensitive data in responses
 */
export function obfuscateData(data: string): string {
  // Base64 encode with random padding
  const encoded = Buffer.from(data).toString('base64')
  const padding = Math.random().toString(36).substring(2, 8)
  return `${encoded}${padding}`
}

/**
 * Deobfuscate data
 */
export function deobfuscateData(obfuscated: string): string {
  // Remove padding and decode
  const encoded = obfuscated.substring(0, obfuscated.length - 6)
  return Buffer.from(encoded, 'base64').toString('utf-8')
}

/**
 * Generate random response variations to avoid fingerprinting
 */
export function generateRandomResponse(): {
  headers: Record<string, string>
  cacheControl: string
} {
  const variations = [
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cacheControl: 'no-cache, no-store, must-revalidate',
    },
    {
      headers: {
        'Cache-Control': 'private, no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cacheControl: 'private, no-cache',
    },
    {
      headers: {
        'Cache-Control': 'max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cacheControl: 'max-age=0, must-revalidate',
    },
  ]
  
  return variations[Math.floor(Math.random() * variations.length)]
}

/**
 * Rotate User-Agent strings to avoid detection
 */
export function rotateUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
  ]
  
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

/**
 * Add random noise to timestamps to avoid pattern detection
 */
export function addTimestampNoise(timestamp: number): number {
  const noise = Math.floor(Math.random() * 1000) - 500 // -500ms to +500ms
  return timestamp + noise
}

/**
 * Generate random session tokens
 */
export function generateSessionToken(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const sessionId = `${timestamp}-${random}`
  return Buffer.from(sessionId).toString('base64url')
}

/**
 * Validate session token
 */
export function validateSessionToken(token: string, maxAge: number = 3600000): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [timestamp] = decoded.split('-')
    const age = Date.now() - parseInt(timestamp)
    return age < maxAge && age > 0
  } catch {
    return false
  }
}

/**
 * Add random query parameters to URLs to prevent caching
 */
export function addRandomParams(url: string): string {
  const params = new URLSearchParams()
  params.set('_t', Date.now().toString())
  params.set('_r', Math.random().toString(36).substring(2, 15))
  params.set('_v', Math.random().toString(36).substring(2, 8))
  
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

/**
 * Rotate encryption keys periodically
 */
export function rotateEncryptionKey(baseKey: string, rotationInterval: number = 3600000): string {
  const currentHour = Math.floor(Date.now() / rotationInterval)
  const rotated = `${baseKey}-${currentHour}`
  return Buffer.from(rotated).toString('base64').substring(0, 32)
}

/**
 * Simulate human typing delay
 */
export function humanTypingDelay(): Promise<void> {
  const delay = randomizeDelay(50, 200)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Add random whitespace to responses (minimal obfuscation)
 */
export function addRandomWhitespace(content: string): string {
  // Add minimal random whitespace that doesn't affect parsing
  return content.replace(/>/g, () => {
    if (Math.random() > 0.95) {
      return '>\n' // 5% chance of newline
    }
    return '>'
  })
}

/**
 * Generate random error messages to avoid pattern detection
 */
export function generateRandomError(): string {
  const errors = [
    'Service temporarily unavailable',
    'Please try again later',
    'Connection timeout',
    'Request processing',
    'Loading resources',
  ]
  return errors[Math.floor(Math.random() * errors.length)]
}

/**
 * Check if request appears to be from a legitimate browser
 */
export function isLegitimateBrowser(headers: Record<string, string | null>): boolean {
  // Check for browser-specific headers
  const hasAccept = headers['accept'] && headers['accept'].includes('text/html')
  const hasAcceptLanguage = !!headers['accept-language']
  const hasAcceptEncoding = !!headers['accept-encoding']
  const hasConnection = headers['connection'] === 'keep-alive' || headers['connection'] === 'close'
  const hasSecFetchSite = !!headers['sec-fetch-site'] // Modern browsers
  const hasSecFetchMode = !!headers['sec-fetch-mode'] // Modern browsers
  
  // Legitimate browsers typically have most of these
  const score = [
    hasAccept,
    hasAcceptLanguage,
    hasAcceptEncoding,
    hasConnection,
    hasSecFetchSite,
    hasSecFetchMode,
  ].filter(Boolean).length
  
  return score >= 4 // At least 4 out of 6
}

/**
 * Rate limiting with exponential backoff
 */
export function calculateBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 60000) // Max 60 seconds
}

/**
 * Add jitter to delays to avoid timing patterns
 */
export function addJitter(delay: number, jitterPercent: number = 0.1): number {
  const jitter = delay * jitterPercent * (Math.random() * 2 - 1) // -10% to +10%
  return Math.max(0, delay + jitter)
}



