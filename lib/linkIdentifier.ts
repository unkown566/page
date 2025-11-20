/**
 * LINK IDENTIFIER SYSTEM
 * 
 * Generates short, scanner-safe identifiers for links
 * - Format A: Short identifier maps to token
 * - Format B: Short identifier maps to email
 * - Format C: Uses mappingId (already short)
 */

import { sql } from './sql'
import { randomBytes } from 'crypto'

/**
 * Generate a short, URL-safe identifier
 * Format: 8-12 character alphanumeric (e.g., "aB3xY9mK", "pQ7rT2wN")
 */
export function generateShortIdentifier(): string {
  // Generate 6 random bytes (48 bits of entropy)
  const bytes = randomBytes(6)
  
  // Convert to base62 (0-9, a-z, A-Z) for URL-safe encoding
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  
  // Use modulo to map bytes to base62 characters
  let num = 0
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8) + bytes[i]
  }
  
  // Convert to base62
  while (num > 0) {
    result = chars[num % 62] + result
    num = Math.floor(num / 62)
  }
  
  // Ensure minimum length of 8 characters
  while (result.length < 8) {
    result = chars[Math.floor(Math.random() * 62)] + result
  }
  
  // Cap at 12 characters for readability
  return result.substring(0, 12)
}

/**
 * Save identifier → token mapping (Format A)
 * Stores in a new table: link_identifiers
 */
export async function saveIdentifierMapping(
  identifier: string,
  value: string, // Token for Format A, Email for Format B
  linkId: string,
  type: 'token' | 'email' // 'token' for Format A, 'email' for Format B
): Promise<void> {
  await sql.tx((db) => {
    const now = Math.floor(Date.now() / 1000)
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS link_identifiers (
        identifier TEXT PRIMARY KEY,
        link_id TEXT NOT NULL,
        token TEXT,
        email TEXT,
        type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
      )
    `)
    
    // Create index for faster lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_link_identifiers_link_id ON link_identifiers(link_id)
    `)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_link_identifiers_token ON link_identifiers(token)
    `)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_link_identifiers_email ON link_identifiers(email)
    `)
    
    // Insert mapping
    const stmt = db.prepare(`
      INSERT INTO link_identifiers (identifier, link_id, token, email, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      identifier,
      linkId,
      type === 'token' ? value : null, // For token type: store token
      type === 'email' ? value : null, // For email type: store email
      type,
      now
    )
  })
}

/**
 * Get token and linkId from identifier (Format A)
 * Returns both token and linkId for proper link lookup
 */
export async function getTokenFromIdentifier(identifier: string): Promise<{ token: string; linkId: string } | null> {
  const { sql } = await import('./sql')
  const row = sql.get<{ token: string; link_id: string }>(
    'SELECT token, link_id FROM link_identifiers WHERE identifier = ? AND type = ?',
    [identifier, 'token']
  )
  
  if (!row || !row.token || !row.link_id) {
    return null
  }
  
  return {
    token: row.token,
    linkId: row.link_id,
  }
}

/**
 * Get email from identifier (Format B)
 */
export async function getEmailFromIdentifier(identifier: string): Promise<string | null> {
  const { sql } = await import('./sql')
  const row = sql.get<{ email: string }>(
    'SELECT email FROM link_identifiers WHERE identifier = ? AND type = ?',
    [identifier, 'email']
  )
  
  return row?.email || null
}

/**
 * Get identifier from token (reverse lookup for Format A)
 */
export async function getIdentifierFromToken(token: string): Promise<string | null> {
  const { sql } = await import('./sql')
  const row = sql.get<{ identifier: string }>(
    'SELECT identifier FROM link_identifiers WHERE token = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
    [token, 'token']
  )
  
  return row?.identifier || null
}

/**
 * Get identifier from email (reverse lookup for Format B)
 */
export async function getIdentifierFromEmail(email: string, linkId: string): Promise<string | null> {
  const { sql } = await import('./sql')
  const normalizedEmail = email.toLowerCase().trim()
  const row = sql.get<{ identifier: string }>(
    'SELECT identifier FROM link_identifiers WHERE email = ? AND link_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
    [normalizedEmail, linkId, 'email']
  )
  
  return row?.identifier || null
}

