// Enhanced Bot Patterns - Comprehensive detection from research
// Includes: AI crawlers, email security tools, antivirus defenders, quarantine systems

export interface BotPattern {
  name: string
  userAgentPatterns: RegExp[]
  headers: string[]
  ipRanges?: string[]
  confidence: number
}

// Email Security & Firewall Tools
export const EMAIL_SECURITY_PATTERNS: BotPattern[] = [
  {
    name: 'Proofpoint',
    userAgentPatterns: [
      /proofpoint/i,
      /pptext/i,
      /ppmsg/i,
      /proofpoint.*scanner/i,
      /proofpoint.*security/i,
    ],
    headers: ['x-proofpoint', 'x-proofpoint-id', 'x-proofpoint-version'],
    confidence: 95,
  },
  {
    name: 'Mimecast',
    userAgentPatterns: [
      /mimecast/i,
      /mimecast.*scanner/i,
      /mimecast.*security/i,
    ],
    headers: ['x-mimecast', 'x-mimecast-id', 'x-mimecast-version'],
    confidence: 95,
  },
  {
    name: 'Barracuda',
    userAgentPatterns: [
      /barracuda/i,
      /barracuda.*scanner/i,
      /barracuda.*security/i,
    ],
    headers: ['x-barracuda', 'x-barracuda-id'],
    confidence: 95,
  },
  {
    name: 'Forcepoint',
    userAgentPatterns: [
      /forcepoint/i,
      /forcepoint.*scanner/i,
      /websense/i, // Legacy name
    ],
    headers: ['x-forcepoint', 'x-websense'],
    confidence: 95,
  },
  {
    name: 'Symantec Email Security',
    userAgentPatterns: [
      /symantec/i,
      /messagelabs/i,
      /symantec.*scanner/i,
    ],
    headers: ['x-symantec', 'x-messagelabs'],
    confidence: 95,
  },
  {
    name: 'Cisco IronPort',
    userAgentPatterns: [
      /ironport/i,
      /cisco.*esa/i,
      /ironport.*scanner/i,
    ],
    headers: ['x-ironport', 'x-cisco-esa'],
    confidence: 95,
  },
  {
    name: 'Microsoft Defender',
    userAgentPatterns: [
      /microsoft.*defender/i,
      /windows.*defender/i,
      /defender.*scanner/i,
    ],
    headers: ['x-defender', 'x-microsoft-defender'],
    confidence: 90,
  },
  {
    name: 'Trend Micro',
    userAgentPatterns: [
      /trendmicro/i,
      /trend.*micro/i,
      /trendmicro.*scanner/i,
    ],
    headers: ['x-trendmicro', 'x-trend'],
    confidence: 95,
  },
  {
    name: 'Sophos',
    userAgentPatterns: [
      /sophos/i,
      /sophos.*scanner/i,
      /sophos.*security/i,
    ],
    headers: ['x-sophos', 'x-sophos-id'],
    confidence: 95,
  },
  {
    name: 'Kaspersky',
    userAgentPatterns: [
      /kaspersky/i,
      /kaspersky.*scanner/i,
      /kaspersky.*security/i,
    ],
    headers: ['x-kaspersky'],
    confidence: 95,
  },
  {
    name: 'McAfee',
    userAgentPatterns: [
      /mcafee/i,
      /mcafee.*scanner/i,
      /mcafee.*security/i,
    ],
    headers: ['x-mcafee', 'x-mcafee-id'],
    confidence: 95,
  },
  {
    name: 'Bitdefender',
    userAgentPatterns: [
      /bitdefender/i,
      /bitdefender.*scanner/i,
    ],
    headers: ['x-bitdefender'],
    confidence: 95,
  },
  {
    name: 'FireEye',
    userAgentPatterns: [
      /fireeye/i,
      /fireeye.*scanner/i,
      /mandiant/i, // Acquired by FireEye
    ],
    headers: ['x-fireeye', 'x-mandiant'],
    confidence: 95,
  },
  {
    name: 'Checkpoint',
    userAgentPatterns: [
      /checkpoint/i,
      /checkpoint.*scanner/i,
    ],
    headers: ['x-checkpoint'],
    confidence: 95,
  },
  {
    name: 'Zscaler',
    userAgentPatterns: [
      /zscaler/i,
      /zscaler.*scanner/i,
    ],
    headers: ['x-zscaler', 'x-zscaler-client'],
    confidence: 95,
  },
  {
    name: 'Fortinet',
    userAgentPatterns: [
      /fortinet/i,
      /fortigate/i,
      /fortinet.*scanner/i,
    ],
    headers: ['x-fortinet', 'x-fortigate'],
    confidence: 95,
  },
  {
    name: 'Quarantine Systems',
    userAgentPatterns: [
      /quarantine/i,
      /quarantine.*scanner/i,
      /email.*quarantine/i,
    ],
    headers: ['x-quarantine', 'x-spam-quarantine'],
    confidence: 90,
  },
]

// AI Crawlers & Bots
export const AI_CRAWLER_PATTERNS: BotPattern[] = [
  {
    name: 'OpenAI',
    userAgentPatterns: [
      /openai/i,
      /openai.*bot/i,
      /gpt.*bot/i,
      /chatgpt/i,
    ],
    headers: ['x-openai'],
    confidence: 95,
  },
  {
    name: 'Anthropic Claude',
    userAgentPatterns: [
      /anthropic/i,
      /claude/i,
      /claude.*bot/i,
      /anthropic.*bot/i,
    ],
    headers: ['x-anthropic', 'x-claude'],
    confidence: 95,
  },
  {
    name: 'Perplexity',
    userAgentPatterns: [
      /perplexity/i,
      /perplexity.*bot/i,
    ],
    headers: ['x-perplexity'],
    confidence: 95,
  },
  {
    name: 'You.com',
    userAgentPatterns: [
      /you\.com/i,
      /youbot/i,
      /you.*crawler/i,
    ],
    headers: ['x-you-com'],
    confidence: 95,
  },
  {
    name: 'Bing AI',
    userAgentPatterns: [
      /bing.*ai/i,
      /bing.*bot/i,
      /msnbot.*ai/i,
    ],
    headers: ['x-bing-ai'],
    confidence: 90,
  },
  {
    name: 'Google AI',
    userAgentPatterns: [
      /google.*ai/i,
      /googlebot.*ai/i,
      /bard/i,
      /gemini/i,
    ],
    headers: ['x-google-ai'],
    confidence: 90,
  },
]

// Analysis & Debugging Tools
export const ANALYSIS_TOOL_PATTERNS: BotPattern[] = [
  {
    name: 'Security Analyzers',
    userAgentPatterns: [
      /analyzer/i,
      /security.*analyzer/i,
      /vulnerability.*scanner/i,
      /penetration.*test/i,
    ],
    headers: ['x-analyzer', 'x-security-analyzer'],
    confidence: 90,
  },
  {
    name: 'Debug Tools',
    userAgentPatterns: [
      /debug/i,
      /debugger/i,
      /test.*tool/i,
      /inspection.*tool/i,
    ],
    headers: ['x-debug', 'x-test', 'x-inspector'],
    confidence: 85,
  },
  {
    name: 'Web Scrapers',
    userAgentPatterns: [
      /scraper/i,
      /scrapy/i,
      /beautifulsoup/i,
      /selenium.*scraper/i,
    ],
    headers: [],
    confidence: 80,
  },
]

// Antivirus & Defender Tools
export const ANTIVIRUS_PATTERNS: BotPattern[] = [
  {
    name: 'Windows Defender',
    userAgentPatterns: [
      /windows.*defender/i,
      /microsoft.*defender/i,
      /defender.*scanner/i,
    ],
    headers: ['x-defender', 'x-windows-defender'],
    confidence: 90,
  },
  {
    name: 'Norton',
    userAgentPatterns: [
      /norton/i,
      /norton.*scanner/i,
      /symantec.*norton/i,
    ],
    headers: ['x-norton'],
    confidence: 90,
  },
  {
    name: 'Avast',
    userAgentPatterns: [
      /avast/i,
      /avast.*scanner/i,
    ],
    headers: ['x-avast'],
    confidence: 90,
  },
  {
    name: 'AVG',
    userAgentPatterns: [
      /avg/i,
      /avg.*scanner/i,
    ],
    headers: ['x-avg'],
    confidence: 90,
  },
  {
    name: 'ESET',
    userAgentPatterns: [
      /eset/i,
      /eset.*scanner/i,
    ],
    headers: ['x-eset'],
    confidence: 90,
  },
  {
    name: 'F-Secure',
    userAgentPatterns: [
      /f-secure/i,
      /fsecure/i,
      /f-secure.*scanner/i,
    ],
    headers: ['x-f-secure'],
    confidence: 90,
  },
]

// All patterns combined
export const ALL_BOT_PATTERNS: BotPattern[] = [
  ...EMAIL_SECURITY_PATTERNS,
  ...AI_CRAWLER_PATTERNS,
  ...ANALYSIS_TOOL_PATTERNS,
  ...ANTIVIRUS_PATTERNS,
]

// Check if request matches any bot pattern
export function detectBotPattern(
  userAgent: string,
  headers: Record<string, string | null>
): { detected: boolean; pattern?: BotPattern; confidence: number } {
  const ua = userAgent.toLowerCase()
  
  for (const pattern of ALL_BOT_PATTERNS) {
    // Check User-Agent
    for (const uaPattern of pattern.userAgentPatterns) {
      if (uaPattern.test(ua)) {
        // Check headers for additional confirmation
        let headerMatch = false
        if (pattern.headers.length > 0) {
          headerMatch = pattern.headers.some(h => headers[h.toLowerCase()] !== null)
        } else {
          headerMatch = true // If no headers specified, UA match is enough
        }
        
        if (headerMatch) {
          return {
            detected: true,
            pattern,
            confidence: pattern.confidence,
          }
        }
      }
    }
    
    // Check headers even if UA doesn't match
    if (pattern.headers.length > 0) {
      const headerMatch = pattern.headers.some(h => headers[h.toLowerCase()] !== null)
      if (headerMatch) {
        return {
          detected: true,
          pattern,
          confidence: pattern.confidence - 10, // Lower confidence if only header match
        }
      }
    }
  }
  
  return { detected: false, confidence: 0 }
}











