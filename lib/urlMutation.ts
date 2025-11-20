/**
 * URL MUTATION ENGINE - Daily Entropy Path Generation
 * 
 * Generates daily-changing cloaked URL path prefixes for link formats A, B, C.
 * The mutation changes daily based on TOKEN_SECRET + YYYY-MM-DD.
 * 
 * Format: /<segment1>/<segment2>/r/<token> or /<segment1>/<segment2>/?id=<token>
 * Example: /x9d/pq7/r/v3_xxx or /aa1/pq7/?id=v3_xxx
 */

// Use Web Crypto API for Edge runtime compatibility
const webCrypto = typeof crypto !== 'undefined' && 'webcrypto' in crypto 
  ? (crypto as any).webcrypto 
  : globalThis.crypto

/**
 * Get daily prefix hash from TOKEN_SECRET + YYYY-MM-DD
 * 
 * @returns SHA-256 hash as hex string
 */
export async function getDailyPrefixHash(): Promise<string> {
  const secret = process.env.TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY
  
  if (!secret) {
    throw new Error('TOKEN_SECRET or TOKEN_ENCRYPTION_KEY environment variable is required')
  }
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  // Combine secret + date
  const encoder = new TextEncoder()
  const combined = `${secret}${dateStr}`
  const combinedBytes = encoder.encode(combined)
  
  // Generate SHA-256 hash
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', combinedBytes)
  const hashArray = new Uint8Array(hashBuffer)
  
  // Convert to hex string
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Extract a segment from hash at specific position
 * 
 * @param hash Hex string hash
 * @param start Starting position in hash (0-based)
 * @param length Length of segment to extract
 * @returns Segment string (alphanumeric, lowercase)
 */
function getSegment(hash: string, start: number, length: number): string {
  const segment = hash.substring(start, start + length)
  
  // Convert to alphanumeric path segment
  // Use modulo to map hex chars to a-z0-9
  let result = ''
  for (let i = 0; i < segment.length; i++) {
    const char = segment[i]
    const code = parseInt(char, 16) // 0-15
    // Map 0-9 -> 0-9, 10-15 -> a-f, but we want more variety
    // Use modulo 36 to get 0-9a-z
    const mapped = code % 36
    if (mapped < 10) {
      result += mapped.toString()
    } else {
      result += String.fromCharCode(97 + (mapped - 10)) // a-z
    }
  }
  
  return result
}

/**
 * Build daily entropy path (e.g., "/x9d/pq7")
 * 
 * Generates 2-3 segments from the daily hash.
 * Each segment is 2-3 characters long.
 * 
 * @returns Entropy path string (e.g., "/x9d/pq7" or "/aa1/pq7/k2")
 */
export async function buildDailyEntropyPath(): Promise<string> {
  const hash = await getDailyPrefixHash()
  
  // Generate 2 segments from different positions in the hash
  // Segment 1: positions 0-2 (3 chars)
  const segment1 = getSegment(hash, 0, 3)
  
  // Segment 2: positions 8-10 (3 chars)
  const segment2 = getSegment(hash, 8, 3)
  
  // Optional: Add third segment for more entropy (positions 16-18)
  // For now, use 2 segments to keep URLs shorter
  // const segment3 = getSegment(hash, 16, 2)
  
  return `/${segment1}/${segment2}`
}

/**
 * Check if daily URL mutation is enabled
 * 
 * @returns true if mutation is enabled, false otherwise
 */
export async function isDailyMutationEnabled(): Promise<boolean> {
  try {
    const { getCachedSettings } = await import('./adminSettings')
    const settings = getCachedSettings()
    
    // Check security settings for enableDailyUrlMutation flag
    return settings.security?.enableDailyUrlMutation !== false // Default to true
  } catch (error) {
    // If error, default to enabled
    return true
  }
}

