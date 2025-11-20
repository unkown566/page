/**
 * LINK MANAGER TYPES - Multi-Mode Link Engine
 * 
 * Defines all link format types and related interfaces
 */

/**
 * Link Format Types
 * 
 * - A: Clean Mode - /r/<token> (no email in link, fetched from DB)
 * - B: Query Mode - /?token=<token>&email=<encodedEmail>
 * - C: Red-Team Mode - /r/<mappingId>/<token>
 * - BOTH: Supports both A and B based on presence of email param
 */
export type LinkFormat = 'A' | 'B' | 'C' | 'BOTH'

/**
 * Link generation options
 */
export interface LinkGenerationOptions {
  email: string
  token: string
  mappingId?: string | null
  linkFormat: LinkFormat
  baseUrl: string
}

/**
 * Link resolution result
 */
export interface LinkResolutionResult {
  token: string
  email: string | null
  mappingId?: string | null
  linkFormat: LinkFormat
  resolvedFormat: 'A' | 'B' | 'C' // Actual format after BOTH resolution
}



