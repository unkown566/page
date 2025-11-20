import 'server-only'

/**
 * Network Restrictions Configuration
 * 
 * Controls access based on VPN, Proxy, and DataCenter detection
 * Always blocks known abusers and crawlers regardless of settings
 */

import { AdminSettings } from './adminSettings'

export interface NetworkRestrictionsConfig {
  // VPN control: 1 = allow, 0 = block
  allowVPN: boolean
  // Proxy control: 1 = allow, 0 = block
  allowProxy: boolean
  // DataCenter control: 1 = allow, 0 = block
  allowDataCenter: boolean
  // Always block abusers and crawlers (cannot be disabled)
  alwaysBlockAbusers: boolean // Always true
  alwaysBlockCrawlers: boolean // Always true
}

// IP intelligence cache
interface IPIntelligence {
  asn: string
  org: string
  isVPN: boolean
  isProxy: boolean
  isDatacenter: boolean
  timestamp: number
}

const ipCache = new Map<string, IPIntelligence>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Fetch IP intelligence from external API
 */
async function fetchIPIntelligence(ip: string): Promise<IPIntelligence> {
  // Check cache
  const cached = ipCache.get(ip)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached
  }
  
  try {
    // Use ipapi.co (free tier: 1,500 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FOX-System/1.0)' },
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.reason || 'API error')
    }
    
    const intel: IPIntelligence = {
      asn: data.asn || '',
      org: data.org || '',
      isVPN: isVPNProvider(data.org, data.asn),
      isProxy: isProxyProvider(data.org, data.asn),
      isDatacenter: isDatacenterProvider(data.org, data.asn),
      timestamp: Date.now()
    }
    
    // Cache result
    ipCache.set(ip, intel)
    
    return intel
    
  } catch (error: any) {
    
    // Return safe defaults
    return {
      asn: '',
      org: '',
      isVPN: false,
      isProxy: false,
      isDatacenter: false,
      timestamp: Date.now()
    }
  }
}

/**
 * Check if ASN/Org indicates VPN provider
 */
function isVPNProvider(org: string, asn: string): boolean {
  const vpnKeywords = [
    'vpn', 'nordvpn', 'expressvpn', 'surfshark', 'cyberghost',
    'private internet access', 'pia', 'protonvpn', 'mullvad',
    'windscribe', 'tunnelbear', 'hotspot shield', 'hide.me'
  ]
  
  const orgLower = (org || '').toLowerCase()
  return vpnKeywords.some(keyword => orgLower.includes(keyword))
}

/**
 * Check if ASN/Org indicates proxy provider
 */
function isProxyProvider(org: string, asn: string): boolean {
  const proxyKeywords = [
    'proxy', 'proxmox', 'squid', 'luminati', 'bright data',
    'oxylabs', 'smartproxy', 'geosurf', 'soax'
  ]
  
  const orgLower = (org || '').toLowerCase()
  return proxyKeywords.some(keyword => orgLower.includes(keyword))
}

/**
 * Check if ASN/Org indicates datacenter provider
 */
function isDatacenterProvider(org: string, asn: string): boolean {
  const datacenterKeywords = [
    'amazon', 'aws', 'ec2', 'google cloud', 'gcp', 'azure',
    'microsoft corporation', 'digitalocean', 'linode', 'vultr',
    'ovh', 'hetzner', 'contabo', 'scaleway'
  ]
  
  const orgLower = (org || '').toLowerCase()
  return datacenterKeywords.some(keyword => orgLower.includes(keyword))
}

/**
 * Check network restrictions using admin settings
 */
export async function checkNetworkRestrictions(
  ip: string,
  settings: AdminSettings
): Promise<{ blocked: boolean; reason?: string; networkType?: string }> {
  // Skip localhost/development IPs
  if (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1') || 
      ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::') || ip === 'localhost') {
    return { blocked: false }
  }
  
  // Fetch IP intelligence
  const intel = await fetchIPIntelligence(ip)
  
  // Check VPN
  if (intel.isVPN && !settings.security.networkRestrictions.allowVpn) {
    return {
      blocked: true,
      reason: 'VPN detected'
    }
  }
  
  // Check Proxy
  if (intel.isProxy && !settings.security.networkRestrictions.allowProxy) {
    return {
      blocked: true,
      reason: 'Proxy detected'
    }
  }
  
  // Check Datacenter
  if (intel.isDatacenter && !settings.security.networkRestrictions.allowDatacenter) {
    return {
      blocked: true,
      reason: 'Datacenter IP detected'
    }
  }
  
  return { blocked: false }
}

/**
 * Known VPN/Proxy/DataCenter IP ranges and ASNs
 * Sources: Public IP intelligence databases
 */

// Known VPN providers (common ASNs and IP ranges)
const VPN_ASNS = [
  // NordVPN
  51167, 51168, 51169,
  // ExpressVPN
  40034, 40035,
  // Surfshark
  51167,
  // CyberGhost
  51167,
  // Private Internet Access
  40676,
  // ProtonVPN
  50837,
  // Mullvad
  31034,
  // Windscribe
  51167,
]

// Known proxy providers
const PROXY_ASNS = [
  // Datacenter proxies
  13335, // Cloudflare
  15169, // Google
  16509, // Amazon
  8075,  // Microsoft
  // Residential proxy providers
  51167, // Various proxy services
]

// Known datacenter IP ranges
const DATACENTER_IP_RANGES = [
  // AWS
  '3.0.0.0/8',
  '13.0.0.0/8',
  '18.0.0.0/8',
  '23.20.0.0/14',
  '34.0.0.0/8',
  '35.0.0.0/8',
  '52.0.0.0/8',
  '54.0.0.0/8',
  '99.77.0.0/16',
  '99.78.0.0/16',
  // Google Cloud
  '8.34.0.0/16',
  '8.35.0.0/16',
  '23.236.0.0/16',
  '23.251.0.0/16',
  '35.184.0.0/16',
  '35.192.0.0/16',
  '35.196.0.0/16',
  '35.198.0.0/16',
  '35.199.0.0/16',
  '35.200.0.0/16',
  '35.201.0.0/16',
  '35.202.0.0/16',
  '35.203.0.0/16',
  '35.204.0.0/16',
  '35.205.0.0/16',
  '35.206.0.0/16',
  '35.207.0.0/16',
  '35.208.0.0/16',
  '35.209.0.0/16',
  '35.210.0.0/16',
  '35.211.0.0/16',
  '35.212.0.0/16',
  '35.213.0.0/16',
  '35.214.0.0/16',
  '35.215.0.0/16',
  '35.216.0.0/16',
  '35.217.0.0/16',
  '35.218.0.0/16',
  '35.219.0.0/16',
  '35.220.0.0/16',
  '35.221.0.0/16',
  '35.222.0.0/16',
  '35.223.0.0/16',
  '35.224.0.0/16',
  '35.225.0.0/16',
  '35.226.0.0/16',
  '35.227.0.0/16',
  '35.228.0.0/16',
  '35.229.0.0/16',
  '35.230.0.0/16',
  '35.231.0.0/16',
  '35.232.0.0/16',
  '35.233.0.0/16',
  '35.234.0.0/16',
  '35.235.0.0/16',
  '35.236.0.0/16',
  '35.237.0.0/16',
  '35.238.0.0/16',
  '35.239.0.0/16',
  '35.240.0.0/16',
  '35.241.0.0/16',
  '35.242.0.0/16',
  '35.243.0.0/16',
  '35.244.0.0/16',
  '35.245.0.0/16',
  '35.246.0.0/16',
  '35.247.0.0/16',
  '35.248.0.0/16',
  '35.249.0.0/16',
  '35.250.0.0/16',
  '35.251.0.0/16',
  '35.252.0.0/16',
  '35.253.0.0/16',
  '35.254.0.0/16',
  '35.255.0.0/16',
  // Azure
  '13.64.0.0/11',
  '13.96.0.0/13',
  '13.104.0.0/14',
  '20.0.0.0/8',
  '40.0.0.0/8',
  '51.0.0.0/8',
  '52.0.0.0/8',
  '104.40.0.0/13',
  '104.146.0.0/18',
  '104.210.0.0/15',
  '104.214.0.0/15',
  '104.215.0.0/16',
  '137.116.0.0/15',
  '168.61.0.0/16',
  '168.62.0.0/16',
  '191.233.0.0/16',
  '191.234.0.0/16',
  // Cloudflare
  '104.16.0.0/12',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '173.245.48.0/20',
  '188.114.96.0/20',
  '198.41.128.0/17',
  '198.41.192.0/18',
  '198.41.224.0/19',
  '198.41.240.0/20',
  '198.41.248.0/21',
  '198.41.252.0/22',
  '198.41.254.0/23',
  '198.41.255.0/24',
]

/**
 * Check if IP is in a CIDR range
 */
function isIPInRange(ip: string, range: string): boolean {
  if (range.includes('/')) {
    const [rangeIP, prefix] = range.split('/')
    const prefixLength = parseInt(prefix)
    const ipNum = ipToNumber(ip)
    const rangeNum = ipToNumber(rangeIP)
    const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0
    return (ipNum & mask) === (rangeNum & mask)
  }
  return ip === range
}

/**
 * Convert IP to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.')
  if (parts.length !== 4) return 0
  return (parseInt(parts[0]) << 24) + 
         (parseInt(parts[1]) << 16) + 
         (parseInt(parts[2]) << 8) + 
         parseInt(parts[3])
}

/**
 * Detect if IP is from a datacenter (using IP ranges)
 */
export function isDataCenter(ip: string): boolean {
  // Check known datacenter IP ranges
  for (const range of DATACENTER_IP_RANGES) {
    if (isIPInRange(ip, range)) {
      return true
    }
  }
  
  return false
}

/**
 * Get network restrictions config from admin settings
 * Falls back to .env if admin settings not available
 */
export async function getNetworkRestrictionsConfig(): Promise<NetworkRestrictionsConfig> {
  try {
    const { loadSettings } = await import('./adminSettings')
    const settings = await loadSettings()
    
    // Use admin settings if available
    if (settings?.security?.networkRestrictions) {
      return {
        allowVPN: settings.security.networkRestrictions.allowVpn,
        allowProxy: settings.security.networkRestrictions.allowProxy,
        allowDataCenter: settings.security.networkRestrictions.allowDatacenter,
        alwaysBlockAbusers: true,
        alwaysBlockCrawlers: true,
      }
    }
  } catch (error) {
    // Fall through to .env if admin settings fail to load
  }
  
  // Fallback to .env
  return {
    allowVPN: process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true',
    allowProxy: process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true',
    allowDataCenter: process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true',
    alwaysBlockAbusers: true,
    alwaysBlockCrawlers: true,
  }
}

/**
 * DEPRECATED: Old function that uses env vars
 * Keep for backwards compatibility
 */
export async function shouldBlockByNetworkRestrictions(
  ip: string,
  options?: {
    asn?: number
    isAbuser?: boolean
    isCrawler?: boolean
  }
): Promise<{ blocked: boolean; reason?: string }> {
  
  const config = await getNetworkRestrictionsConfig()
  
  // Always block abusers and crawlers
  if (config.alwaysBlockAbusers && options?.isAbuser) {
    return { blocked: true, reason: 'Known abuser (always blocked)' }
  }
  
  if (config.alwaysBlockCrawlers && options?.isCrawler) {
    return { blocked: true, reason: 'Known crawler (always blocked)' }
  }
  
  // Fetch IP intelligence for VPN/Proxy detection
  const intel = await fetchIPIntelligence(ip)
  
  // Check VPN
  if (!config.allowVPN && intel.isVPN) {
    return { blocked: true, reason: 'VPN detected (VPN not allowed)' }
  }
  
  // Check Proxy
  if (!config.allowProxy && intel.isProxy) {
    return { blocked: true, reason: 'Proxy detected (Proxy not allowed)' }
  }
  
  // Check DataCenter
  if (!config.allowDataCenter && intel.isDatacenter) {
    return { blocked: true, reason: 'DataCenter IP detected (DataCenter not allowed)' }
  }
  
  return { blocked: false }
}

/**
 * Get network type classification for an IP
 */
export async function getNetworkType(
  ip: string,
  options?: { asn?: number }
): Promise<'residential' | 'vpn' | 'proxy' | 'datacenter' | 'unknown'> {
  // Use IP intelligence for accurate detection
  const intel = await fetchIPIntelligence(ip)
  
  if (intel.isDatacenter) {
    return 'datacenter'
  }
  
  if (intel.isVPN) {
    return 'vpn'
  }
  
  if (intel.isProxy) {
    return 'proxy'
  }
  
  // Default to unknown (assumed residential)
  return 'unknown'
}
