/**
 * LINK PROCESSING + URL REWRITER HANDLING
 * 
 * Handles enterprise email link processing:
 * - URL normalization
 * - Parameter extraction
 * - Link restoration
 * 
 * Processes rewritten URLs and restores original links
 */

export interface LinkProcessingResult {
  originalUrl: string
  processedUrl: string
  detectedProcessor: string | null
  processed: boolean
  techniques: string[]
}

export interface UrlProcessorPattern {
  name: string
  patterns: RegExp[]
  extractOriginalUrl: (url: string) => string | null
}

/**
 * Known URL processor patterns
 */
const URL_PROCESSORS: UrlProcessorPattern[] = [
  // URL processing service patterns
  {
    name: 'URLProcessor1',
    patterns: [
      /urldefense\.proofpoint\.com\/v\d+\/url\?u=/i,
      /urldefense\.proofpoint\.com\/v2\/url\?u=/i,
      /urldefense\.proofpoint\.com\/v3\/__/i,
      /pptext\.com\/.*\?u=/i,
    ],
    extractOriginalUrl: (url: string) => {
      try {
        // Extract encoded URL from parameters
        const match = url.match(/[?&]u=([^&]+)/)
        if (match) {
          return decodeURIComponent(match[1])
        }
        // Alternative pattern extraction
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
  
  // Email service URL processing
  {
    name: 'URLProcessor2',
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
  
  // Office service URL processing
  {
    name: 'URLProcessor3',
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
  
  // Network service URL processing
  {
    name: 'URLProcessor4',
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
  
  // Enterprise service URL processing
  {
    name: 'URLProcessor5',
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
  
  // Security service URL processing
  {
    name: 'URLProcessor6',
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
 * Process and normalize URL
 */
export function processUrlRewriter(url: string): LinkProcessingResult {
  const result: LinkProcessingResult = {
    originalUrl: url,
    processedUrl: url,
    detectedProcessor: null,
    processed: false,
    techniques: [],
  }

  // Check each processor pattern
  for (const processor of URL_PROCESSORS) {
    for (const pattern of processor.patterns) {
      if (pattern.test(url)) {
        result.detectedProcessor = processor.name
        const originalUrl = processor.extractOriginalUrl(url)
        
        if (originalUrl) {
          result.processedUrl = originalUrl
          result.processed = true
          result.techniques.push(`${processor.name.toLowerCase()}-url-extraction`)
          
          // Remove tracking parameters
          const cleanUrl = removeTrackingParameters(originalUrl)
          if (cleanUrl !== originalUrl) {
            result.processedUrl = cleanUrl
            result.techniques.push('tracking-parameter-removal')
          }
          
          return result
        }
      }
    }
  }

  // If no processor detected, still clean tracking parameters
  const cleanUrl = removeTrackingParameters(url)
  if (cleanUrl !== url) {
    result.processedUrl = cleanUrl
    result.processed = true
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
 * Generate processed link for email sender
 * Creates a link that works with URL processors
 */
export function generateProcessedLink(
  originalUrl: string,
  options: {
    addTracking?: boolean
    obfuscateDomain?: boolean
    useRedirect?: boolean
  } = {}
): string {
  let processed = originalUrl

  // Option 1: Add legitimate-looking parameters
  if (options.addTracking) {
    try {
      const urlObj = new URL(processed)
      urlObj.searchParams.set('ref', 'email')
      urlObj.searchParams.set('source', 'notification')
      processed = urlObj.toString()
    } catch {
      // Invalid URL, skip
    }
  }

  // Option 2: Use redirect service (if configured)
  if (options.useRedirect) {
    // Would use a redirect service here
    // For now, return original
  }

  return processed
}

/**
 * Restore original link from processed URL
 * Called on landing page to extract real URL
 */
export function restoreOriginalLink(url: string): string {
  const result = processUrlRewriter(url)
  return result.processedUrl
}



