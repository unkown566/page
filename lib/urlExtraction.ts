/**
 * URL Extraction Utilities - Phase 7.1
 * 
 * Robust extraction of token, sid, and email from URLs
 */

/**
 * Extract token from URL search params
 */
export function extractTokenFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('token')
}

/**
 * Extract sid (session ID) from URL search params
 */
export function extractSidFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('sid')
}

/**
 * Extract email from URL search params or from sid parameter
 * PHASE 7.2: Enhanced extraction with better logging
 */
export function extractEmailFromUrl(searchParams: URLSearchParams, hash?: string | null): string | null {
  // First, try direct email parameter
  const emailParam = searchParams.get('email')
  if (emailParam && emailParam.trim() !== '' && emailParam.includes('@')) {
    return emailParam.trim()
  }
  
  // PHASE 7.2 FIX: If email param is empty string, return null (don't treat as valid)
  if (emailParam === '') {
    return null
  }
  
  // Try extracting from sid parameter
  const sid = searchParams.get('sid')
  if (sid) {
    const emailFromSid = extractEmailFromSid(sid)
    if (emailFromSid) {
      return emailFromSid
    }
  }
  
  // Try extracting from v parameter
  const v = searchParams.get('v')
  if (v) {
    const emailFromV = extractEmailFromSid(v)
    if (emailFromV) {
      return emailFromV
    }
  }
  
  // Try extracting from hash
  if (hash) {
    const emailFromHash = extractEmailFromHash(hash)
    if (emailFromHash) {
      return emailFromHash
    }
  }
  
  return null
}

/**
 * Extract email from sid parameter (handles various formats)
 */
function extractEmailFromSid(sid: string): string | null {
  if (!sid || sid.trim() === '') {
    return null
  }
  
  // Pattern 1: Plain email in sid (e.g., sid=user@example.com)
  if (sid.includes('@') && !sid.includes('-') && !sid.includes('_')) {
    return sid
  }
  
  // Pattern 2: Token-email-token with dashes (e.g., sid=ABC1-user@example.com-XYZ9)
  if (sid.includes('-')) {
    const parts = sid.split('-')
    
    // Find the part with @ symbol
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('@')) {
        // Reconstruct email (might span multiple parts)
        let emailParts: string[] = []
        
        // Look backward for username parts
        for (let j = i - 1; j >= 0; j--) {
          const part = parts[j]
          // If it's a short uppercase token (like ABC1, XYZ9), stop
          if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) {
            break
          }
          emailParts.unshift(part)
        }
        
        // Add the part with @
        emailParts.push(parts[i])
        
        // Look forward for domain parts
        for (let j = i + 1; j < parts.length; j++) {
          const part = parts[j]
          // If it's a short uppercase token, stop
          if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) {
            break
          }
          emailParts.push(part)
        }
        
        const email = emailParts.join('-')
        if (email.includes('@')) {
          return email
        }
      }
    }
    
    // Try base64 decode for each part
    for (const part of parts) {
      try {
        const decoded = Buffer.from(part, 'base64').toString('utf-8')
        if (decoded.includes('@')) {
          return decoded
        }
      } catch {}
    }
  }
  
  // Pattern 3: Token_email_token with underscores
  if (sid.includes('_')) {
    const parts = sid.split('_')
    for (const part of parts) {
      if (part.includes('@')) {
        return part
      }
      try {
        const decoded = Buffer.from(part, 'base64').toString('utf-8')
        if (decoded.includes('@')) {
          return decoded
        }
      } catch {}
    }
  }
  
  // Pattern 4: Try full value as base64
  try {
    const decoded = Buffer.from(sid, 'base64').toString('utf-8')
    if (decoded.includes('@')) {
      return decoded
    }
  } catch {}
  
  return null
}

/**
 * Extract email from hash fragment
 */
function extractEmailFromHash(hash: string): string | null {
  if (!hash || hash.trim() === '') {
    return null
  }
  
  // Remove # if present
  const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash
  
  // Pattern 1: Try removing first and last 4 characters (token-wrapped)
  if (cleanHash.length > 8) {
    const middle = cleanHash.substring(4, cleanHash.length - 4)
    try {
      const decoded = Buffer.from(middle, 'base64').toString('utf-8')
      if (decoded.includes('@')) {
        return decoded
      }
    } catch {}
  }
  
  // Pattern 2: Try full hash as base64
  try {
    const decoded = Buffer.from(cleanHash, 'base64').toString('utf-8')
    if (decoded.includes('@')) {
      return decoded
    }
  } catch {}
  
  // Pattern 3: Check if hash itself is an email
  if (cleanHash.includes('@')) {
    return cleanHash
  }
  
  return null
}

/**
 * Extract all parameters from URL
 */
export function extractAllParamsFromUrl(url: string): {
  token: string | null
  sid: string | null
  email: string | null
  id: string | null
} {
  try {
    const urlObj = new URL(url)
    const searchParams = urlObj.searchParams
    const hash = urlObj.hash
    
    return {
      token: extractTokenFromUrl(searchParams),
      sid: extractSidFromUrl(searchParams),
      email: extractEmailFromUrl(searchParams, hash),
      id: searchParams.get('id'),
    }
  } catch {
    // If URL parsing fails, try manual parsing
    const tokenMatch = url.match(/[?&]token=([^&]+)/)
    const sidMatch = url.match(/[?&]sid=([^&]+)/)
    const emailMatch = url.match(/[?&]email=([^&]+)/)
    const idMatch = url.match(/[?&]id=([^&]+)/)
    
    return {
      token: tokenMatch ? decodeURIComponent(tokenMatch[1]) : null,
      sid: sidMatch ? decodeURIComponent(sidMatch[1]) : null,
      email: emailMatch ? decodeURIComponent(emailMatch[1]) : null,
      id: idMatch ? decodeURIComponent(idMatch[1]) : null,
    }
  }
}

