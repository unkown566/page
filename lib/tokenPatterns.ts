/**
 * Advanced Token Pattern Generator
 * Generates sophisticated token patterns that wrap around emails
 */

export interface TokenPattern {
  id: string
  name: string
  description: string
  example: string
  generator: (email: string, isBase64: boolean) => string
}

// Generate random token string
function generateRandomToken(length: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate mixed case token
function generateMixedToken(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Encode email to base64
function encodeEmail(email: string): string {
  if (typeof window !== 'undefined') {
    return btoa(email)
  } else {
    return Buffer.from(email).toString('base64')
  }
}

// Advanced token patterns
export const TOKEN_PATTERNS: Record<string, TokenPattern> = {
  // Basic patterns (existing)
  'hash_random4_email_random4': {
    id: 'hash_random4_email_random4',
    name: '#(Random 4)(Email Base64)(Random 4)',
    description: 'Hash with 4-char random tokens wrapping base64 email',
    example: '#ABC1dGVzdEBleGFtcGxlLmNvbQ==XYZ9',
    generator: (email, isBase64) => {
      const token1 = generateRandomToken(4)
      const token2 = generateRandomToken(4)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `#${token1}${emailValue}${token2}`
    }
  },
  
  'hash_email': {
    id: 'hash_email',
    name: '#(Email) or #(Email Base64)',
    description: 'Simple hash with email',
    example: '#dGVzdEBleGFtcGxlLmNvbQ==',
    generator: (email, isBase64) => {
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `#${emailValue}`
    }
  },
  
  'query_t': {
    id: 'query_t',
    name: '?t=(email) or ?t=(email base64)',
    description: 'Query parameter t with email',
    example: '?t=dGVzdEBleGFtcGxlLmNvbQ==',
    generator: (email, isBase64) => {
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?t=${emailValue}`
    }
  },
  
  // NEW: Advanced patterns with token wrapping
  'token_email_token_short': {
    id: 'token_email_token_short',
    name: '?token=(Short2)-(Email)-(Short2)',
    description: '2-char tokens wrapping email with dashes',
    example: '?token=AB-test@example.com-XY',
    generator: (email, isBase64) => {
      const token1 = generateRandomToken(2)
      const token2 = generateRandomToken(2)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?token=${token1}-${emailValue}-${token2}`
    }
  },
  
  'token_email_token_medium': {
    id: 'token_email_token_medium',
    name: '?token=(Med6)-(Email64)-(Med6)',
    description: '6-char mixed tokens wrapping base64 email',
    example: '?token=aBc1Xy-dGVzdEBleGFtcGxlLmNvbQ==-zQ9pWm',
    generator: (email, isBase64) => {
      const token1 = generateMixedToken(6)
      const token2 = generateMixedToken(6)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?token=${token1}-${emailValue}-${token2}`
    }
  },
  
  'token_email_token_long': {
    id: 'token_email_token_long',
    name: '?token=(Long10)-(Email64)-(Long10)',
    description: '10-char tokens wrapping base64 email',
    example: '?token=aBcDeF123g-dGVzdEBleGFtcGxlLmNvbQ==-xYz987WqRt',
    generator: (email, isBase64) => {
      const token1 = generateMixedToken(10)
      const token2 = generateMixedToken(10)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?token=${token1}-${emailValue}-${token2}`
    }
  },
  
  'token_double_wrap': {
    id: 'token_double_wrap',
    name: '?token=(Token4)-email-(Token4)&t=(Token4)',
    description: 'Token wraps email AND appears again in different param',
    example: '?token=ABC1-test@example.com-XYZ9&t=PQR5',
    generator: (email, isBase64) => {
      const token1 = generateRandomToken(4)
      const token2 = generateRandomToken(4)
      const token3 = generateRandomToken(4)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?token=${token1}-${emailValue}-${token2}&t=${token3}`
    }
  },
  
  'hash_token_email_token': {
    id: 'hash_token_email_token',
    name: '#(Token6)_(Email64)_(Token6)',
    description: 'Hash with underscore-separated tokens wrapping email',
    example: '#AbC1Xy_dGVzdEBleGFtcGxlLmNvbQ==_zQ9pWm',
    generator: (email, isBase64) => {
      const token1 = generateMixedToken(6)
      const token2 = generateMixedToken(6)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `#${token1}_${emailValue}_${token2}`
    }
  },
  
  'multi_param_token_wrap': {
    id: 'multi_param_token_wrap',
    name: '?t=(Token)&email=(Email)&v=(Token)',
    description: 'Multiple parameters with tokens',
    example: '?t=ABC1&email=test@example.com&v=XYZ9',
    generator: (email, isBase64) => {
      const token1 = generateRandomToken(4)
      const token2 = generateRandomToken(4)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?t=${token1}&email=${emailValue}&v=${token2}`
    }
  },
  
  'hash_token_slash_email_slash_token': {
    id: 'hash_token_slash_email_slash_token',
    name: '#(Token)/(Email64)/(Token)',
    description: 'Hash with slash-separated tokens (looks like path)',
    example: '#ABC1/dGVzdEBleGFtcGxlLmNvbQ==/XYZ9',
    generator: (email, isBase64) => {
      const token1 = generateRandomToken(4)
      const token2 = generateRandomToken(4)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `#${token1}/${emailValue}/${token2}`
    }
  },
  
  'query_token_concat': {
    id: 'query_token_concat',
    name: '?token=(Token8)(Email64)(Token8)',
    description: 'Long tokens concatenated without separators',
    example: '?token=aBcDeF12dGVzdEBleGFtcGxlLmNvbQ==xYz987Wq',
    generator: (email, isBase64) => {
      const token1 = generateMixedToken(8)
      const token2 = generateMixedToken(8)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?token=${token1}${emailValue}${token2}`
    }
  },
  
  'reverse_token_wrap': {
    id: 'reverse_token_wrap',
    name: '?e=(Email)&token=(Token)-(Token)',
    description: 'Email first, then double token',
    example: '?e=test@example.com&token=ABC1-XYZ9',
    generator: (email, isBase64) => {
      const token1 = generateRandomToken(4)
      const token2 = generateRandomToken(4)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?e=${emailValue}&token=${token1}-${token2}`
    }
  },
  
  'session_id_wrap': {
    id: 'session_id_wrap',
    name: '?sid=(Token)_(Email64)_(Token)',
    description: 'Session ID format with wrapped email',
    example: '?sid=A1b2C3_dGVzdEBleGFtcGxlLmNvbQ==_X9y8Z7',
    generator: (email, isBase64) => {
      const token1 = generateMixedToken(6)
      const token2 = generateMixedToken(6)
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?sid=${token1}_${emailValue}_${token2}`
    }
  },
  
  // Legacy/simple patterns for backward compatibility
  'query_a': {
    id: 'query_a',
    name: '?a=(email) or ?a=(email base64)',
    description: 'Query parameter a with email',
    example: '?a=test@example.com',
    generator: (email, isBase64) => {
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?a=${emailValue}`
    }
  },
  
  'query_email': {
    id: 'query_email',
    name: '?email=(email) or ?email=(email base64)',
    description: 'Query parameter email',
    example: '?email=test@example.com',
    generator: (email, isBase64) => {
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?email=${emailValue}`
    }
  },
  
  'query_e': {
    id: 'query_e',
    name: '?e=(email) or ?e=(email base64)',
    description: 'Query parameter e with email',
    example: '?e=test@example.com',
    generator: (email, isBase64) => {
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?e=${emailValue}`
    }
  },
  
  'query_target': {
    id: 'query_target',
    name: '?target=(email) or ?target=(email base64)',
    description: 'Query parameter target with email',
    example: '?target=test@example.com',
    generator: (email, isBase64) => {
      const emailValue = isBase64 ? encodeEmail(email) : email
      return `?target=${emailValue}`
    }
  },
  
  'none': {
    id: 'none',
    name: 'None',
    description: 'No auto grab pattern',
    example: 'http://localhost:3000',
    generator: () => ''
  }
}

// Get all pattern IDs
export function getAllPatternIds(): string[] {
  return Object.keys(TOKEN_PATTERNS)
}

// Get pattern by ID
export function getPattern(id: string): TokenPattern | null {
  return TOKEN_PATTERNS[id] || null
}

// Generate auto grab link with pattern
export function generateAutoGrabLink(
  baseUrl: string,
  patternId: string,
  useBase64: boolean = true,
  placeholderEmail: string = '++email64++'
): string {
  const pattern = getPattern(patternId)
  
  if (!pattern || patternId === 'none') {
    return baseUrl
  }
  
  // Generate with placeholder
  const emailPlaceholder = useBase64 ? placeholderEmail : '++email++'
  const generatedPattern = pattern.generator(emailPlaceholder, false)
  
  return `${baseUrl}${generatedPattern}`
}

// Extract email from advanced token patterns
export function extractEmailFromTokenPattern(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    const hash = urlObj.hash.substring(1) // Remove #
    
    // Check all possible parameter names
    const possibleParams = ['token', 't', 'a', 'email', 'e', 'target', 'sid']
    
    for (const param of possibleParams) {
      const value = params.get(param)
      if (value) {
        const extracted = extractEmailFromValue(value)
        if (extracted) return extracted
      }
    }
    
    // Check hash
    if (hash) {
      const extracted = extractEmailFromValue(hash)
      if (extracted) return extracted
    }
    
    return null
  } catch {
    return null
  }
}

// Extract email from a value (handles token wrapping)
function extractEmailFromValue(value: string): string | null {
  // Pattern 1: token-email-token with dashes
  if (value.includes('-')) {
    const parts = value.split('-')
    for (const part of parts) {
      if (part.includes('@')) {
        return part // Plain email
      }
      // Try decode as base64
      try {
        const decoded = atob(part)
        if (decoded.includes('@')) {
          return decoded
        }
      } catch {}
    }
  }
  
  // Pattern 2: token_email_token with underscores
  if (value.includes('_')) {
    const parts = value.split('_')
    for (const part of parts) {
      if (part.includes('@')) {
        return part
      }
      try {
        const decoded = atob(part)
        if (decoded.includes('@')) {
          return decoded
        }
      } catch {}
    }
  }
  
  // Pattern 3: token/email/token with slashes
  if (value.includes('/')) {
    const parts = value.split('/')
    for (const part of parts) {
      if (part.includes('@')) {
        return part
      }
      try {
        const decoded = atob(part)
        if (decoded.includes('@')) {
          return decoded
        }
      } catch {}
    }
  }
  
  // Pattern 4: Try to find base64 email in concatenated string
  // Base64 emails typically have '=' padding at end
  if (value.includes('=')) {
    // Try to find base64-like segments
    const segments = value.match(/[A-Za-z0-9+/]+=*/g) || []
    for (const segment of segments) {
      try {
        const decoded = atob(segment)
        if (decoded.includes('@')) {
          return decoded
        }
      } catch {}
    }
  }
  
  // Pattern 5: Check if value itself is an email
  if (value.includes('@')) {
    return value
  }
  
  // Pattern 6: Try full value as base64
  try {
    const decoded = atob(value)
    if (decoded.includes('@')) {
      return decoded
    }
  } catch {}
  
  return null
}

// Export helper for backward compatibility
export { extractEmailFromValue }






