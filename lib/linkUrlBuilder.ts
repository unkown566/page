/**
 * LINK URL BUILDER - Multi-Mode Link Engine
 * 
 * Supports four link modes:
 * - Format A: /r/<token> (Clean Mode - no email in URL)
 * - Format B: /?token=<token>&email=<encodedEmail> (Query Mode - email in query)
 * - Format C: /r/<mappingId>/<token> (Red-Team Mode - mappingId in path)
 * - Format BOTH: Supports both A and B (resolved at runtime)
 * 
 * With daily URL mutation:
 * - Format A: /<entropy>/r/<token>
 * - Format B: /<entropy>/?token=<token>&email=<encodedEmail>
 * - Format C: /<entropy>/r/<mappingId>/<token>
 */

import { buildDailyEntropyPath, isDailyMutationEnabled } from './urlMutation'
import type { LinkFormat } from './linkManagerTypes'

/**
 * Build final link URL based on format
 * 
 * MULTI-MODE FIX: Updated to support all 4 modes correctly
 * 
 * @param options URL building options
 * @returns Final constructed URL
 */
export async function buildFinalLinkURL(options: {
  baseUrl: string
  format: LinkFormat
  token: string
  mappingId?: string | null
  email?: string | null // For Type B - email in query param (DEPRECATED: use identifier instead)
  identifier?: string | null // Short identifier for Format A/B (replaces token/email in URL)
}): Promise<string> {
  const { baseUrl, format, token, mappingId, email, identifier } = options
  
  // Ensure baseUrl doesn't end with /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  // Check if daily mutation is enabled
  const mutationEnabled = await isDailyMutationEnabled()
  const entropyPath = mutationEnabled ? await buildDailyEntropyPath() : ''
  
  // MULTI-MODE FIX: Handle BOTH mode - default to Type A (clean) for CSV generation
  const resolvedFormat: 'A' | 'B' | 'C' = format === 'BOTH' ? 'A' : format as 'A' | 'B' | 'C'
  
  switch (resolvedFormat) {
    case 'A':
      // Clean Mode: /r/<identifier> or /<entropy>/r/<identifier>
      // Uses short identifier instead of full JWT token
      // Identifier maps to token in database
      // FALLBACK: If identifier not provided, use token (legacy support)
      const formatAId = identifier || token // Fallback to token if identifier not provided
      return `${cleanBaseUrl}${entropyPath}/r/${formatAId}`
    
    case 'B':
      // Query Mode: /?token=<token>&id=<identifier> or /<entropy>/?token=<token>&id=<identifier>
      // Uses identifier instead of email in URL (scanner-safe)
      // Identifier maps to email in database
      // FALLBACK: If identifier not provided, use email (legacy support)
      if (identifier) {
        // New Format B: Use identifier (scanner-safe)
        return `${cleanBaseUrl}${entropyPath}/?token=${encodeURIComponent(token)}&id=${identifier}`
      } else {
        // Legacy Format B: Use email (fallback if identifier generation failed)
        if (!email) {
          throw new Error('Email or identifier is required for Type B links')
        }
        const encodedEmail = encodeURIComponent(email)
        return `${cleanBaseUrl}${entropyPath}/?token=${encodeURIComponent(token)}&email=${encodedEmail}`
      }
    
    case 'C':
    default:
      // Red-Team Mode: /r/<mappingId>/<token> or /<entropy>/r/<mappingId>/<token>
      // Uses mappingId (already short) + token
      // If mappingId is not provided, use a placeholder or token itself
      const safeMappingId = mappingId || token.substring(0, 8) // Fallback to first 8 chars of token
      return `${cleanBaseUrl}${entropyPath}/r/${safeMappingId}/${token}`
  }
}

/**
 * Extract token from URL (handles all formats A, B, C with daily mutation)
 * 
 * Supports URLs with entropy prefixes:
 * - /x9d/pq7/r/<token>
 * - /aa1/pq7/?id=<token>
 * - /k3s/aa9/r/<mappingId>/<token>
 * 
 * @param url URL string
 * @returns Extracted token or null if not found
 */
export function extractTokenFromFormattedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }
  
  try {
    const urlObj = new URL(url)
    
    // Format B: Extract from query parameter ?id=<token>
    const idParam = urlObj.searchParams.get('id')
    if (idParam) {
      // Validate it looks like a token (starts with v1_, v2_, or v3_)
      if (/^v[123]_/.test(idParam)) {
        return idParam
      }
    }
    
    // Format A/C: Extract from pathname
    // Handle entropy prefixes by finding "/r/" in the path
    // Skip all segments before "/r/"
    const pathname = urlObj.pathname
    
    // Find the position of "/r/" in the pathname
    const rIndex = pathname.indexOf('/r/')
    
    if (rIndex !== -1) {
      // Extract everything after "/r/"
      const afterR = pathname.substring(rIndex + 3) // +3 to skip "/r/"
      const pathParts = afterR.split('/').filter(p => p) // Remove empty parts
      
      if (pathParts.length === 1) {
        // Format A: /r/<token> or /<entropy>/r/<token>
        const token = pathParts[0]
        if (/^v[123]_/.test(token)) {
          return token
        }
      } else if (pathParts.length === 2) {
        // Format C: /r/<mappingId>/<token> or /<entropy>/r/<mappingId>/<token>
        const token = pathParts[1]
        if (/^v[123]_/.test(token)) {
          return token
        }
      }
    }
    
    // Fallback: Try legacy token extraction from query params
    const tokenParam = urlObj.searchParams.get('token')
    if (tokenParam && /^v[123]_/.test(tokenParam)) {
      return tokenParam
    }
    
    return null
  } catch {
    // If URL parsing fails, try regex-based extraction
    // Look for v1_/v2_/v3_ pattern in the entire string
    const versionPattern = /v[123]_[A-Za-z0-9_\-]+/g
    const matches = url.match(versionPattern)
    
    if (matches && matches.length > 0) {
      // Return the last match (most likely to be the actual token)
      return matches[matches.length - 1]
    }
    
    return null
  }
}

