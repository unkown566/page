/**
 * Generate Member ID
 * Format: fox-{randomID}+{hostnameIP}_fox
 */
export function generateMemberId(): string {
  const randomId = Math.random().toString(36).substring(2, 10)
  const hostname = typeof window !== 'undefined' 
    ? window.location.hostname 
    : 'localhost'
  
  return `fox-${randomId}+${hostname}_fox`
}

export function isValidMemberId(id: string): boolean {
  const pattern = /^fox-[a-z0-9]{8}\+[a-zA-Z0-9.-]+_fox$/
  return pattern.test(id)
}

export function parseMemberId(id: string) {
  const match = id.match(/^fox-([a-z0-9]{8})\+([a-zA-Z0-9.-]+)_fox$/)
  if (!match) return null
  
  return {
    randomId: match[1],
    hostname: match[2],
    fullId: id
  }
}







