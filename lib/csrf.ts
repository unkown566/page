import csrf from 'csrf'

const tokens = new csrf()

// Generate CSRF secret per session
export function generateCSRFSecret(): string {
  return tokens.secretSync()
}

// Generate CSRF token
export function generateCSRFToken(secret: string): string {
  return tokens.create(secret)
}

// Verify CSRF token
export function verifyCSRFToken(secret: string, token: string): boolean {
  if (!secret || !token) return false
  return tokens.verify(secret, token)
}




