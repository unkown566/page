/**
 * Generate Fox Member ID
 * Format: fox-{randomID}+{hostnameIP}_fox
 * Example: fox-a1b2c3d4+192.168.1.1_fox
 */
export function generateFoxId(): string {
  // Generate random 8-character ID
  const randomId = Math.random().toString(36).substring(2, 10)
  
  // Get hostname/IP (in browser, we'll use a placeholder)
  const hostname = typeof window !== 'undefined' 
    ? window.location.hostname 
    : 'localhost'
  
  return `fox-${randomId}+${hostname}_fox`
}

/**
 * Validate Fox ID format
 */
export function isValidFoxId(id: string): boolean {
  const pattern = /^fox-[a-z0-9]{8}\+[a-zA-Z0-9.-]+_fox$/
  return pattern.test(id)
}

/**
 * Extract parts from Fox ID
 */
export function parseFoxId(id: string) {
  const match = id.match(/^fox-([a-z0-9]{8})\+([a-zA-Z0-9.-]+)_fox$/)
  if (!match) return null
  
  return {
    randomId: match[1],
    hostname: match[2],
    fullId: id
  }
}

