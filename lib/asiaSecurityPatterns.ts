// Asia-Specific Security Patterns (2024-2025)
// Focus: Japan, Korea, China, Singapore, Taiwan, Hong Kong

export interface AsiaSecurityPattern {
  name: string
  country: string[]
  type: 'email_security' | 'av' | 'defender' | 'firewall' | 'spam_filter'
  userAgentPatterns: RegExp[]
  headers: string[]
  evasionTechniques: string[]
  confidence: number
}

// Asia-Specific Email Security Tools
export const ASIA_EMAIL_SECURITY_PATTERNS: AsiaSecurityPattern[] = [
  {
    name: 'Trend Micro Email Security (Asia)',
    country: ['JP', 'KR', 'CN', 'SG', 'TW', 'HK'],
    type: 'email_security',
    userAgentPatterns: [
      /trendmicro.*asia/i,
      /trendmicro.*jp/i,
      /trendmicro.*korea/i,
      /trend.*security.*asia/i,
      /intercan/i, // Trend Micro product
    ],
    headers: [
      'x-trendmicro-asia',
      'x-trendmicro-jp',
      'x-intercan',
      'x-trend-security',
    ],
    evasionTechniques: [
      'Clean email structure',
      'Proper encoding',
      'Avoid suspicious patterns',
      'Legitimate headers',
    ],
    confidence: 95,
  },
  {
    name: 'Kaspersky Asia',
    country: ['JP', 'KR', 'CN', 'SG', 'TW', 'HK'],
    type: 'email_security',
    userAgentPatterns: [
      /kaspersky.*asia/i,
      /kaspersky.*jp/i,
      /kaspersky.*korea/i,
      /kaspersky.*security.*mail/i,
    ],
    headers: [
      'x-kaspersky-asia',
      'x-kaspersky-mail',
      'x-kaspersky-security',
    ],
    evasionTechniques: [
      'Normal email patterns',
      'Clean content',
      'Proper authentication',
    ],
    confidence: 95,
  },
  {
    name: 'Symantec Asia (Broadcom)',
    country: ['JP', 'KR', 'CN', 'SG', 'TW', 'HK'],
    type: 'email_security',
    userAgentPatterns: [
      /symantec.*asia/i,
      /symantec.*jp/i,
      /broadcom.*email/i,
      /messagelabs.*asia/i,
    ],
    headers: [
      'x-symantec-asia',
      'x-broadcom-email',
      'x-messagelabs-asia',
    ],
    evasionTechniques: [
      'Legitimate email format',
      'Proper metadata',
      'Clean HTML',
    ],
    confidence: 95,
  },
  {
    name: 'Fortinet Asia',
    country: ['JP', 'KR', 'CN', 'SG', 'TW', 'HK'],
    type: 'email_security',
    userAgentPatterns: [
      /fortinet.*asia/i,
      /fortigate.*asia/i,
      /fortimail/i,
      /fortinet.*email/i,
    ],
    headers: [
      'x-fortinet-asia',
      'x-fortigate-asia',
      'x-fortimail',
    ],
    evasionTechniques: [
      'Standard email headers',
      'Clean structure',
      'Avoid patterns',
    ],
    confidence: 95,
  },
  {
    name: 'Samsung Email Security (Korea)',
    country: ['KR'],
    type: 'email_security',
    userAgentPatterns: [
      /samsung.*email.*security/i,
      /samsung.*spam.*filter/i,
      /samsung.*defender/i,
    ],
    headers: [
      'x-samsung-email',
      'x-samsung-security',
    ],
    evasionTechniques: [
      'Korean email standards',
      'Clean formatting',
    ],
    confidence: 90,
  },
  {
    name: 'NEC Email Security (Japan)',
    country: ['JP'],
    type: 'email_security',
    userAgentPatterns: [
      /nec.*email/i,
      /nec.*security/i,
      /nec.*spam/i,
    ],
    headers: [
      'x-nec-email',
      'x-nec-security',
    ],
    evasionTechniques: [
      'Japanese email format',
      'Proper encoding',
    ],
    confidence: 90,
  },
  {
    name: 'Tencent Email Security (China)',
    country: ['CN', 'HK'],
    type: 'email_security',
    userAgentPatterns: [
      /tencent.*email/i,
      /tencent.*security/i,
      /qq.*mail.*security/i,
      /foxmail.*security/i,
    ],
    headers: [
      'x-tencent-email',
      'x-qq-mail-security',
      'x-foxmail-security',
    ],
    evasionTechniques: [
      'Chinese email standards',
      'Proper UTF-8 encoding',
      'Clean structure',
    ],
    confidence: 95,
  },
  {
    name: 'Alibaba Cloud Email Security (China)',
    country: ['CN', 'HK', 'SG'],
    type: 'email_security',
    userAgentPatterns: [
      /alibaba.*email/i,
      /aliyun.*mail/i,
      /alibaba.*security/i,
    ],
    headers: [
      'x-alibaba-email',
      'x-aliyun-mail',
    ],
    evasionTechniques: [
      'Cloud email standards',
      'Proper authentication',
    ],
    confidence: 95,
  },
  {
    name: 'Microsoft Defender Asia',
    country: ['JP', 'KR', 'CN', 'SG', 'TW', 'HK'],
    type: 'defender',
    userAgentPatterns: [
      /microsoft.*defender.*asia/i,
      /windows.*defender.*jp/i,
      /defender.*korea/i,
    ],
    headers: [
      'x-defender-asia',
      'x-ms-defender-jp',
    ],
    evasionTechniques: [
      'Legitimate Windows patterns',
      'Clean code',
    ],
    confidence: 95,
  },
]

// Asia-Specific Spam Filters
export const ASIA_SPAM_FILTER_PATTERNS: AsiaSecurityPattern[] = [
  {
    name: 'Japan Spam Filter',
    country: ['JP'],
    type: 'spam_filter',
    userAgentPatterns: [
      /japan.*spam/i,
      /jp.*spam.*filter/i,
      /japan.*mail.*filter/i,
    ],
    headers: [
      'x-japan-spam',
      'x-jp-filter',
    ],
    evasionTechniques: [
      'Japanese email format',
      'Proper encoding (UTF-8)',
      'Clean structure',
    ],
    confidence: 85,
  },
  {
    name: 'Korea Spam Filter',
    country: ['KR'],
    type: 'spam_filter',
    userAgentPatterns: [
      /korea.*spam/i,
      /kr.*spam.*filter/i,
      /korean.*mail.*filter/i,
    ],
    headers: [
      'x-korea-spam',
      'x-kr-filter',
    ],
    evasionTechniques: [
      'Korean email format',
      'EUC-KR or UTF-8 encoding',
      'Clean structure',
    ],
    confidence: 85,
  },
  {
    name: 'China Spam Filter',
    country: ['CN', 'HK'],
    type: 'spam_filter',
    userAgentPatterns: [
      /china.*spam/i,
      /cn.*spam.*filter/i,
      /chinese.*mail.*filter/i,
    ],
    headers: [
      'x-china-spam',
      'x-cn-filter',
    ],
    evasionTechniques: [
      'Chinese email format',
      'GB2312/GBK/UTF-8 encoding',
      'Clean structure',
    ],
    confidence: 85,
  },
]

// All Asia patterns
export const ALL_ASIA_PATTERNS: AsiaSecurityPattern[] = [
  ...ASIA_EMAIL_SECURITY_PATTERNS,
  ...ASIA_SPAM_FILTER_PATTERNS,
]

/**
 * Detect Asia-specific security patterns
 */
export function detectAsiaSecurityPattern(
  userAgent: string,
  headers: Record<string, string | null>,
  countryCode?: string
): { detected: boolean; pattern?: AsiaSecurityPattern; confidence: number } {
  const ua = userAgent.toLowerCase()
  
  for (const pattern of ALL_ASIA_PATTERNS) {
    // Filter by country if provided
    if (countryCode && !pattern.country.includes(countryCode.toUpperCase())) {
      continue
    }
    
    // Check User-Agent
    for (const uaPattern of pattern.userAgentPatterns) {
      if (uaPattern.test(ua)) {
        // Check headers
        const hasHeader = pattern.headers.some(h => headers[h.toLowerCase()] !== null)
        if (hasHeader || pattern.headers.length === 0) {
          return {
            detected: true,
            pattern,
            confidence: pattern.confidence,
          }
        }
      }
    }
    
    // Check headers
    if (pattern.headers.length > 0) {
      const hasHeader = pattern.headers.some(h => headers[h.toLowerCase()] !== null)
      if (hasHeader) {
        return {
          detected: true,
          pattern,
          confidence: pattern.confidence - 10,
        }
      }
    }
  }
  
  return { detected: false, confidence: 0 }
}
