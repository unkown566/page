/**
 * LINK URL BUILDER WITH EMAIL - Priority Zero Fix
 * 
 * Builds proper links with email and sid parameters for Type A/B/C
 * 
 * Type A: /api/secure-redirect?token={token}&email={email}
 * Type B: /?token={token}&sid={session}&email={email}
 * Type C: /?sid={session}
 */

/**
 * Generate session ID (sid) for Type B/C links
 */
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sid = ''
  for (let i = 0; i < 4; i++) {
    sid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sid
}

/**
 * Build proper link URL with email and sid
 * 
 * @param options Link building options
 * @returns Properly formatted URL with email and sid
 */
export function buildLinkWithEmail(options: {
  baseUrl: string
  type: 'A' | 'B' | 'C'
  token: string
  email: string | null // null for Type C (user enters email)
  sid?: string | null // Optional, will be generated if missing for Type B/C
  mappingId?: string | null // For Type C
}): string {
  const { baseUrl, type, token, email, sid, mappingId } = options
  
  // PRIORITY ZERO FIX: Reject if email is blank for Type A/B
  if ((type === 'A' || type === 'B') && (!email || email.trim() === '')) {
    throw new Error('Email is required for Type A and Type B links')
  }
  
  // Ensure baseUrl doesn't end with /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  // Encode email for URL
  const encodedEmail = email ? encodeURIComponent(email) : ''
  
  switch (type) {
    case 'A':
      // Type A: /api/secure-redirect?token={token}&email={email}
      return `${cleanBaseUrl}/api/secure-redirect?token=${encodeURIComponent(token)}&email=${encodedEmail}`
    
    case 'B':
      // Type B: /?token={token}&sid={session}&email={email}
      // Generate sid if missing
      const sessionId = sid || generateSessionId()
      return `${cleanBaseUrl}/?token=${encodeURIComponent(token)}&sid=${sessionId}&email=${encodedEmail}`
    
    case 'C':
      // Type C: /?sid={session}
      // Generate sid if missing
      const sessionIdC = sid || generateSessionId()
      return `${cleanBaseUrl}/?sid=${sessionIdC}`
    
    default:
      throw new Error(`Unknown link type: ${type}`)
  }
}

/**
 * Build link for display in admin UI (Type A/B only, includes email)
 */
export function buildDisplayLink(options: {
  baseUrl: string
  type: 'A' | 'B'
  token: string
  email: string
  sid?: string | null
}): string {
  return buildLinkWithEmail({
    ...options,
    type: options.type,
    email: options.email,
  })
}

/**
 * Extract sid from generated link URL
 * PHASE 7.1: Helper to extract sid from Type B links for storage
 */
export function extractSidFromLink(linkUrl: string): string | null {
  try {
    const url = new URL(linkUrl)
    return url.searchParams.get('sid')
  } catch {
    // Try regex fallback
    const match = linkUrl.match(/[?&]sid=([^&]+)/)
    return match ? decodeURIComponent(match[1]) : null
  }
}

