// Latest Security Patterns (2024-2025) - Based on current AI, AV, Defender, Email Security updates

/**
 * Latest detection patterns from research:
 * - MultiPhishGuard (LLM-based multi-agent system)
 * - EvoMail (Self-evolving cognitive agents)
 * - INKY (AI + behavioral analysis)
 * - Latest Proofpoint, Mimecast, Barracuda updates
 * - Microsoft Defender 2024-2025 patterns
 * - Cloudflare Bot Management latest
 */

export interface LatestSecurityPattern {
  name: string
  type: 'ai' | 'email_security' | 'av' | 'defender' | 'firewall' | 'cloudflare'
  userAgentPatterns: RegExp[]
  headers: string[]
  behaviorPatterns: string[]
  evasionTechniques: string[]
  confidence: number
}

// Latest AI Security Tools (2024-2025)
export const LATEST_AI_PATTERNS: LatestSecurityPattern[] = [
  {
    name: 'MultiPhishGuard',
    type: 'ai',
    userAgentPatterns: [
      /multiphishguard/i,
      /llm.*agent/i,
      /multi.*agent.*phish/i,
    ],
    headers: ['x-multiphishguard', 'x-llm-agent'],
    behaviorPatterns: [
      'Multi-agent coordination',
      'LLM-based analysis',
      'Reinforcement learning',
    ],
    evasionTechniques: [
      'Vary content structure',
      'Avoid pattern repetition',
      'Use natural language variations',
    ],
    confidence: 95,
  },
  {
    name: 'EvoMail',
    type: 'ai',
    userAgentPatterns: [
      /evomail/i,
      /cognitive.*agent/i,
      /self-evolving/i,
    ],
    headers: ['x-evomail', 'x-cognitive-agent'],
    behaviorPatterns: [
      'Graph-based detection',
      'Unified email graph analysis',
      'Metadata fusion',
      'Coordinated campaign detection',
    ],
    evasionTechniques: [
      'Avoid coordinated patterns',
      'Vary metadata',
      'Randomize timestamps',
      'Use diverse content structures',
    ],
    confidence: 95,
  },
  {
    name: 'INKY',
    type: 'ai',
    userAgentPatterns: [
      /inky/i,
      /kaseya.*inky/i,
      /generative.*ai.*security/i,
    ],
    headers: ['x-inky', 'x-kaseya-inky'],
    behaviorPatterns: [
      'Generative AI analysis',
      'Behavioral analysis',
      'Phishing pattern detection',
    ],
    evasionTechniques: [
      'Mimic legitimate user behavior',
      'Use natural language',
      'Avoid phishing indicators',
    ],
    confidence: 95,
  },
]

// Latest Email Security Updates (2024-2025)
export const LATEST_EMAIL_SECURITY_PATTERNS: LatestSecurityPattern[] = [
  {
    name: 'Proofpoint 2024-2025',
    type: 'email_security',
    userAgentPatterns: [
      /proofpoint.*2024/i,
      /proofpoint.*2025/i,
      /proofpoint.*ai/i,
      /pptext.*v2/i,
    ],
    headers: [
      'x-proofpoint-2024',
      'x-proofpoint-ai',
      'x-proofpoint-enhanced',
    ],
    behaviorPatterns: [
      'Enhanced AI detection',
      'Behavioral analysis',
      'Real-time threat intelligence',
    ],
    evasionTechniques: [
      'Appear as legitimate email',
      'Use proper headers',
      'Avoid suspicious patterns',
    ],
    confidence: 95,
  },
  {
    name: 'Mimecast 2024-2025',
    type: 'email_security',
    userAgentPatterns: [
      /mimecast.*2024/i,
      /mimecast.*2025/i,
      /mimecast.*enhanced/i,
    ],
    headers: [
      'x-mimecast-2024',
      'x-mimecast-enhanced',
      'x-mimecast-ai',
    ],
    behaviorPatterns: [
      'AI-powered scanning',
      'Advanced threat detection',
      'Real-time analysis',
    ],
    evasionTechniques: [
      'Legitimate email structure',
      'Proper authentication',
      'Clean metadata',
    ],
    confidence: 95,
  },
  {
    name: 'Libraesva ESG',
    type: 'email_security',
    userAgentPatterns: [
      /libraseva/i,
      /libraesva/i,
      /esg.*platform/i,
    ],
    headers: ['x-libraseva', 'x-esg'],
    behaviorPatterns: [
      'Command injection detection',
      'State-sponsored actor patterns',
      'Advanced threat detection',
    ],
    evasionTechniques: [
      'Avoid command patterns',
      'Clean code execution',
      'Proper sanitization',
    ],
    confidence: 90,
  },
]

// Latest Antivirus & Defender Patterns (2024-2025)
export const LATEST_AV_PATTERNS: LatestSecurityPattern[] = [
  {
    name: 'Microsoft Defender 2024-2025',
    type: 'defender',
    userAgentPatterns: [
      /microsoft.*defender.*2024/i,
      /microsoft.*defender.*2025/i,
      /windows.*defender.*enhanced/i,
      /defender.*ai/i,
    ],
    headers: [
      'x-defender-2024',
      'x-defender-ai',
      'x-microsoft-defender-enhanced',
    ],
    behaviorPatterns: [
      'AI-powered scanning',
      'Behavioral analysis',
      'Real-time protection',
      'Cloud-based detection',
    ],
    evasionTechniques: [
      'Legitimate file structure',
      'Clean code',
      'Proper signatures',
    ],
    confidence: 95,
  },
  {
    name: 'Windows Defender Advanced Threat Protection',
    type: 'defender',
    userAgentPatterns: [
      /defender.*atp/i,
      /microsoft.*atp/i,
      /windows.*atp/i,
    ],
    headers: ['x-defender-atp', 'x-microsoft-atp'],
    behaviorPatterns: [
      'Advanced threat detection',
      'Behavioral monitoring',
      'Endpoint protection',
    ],
    evasionTechniques: [
      'Normal behavior patterns',
      'Legitimate system calls',
    ],
    confidence: 95,
  },
]

// Latest Cloudflare Bot Management (2024-2025)
export const LATEST_CLOUDFLARE_PATTERNS: LatestSecurityPattern[] = [
  {
    name: 'Cloudflare Bot Management 2024-2025',
    type: 'cloudflare',
    userAgentPatterns: [],
    headers: [
      'cf-bot-score',
      'cf-verified-bot',
      'cf-automated-tool',
      'cf-likely-bot',
      'cf-ray',
      'cf-ipcountry',
    ],
    behaviorPatterns: [
      'Machine learning detection',
      'Behavioral fingerprinting',
      'JA3 fingerprinting',
      'TLS fingerprinting',
      'Browser fingerprinting',
    ],
    evasionTechniques: [
      'Mimic legitimate browser',
      'Proper TLS handshake',
      'Real browser fingerprints',
      'Natural timing patterns',
    ],
    confidence: 95,
  },
]

// All latest patterns combined
export const ALL_LATEST_PATTERNS: LatestSecurityPattern[] = [
  ...LATEST_AI_PATTERNS,
  ...LATEST_EMAIL_SECURITY_PATTERNS,
  ...LATEST_AV_PATTERNS,
  ...LATEST_CLOUDFLARE_PATTERNS,
]

/**
 * Detect latest security tool patterns
 */
export function detectLatestSecurityPattern(
  userAgent: string,
  headers: Record<string, string | null>
): { detected: boolean; pattern?: LatestSecurityPattern; confidence: number } {
  const ua = userAgent.toLowerCase()
  
  for (const pattern of ALL_LATEST_PATTERNS) {
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
    
    // Check headers even if UA doesn't match
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

/**
 * Get evasion techniques for detected pattern
 */
export function getEvasionTechniques(pattern: LatestSecurityPattern): string[] {
  return pattern.evasionTechniques
}






