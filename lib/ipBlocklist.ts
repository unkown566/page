// IP Blocklist System - Known bot/scanner IPs and auto-ban functionality

export interface BlockedIP {
  ip: string
  reason: string
  timestamp: number
  permanent: boolean
}

// Known bot/scanner IP ranges and addresses
// Sources: Research, security databases, known scanner patterns

// Email Security Scanner IP Ranges
const EMAIL_SECURITY_SCANNER_IPS = [
  // Proofpoint
  '104.16.0.0/12',
  '104.244.0.0/16',
  '141.193.0.0/16',
  '192.168.0.0/16', // Internal networks (often used by scanners)
  
  // Mimecast
  '185.12.0.0/16',
  '185.13.0.0/16',
  
  // Barracuda
  '66.171.0.0/16',
  '72.5.0.0/16',
  
  // Forcepoint
  '204.80.0.0/16',
  
  // Symantec
  '216.32.0.0/16',
  '216.33.0.0/16',
  
  // Trend Micro
  '203.0.0.0/16',
  
  // VirusTotal and security services
  '104.16.0.0/12',
  '104.244.0.0/16',
  
  // Known datacenter IPs (often used by scanners)
  '35.0.0.0/8', // Google Cloud
  '34.0.0.0/8', // Google Cloud
  '54.0.0.0/8', // AWS
  '52.0.0.0/8', // AWS
  '40.0.0.0/8', // Azure
  '13.0.0.0/8', // Azure
  '104.0.0.0/8', // Cloudflare (some scanners)
  '216.0.0.0/8', // Various security services
]

// Known bot/scanner IP addresses (specific)
const KNOWN_BOT_IPS = [
  // Common scanner IPs
  '127.0.0.1', // Localhost (if used by scanners)
  '::1', // IPv6 localhost
  
  // Add more specific IPs here as discovered
]

// Asia-specific scanner IP ranges (2024-2025)
const ASIA_SCANNER_IP_RANGES = [
  // Japan (JP)
  '202.0.0.0/8', // Japan IP ranges (some used by scanners)
  '203.0.0.0/8', // Japan IP ranges
  '210.0.0.0/8', // Japan IP ranges
  
  // Korea (KR)
  '175.0.0.0/8', // Korea IP ranges
  '211.0.0.0/8', // Korea IP ranges
  
  // China (CN)
  '1.0.0.0/8', // China IP ranges
  '14.0.0.0/8', // China IP ranges
  '27.0.0.0/8', // China IP ranges
  '36.0.0.0/8', // China IP ranges
  '39.0.0.0/8', // China IP ranges
  '42.0.0.0/8', // China IP ranges
  '49.0.0.0/8', // China IP ranges
  '58.0.0.0/8', // China IP ranges
  '59.0.0.0/8', // China IP ranges
  '60.0.0.0/8', // China IP ranges
  '61.0.0.0/8', // China IP ranges
  '101.0.0.0/8', // China IP ranges
  '103.0.0.0/8', // China IP ranges
  '106.0.0.0/8', // China IP ranges
  '110.0.0.0/8', // China IP ranges
  '111.0.0.0/8', // China IP ranges
  '112.0.0.0/8', // China IP ranges
  '113.0.0.0/8', // China IP ranges
  '114.0.0.0/8', // China IP ranges
  '115.0.0.0/8', // China IP ranges
  '116.0.0.0/8', // China IP ranges
  '117.0.0.0/8', // China IP ranges
  '118.0.0.0/8', // China IP ranges
  '119.0.0.0/8', // China IP ranges
  '120.0.0.0/8', // China IP ranges
  '121.0.0.0/8', // China IP ranges
  '122.0.0.0/8', // China IP ranges
  '123.0.0.0/8', // China IP ranges
  '124.0.0.0/8', // China IP ranges
  '125.0.0.0/8', // China IP ranges
  '171.0.0.0/8', // China IP ranges
  '180.0.0.0/8', // China IP ranges
  '182.0.0.0/8', // China IP ranges
  '183.0.0.0/8', // China IP ranges
  '202.0.0.0/8', // China IP ranges
  '218.0.0.0/8', // China IP ranges
  '219.0.0.0/8', // China IP ranges
  '220.0.0.0/8', // China IP ranges
  '221.0.0.0/8', // China IP ranges
  '222.0.0.0/8', // China IP ranges
  '223.0.0.0/8', // China IP ranges
  
  // Singapore (SG)
  '165.0.0.0/8', // Singapore IP ranges
  
  // Taiwan (TW)
  '1.160.0.0/12', // Taiwan IP ranges
  '1.200.0.0/12', // Taiwan IP ranges
  
  // Hong Kong (HK)
  '1.32.0.0/12', // Hong Kong IP ranges
  '14.0.0.0/8', // Hong Kong IP ranges (some)
  '27.0.0.0/8', // Hong Kong IP ranges (some)
  '43.0.0.0/8', // Hong Kong IP ranges
  '103.0.0.0/8', // Hong Kong IP ranges (some)
]

// AI Crawler IP Ranges
const AI_CRAWLER_IPS: string[] = [
  // OpenAI (if known)
  // Anthropic (if known)
  // Add as discovered
]

// In-memory blocklist (in production, use Redis or database)
let blockedIPs: Map<string, BlockedIP> = new Map()

// Initialize with known IPs
export function initializeBlocklist() {
  // Add known bot IPs
  KNOWN_BOT_IPS.forEach(ip => {
    blockedIPs.set(ip, {
      ip,
      reason: 'Known bot/scanner IP',
      timestamp: Date.now(),
      permanent: true,
    })
  })
}

// Check if IP is in a blocked range
function isIPInRange(ip: string, range: string): boolean {
  if (range.includes('/')) {
    // CIDR notation
    const [rangeIP, prefix] = range.split('/')
    const prefixLength = parseInt(prefix)
    const ipNum = ipToNumber(ip)
    const rangeNum = ipToNumber(rangeIP)
    const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0
    return (ipNum & mask) === (rangeNum & mask)
  }
  return ip === range
}

// Convert IP to number
function ipToNumber(ip: string): number {
  const parts = ip.split('.')
  return (parseInt(parts[0]) << 24) + 
         (parseInt(parts[1]) << 16) + 
         (parseInt(parts[2]) << 8) + 
         parseInt(parts[3])
}

// Check if IP is blocked
export function isIPBlocked(ip: string): boolean {
  // Whitelist localhost in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' && 
                        process.env.VERCEL_ENV !== 'production'
  if (isDevelopment) {
    // Allow localhost IPs in development
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('::ffff:127.')) {
      return false
    }
  }
  
  // Check exact match
  if (blockedIPs.has(ip)) {
    const block = blockedIPs.get(ip)!
    // Check if temporary ban expired
    if (!block.permanent && Date.now() - block.timestamp > 24 * 60 * 60 * 1000) {
      // 24 hour temporary ban expired
      blockedIPs.delete(ip)
      return false
    }
    return true
  }
  
  // Check IP ranges
  for (const range of EMAIL_SECURITY_SCANNER_IPS) {
    if (isIPInRange(ip, range)) {
      return true
    }
  }
  
  for (const range of AI_CRAWLER_IPS) {
    if (isIPInRange(ip, range)) {
      return true
    }
  }
  
  // Check Asia-specific scanner IP ranges
  for (const range of ASIA_SCANNER_IP_RANGES) {
    if (isIPInRange(ip, range)) {
      return true
    }
  }
  
  return false
}

// Get block reason
export function getBlockReason(ip: string): string | null {
  if (blockedIPs.has(ip)) {
    return blockedIPs.get(ip)!.reason
  }
  
  // Check ranges
  for (const range of EMAIL_SECURITY_SCANNER_IPS) {
    if (isIPInRange(ip, range)) {
      return `Email security scanner IP range: ${range}`
    }
  }
  
  for (const range of AI_CRAWLER_IPS) {
    if (isIPInRange(ip, range)) {
      return `AI crawler IP range: ${range}`
    }
  }
  
  return null
}

// Auto-ban IP (temporary or permanent)
export function banIP(ip: string, reason: string, permanent: boolean = false): void {
  blockedIPs.set(ip, {
    ip,
    reason,
    timestamp: Date.now(),
    permanent,
  })
}

// Unban IP
export function unbanIP(ip: string): void {
  blockedIPs.delete(ip)
}

// Get all blocked IPs
export function getAllBlockedIPs(): BlockedIP[] {
  return Array.from(blockedIPs.values())
}

// Check if IP matches any known bot pattern
export function isKnownBotIP(ip: string): boolean {
  // Check exact matches
  if (KNOWN_BOT_IPS.includes(ip)) {
    return true
  }
  
  // Check ranges
  for (const range of EMAIL_SECURITY_SCANNER_IPS) {
    if (isIPInRange(ip, range)) {
      return true
    }
  }
  
  for (const range of AI_CRAWLER_IPS) {
    if (isIPInRange(ip, range)) {
      return true
    }
  }
  
  return false
}

// Initialize on module load
initializeBlocklist()

