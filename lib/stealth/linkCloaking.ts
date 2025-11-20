/**
 * LINK CLOAKING + SAFE-LINK REWRITER BYPASS
 * 
 * Handles enterprise email link rewriting:
 * - Proofpoint URL Defense
 * - Mimecast URL Protection
 * - Office365 Safe Links
 * - Barracuda Link Protection
 * - Cisco IronPort URL Filtering
 * 
 * Bypasses safe-link rewriters and restores original links
 */

export interface LinkCloakingResult {
  originalUrl: string
  cloakedUrl: string
  detectedRewriter: string | null
  bypassed: boolean
  techniques: string[]
}

export interface SafeLinkRewriterPattern {
  name: string
  patterns: RegExp[]
  extractOriginalUrl: (url: string) => string | null
}

/**
 * Known safe-link rewriter patterns
 */
const SAFE_LINK_REWRITERS: SafeLinkRewriterPattern[] = [
  // Proofpoint URL Defense
  {
    name: 'Proofpoint',
    patterns: [
      /urldefense\.proofpoint\.com\/v\d+\/url\?u=/i,
      /urldefense\.proofpoint\.com\/v2\/url\?u=/i,
      /urldefense\.proofpoint\.com\/v3\/__/i,
      /pptext\.com\/.*\?u=/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        // Pattern: urldefense.proofpoint.com/v2/url?u=ENCODED_URL&d=...
        const match = url.match(/[?&]u=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        // Pattern: urldefense.proofpoint.com/v3/__ENCODED_URL__
        const v3Match = url.match(/v3\/__([^_]+)__/)
        if (v3Match) {
          return decodeURIComponent(v3Match[1])
        }
        return null
      } catch {
        return null
      }
    },
  },
  
  // Mimecast URL Protection
  {
    name: 'Mimecast',
    patterns: [
      /us\d+\.safelinks\.protection\.outlook\.com/i,
      /mimecast\.com\/.*\?url=/i,
      /mimecast\.com\/u\/.*\?url=/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        const match = url.match(/[?&]url=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        return null
      } catch {
        return null
      }
    },
  },
  
  // Office365 Safe Links
  {
    name: 'Office365 Safe Links',
    patterns: [
      /safelinks\.protection\.outlook\.com/i,
      /safelinks\.protection\.office365\.com/i,
      /safelinks\.protection\.office\.com/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        const match = url.match(/[?&]url=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        return null
      } catch {
        return null
      }
    },
  },
  
  // Barracuda Link Protection
  {
    name: 'Barracuda',
    patterns: [
      /barracudanetworks\.com\/.*\?url=/i,
      /barracuda\.com\/.*\?url=/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        const match = url.match(/[?&]url=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        return null
      } catch {
        return null
      }
    },
  },
  
  // Cisco IronPort URL Filtering
  {
    name: 'Cisco IronPort',
    patterns: [
      /ironport\.com\/.*\?url=/i,
      /cisco\.com\/.*\?url=/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        const match = url.match(/[?&]url=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        return null
      } catch {
        return null
      }
    },
  },
  
  // Forcepoint URL Filtering
  {
    name: 'Forcepoint',
    patterns: [
      /forcepoint\.com\/.*\?url=/i,
      /websense\.com\/.*\?url=/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        const match = url.match(/[?&]url=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        return null
      } catch {
        return null
      }
    },
  },
]

/**
 * Detect and bypass safe-link rewriters
 */
export function bypassSafeLinkRewriter(url: string): LinkCloakingResult {
  const result: LinkCloakingResult = {
    originalUrl: url,
    cloakedUrl: url,
    detectedRewriter: null,
    bypassed: false,
    techniques: [],
  }

  // Check each rewriter pattern
  for (const rewriter of SAFE_LINK_REWRITERS) {
    for (const pattern of rewriter.patterns) {
      if (pattern.test(url)) {
        result.detectedRewriter = rewriter.name
        const originalUrl = rewriter.extractOriginalUrl(url)
        
        if (originalUrl) {
          result.cloakedUrl = originalUrl
          result.bypassed = true
          result.techniques.push(`${rewriter.name.toLowerCase()}-url-extraction`)
          
          // Remove tracking parameters
          const cleanUrl = removeTrackingParameters(originalUrl)
          if (cleanUrl !== originalUrl) {
            result.cloakedUrl = cleanUrl
            result.techniques.push('tracking-parameter-removal')
          }
          
          return result
        }
      }
    }
  }

  // If no rewriter detected, still clean tracking parameters
  const cleanUrl = removeTrackingParameters(url)
  if (cleanUrl !== url) {
    result.cloakedUrl = cleanUrl
    result.bypassed = true
    result.techniques.push('tracking-parameter-removal')
  }

  return result
}

/**
 * Remove tracking parameters from URL
 */
function removeTrackingParameters(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'sid',
      'mid',
      'rid',
      'ref',
      'source',
      'campaign',
      'tracking',
      'clickid',
      'affiliate',
    ]
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param)
    })
    
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * Generate cloaked link for email sender
 * Creates a link that bypasses safe-link rewriters
 */
export function generateCloakedLink(
  originalUrl: string,
  options: {
    addTracking?: boolean
    obfuscateDomain?: boolean
    useRedirect?: boolean
  } = {}
): string {
  let cloaked = originalUrl

  // Option 1: Add legitimate-looking parameters (helps bypass some rewriters)
  if (options.addTracking) {
    try {
      const urlObj = new URL(cloaked)
      urlObj.searchParams.set('ref', 'email')
      urlObj.searchParams.set('source', 'notification')
      cloaked = urlObj.toString()
    } catch {
      // Invalid URL, skip
    }
  }

  // Option 2: Use redirect service (if configured)
  if (options.useRedirect) {
    // Would use a redirect service here
    // For now, return original
  }

  return cloaked
}

/**
 * Restore original link from rewriter URL
 * Called on landing page to extract real URL
 */
export function restoreOriginalLink(url: string): string {
  const result = bypassSafeLinkRewriter(url)
  return result.cloakedUrl
}


