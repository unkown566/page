/**
 * Smart domain extraction for Japanese email providers
 * Handles multi-level domains like cello.ocn.ne.jp → ocn.ne.jp
 */

// Known Japanese email provider patterns
const JAPANESE_PROVIDER_PATTERNS = {
  // Major providers with subdomains
  'ocn.ne.jp': ['ocn.ne.jp'],
  'nifty.com': ['nifty.com', 'nifty.ne.jp'],
  'biglobe.ne.jp': ['biglobe.ne.jp'],
  'so-net.ne.jp': ['so-net.ne.jp'],
  'gmail.com': ['gmail.com'],
  'yahoo.co.jp': ['yahoo.co.jp'],
  'docomo.ne.jp': ['docomo.ne.jp'],
  'ezweb.ne.jp': ['ezweb.ne.jp'],
  'softbank.ne.jp': ['softbank.ne.jp'],
  
  // Educational institutions (.ac.jp)
  'ac.jp': ['ac.jp'],
  
  // Government/municipal (.go.jp, .lg.jp)
  'go.jp': ['go.jp'],
  'lg.jp': ['lg.jp'],
  
  // Regional domains
  'yokohama.jp': ['yokohama.jp'],
  'tokyo.jp': ['tokyo.jp'],
  'osaka.jp': ['osaka.jp'],
}

/**
 * Extract base domain from email address
 * Handles Japanese multi-level domains intelligently
 */
export function extractBaseDomain(email: string): string {
  // Extract domain from email
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return ''
  
  const parts = domain.split('.')
  
  // For Japanese .ac.jp domains (educational)
  // Example: sanken.keio.ac.jp → keio.ac.jp
  if (domain.endsWith('.ac.jp') && parts.length >= 3) {
    return parts.slice(-3).join('.') // Get last 3 parts (e.g., keio.ac.jp)
  }
  
  // For Japanese .co.jp domains (companies)
  // Example: subdomain.company.co.jp → company.co.jp
  if (domain.endsWith('.co.jp') && parts.length >= 3) {
    return parts.slice(-3).join('.') // Get last 3 parts
  }
  
  // For Japanese .ne.jp domains (network providers)
  // Example: cello.ocn.ne.jp → ocn.ne.jp
  if (domain.endsWith('.ne.jp') && parts.length >= 3) {
    // Check if second-to-last part is a known provider
    const possibleProvider = parts.slice(-3).join('.')
    
    // Known .ne.jp providers
    const neJpProviders = ['ocn.ne.jp', 'nifty.ne.jp', 'biglobe.ne.jp', 'so-net.ne.jp', 
                           'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp']
    
    if (neJpProviders.some(provider => possibleProvider.endsWith(provider))) {
      return parts.slice(-3).join('.') // e.g., ocn.ne.jp
    }
  }
  
  // For other Japanese regional domains (.jp)
  // Example: gancen.asahi.yokohama.jp → yokohama.jp
  if (domain.endsWith('.jp') && parts.length >= 3) {
    // Check if it's a known regional domain
    const possibleRegional = parts.slice(-2).join('.')
    const regionalDomains = ['yokohama.jp', 'tokyo.jp', 'osaka.jp', 'kyoto.jp', 
                             'fukuoka.jp', 'sapporo.jp', 'sendai.jp', 'nagoya.jp']
    
    if (regionalDomains.includes(possibleRegional)) {
      return possibleRegional
    }
    
    // For government/educational, keep 3 levels
    if (domain.endsWith('.go.jp') || domain.endsWith('.lg.jp')) {
      return parts.slice(-3).join('.')
    }
  }
  
  // For standard domains with subdomains
  // Example: mbr.nifty.com → nifty.com
  if (parts.length >= 3) {
    const possibleBase = parts.slice(-2).join('.')
    
    // Check if it's a known provider
    for (const [provider, variations] of Object.entries(JAPANESE_PROVIDER_PATTERNS)) {
      if (variations.some(v => domain.endsWith(v))) {
        // Return the base provider domain
        if (provider.includes('.')) {
          return provider
        }
      }
    }
    
    // Default: return last 2 parts (standard domain)
    return possibleBase
  }
  
  // Return original domain if no special handling needed
  return domain
}

/**
 * Get redirect URL for email domain
 * Returns base domain URL or fallback
 */
export function getRedirectUrlForEmail(email: string, fallbackUrl?: string): string {
  const baseDomain = extractBaseDomain(email)
  
  if (!baseDomain) {
    return fallbackUrl || 'https://www.google.com'
  }
  
  // Return HTTPS URL for the base domain
  return `https://${baseDomain}`
}

/**
 * Test cases for validation
 */
export const TEST_CASES = [
  // Japanese .ne.jp domains
  { email: 'au-kense@cello.ocn.ne.jp', expected: 'ocn.ne.jp' },
  { email: 'andante@snow.ocn.ne.jp', expected: 'ocn.ne.jp' },
  { email: 't-awaya@nifty.ne.jp', expected: 'nifty.ne.jp' },
  
  // Japanese .com domains with subdomains
  { email: 'myhien@mbr.nifty.com', expected: 'nifty.com' },
  { email: 'tarokawamoto@nifty.com', expected: 'nifty.com' },
  { email: 'satoko.shimizu@nifty.com', expected: 'nifty.com' },
  
  // Japanese educational (.ac.jp)
  { email: 'seijik@cc.hirosaki-u.ac.jp', expected: 'hirosaki-u.ac.jp' },
  { email: 'correspondencexxma613@sanken.keio.ac.jp', expected: 'keio.ac.jp' },
  
  // Japanese regional
  { email: 'miyagi@gancen.asahi.yokohama.jp', expected: 'yokohama.jp' },
  
  // Standard domains
  { email: 'user@gmail.com', expected: 'gmail.com' },
  { email: 'user@yahoo.co.jp', expected: 'yahoo.co.jp' },
]










