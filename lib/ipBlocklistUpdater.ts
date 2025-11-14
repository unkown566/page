// IP Blocklist Updater - Fetches updated IP lists from multiple sources
// Sources: Fraudlogix, MyIP.ms, CrowdSec, Spamhaus, ThreatPoint

export interface IPBlocklistSource {
  name: string
  url: string
  format: 'text' | 'json' | 'csv'
  updateInterval: number // hours
  lastUpdate?: number
}

// Updated IP blocklist sources (2024-2025)
export const IP_BLOCKLIST_SOURCES: IPBlocklistSource[] = [
  {
    name: 'Fraudlogix',
    url: 'https://fraudlogix.com/api/blocklist', // Update with actual API endpoint
    format: 'json',
    updateInterval: 1, // Hourly updates
  },
  {
    name: 'MyIP.ms',
    url: 'https://myip.ms/files/blacklist/blacklist.txt',
    format: 'text',
    updateInterval: 24, // Daily updates
  },
  {
    name: 'CrowdSec',
    url: 'https://blocklist.crowdsec.net/list', // Update with actual endpoint
    format: 'text',
    updateInterval: 1, // Hourly updates (5% daily rotation)
  },
  {
    name: 'Spamhaus Botnet Controller List',
    url: 'https://www.spamhaus.org/drop/botnet-controller-list.txt',
    format: 'text',
    updateInterval: 24, // Daily updates
  },
  {
    name: 'ThreatPoint Bot List',
    url: 'https://threatpoint.co.uk/api/bots', // Update with actual API endpoint
    format: 'json',
    updateInterval: 1, // Hourly updates
  },
]

// Cache for fetched IPs
let cachedIPs: Set<string> = new Set()
let lastCacheUpdate: number = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Fetch IP blocklist from a source
 */
async function fetchBlocklist(source: IPBlocklistSource): Promise<string[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': source.format === 'json' ? 'application/json' : 'text/plain',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return []
    }

    const text = await response.text()
    
    if (source.format === 'json') {
      const data = JSON.parse(text)
      // Extract IPs from JSON (structure varies by source)
      return extractIPsFromJSON(data)
    } else {
      // Text format - parse line by line
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && isValidIP(line))
    }
  } catch (error) {
    return []
  }
}

/**
 * Extract IPs from JSON response (structure varies by source)
 */
function extractIPsFromJSON(data: any): string[] {
  const ips: string[] = []
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (typeof item === 'string' && isValidIP(item)) {
        ips.push(item)
      } else if (item.ip && isValidIP(item.ip)) {
        ips.push(item.ip)
      } else if (item.address && isValidIP(item.address)) {
        ips.push(item.address)
      }
    })
  } else if (data.ips && Array.isArray(data.ips)) {
    data.ips.forEach((ip: string) => {
      if (isValidIP(ip)) ips.push(ip)
    })
  } else if (data.blocklist && Array.isArray(data.blocklist)) {
    data.blocklist.forEach((ip: string) => {
      if (isValidIP(ip)) ips.push(ip)
    })
  }
  
  return ips
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  
  if (ipv6Regex.test(ip)) {
    return true
  }
  
  // CIDR notation
  if (ip.includes('/')) {
    const [ipPart] = ip.split('/')
    return isValidIP(ipPart)
  }
  
  return false
}

/**
 * Update IP blocklist from all sources
 */
export async function updateIPBlocklist(): Promise<string[]> {
  const allIPs: Set<string> = new Set()
  
  // Fetch from all sources in parallel
  const fetchPromises = IP_BLOCKLIST_SOURCES.map(source => fetchBlocklist(source))
  const results = await Promise.allSettled(fetchPromises)
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      result.value.forEach(ip => allIPs.add(ip))
      IP_BLOCKLIST_SOURCES[index].lastUpdate = Date.now()
    }
  })
  
  // Update cache
  cachedIPs = allIPs
  lastCacheUpdate = Date.now()
  
  return Array.from(allIPs)
}

/**
 * Get cached IPs (with auto-refresh if stale)
 */
export async function getUpdatedBlocklist(): Promise<string[]> {
  const now = Date.now()
  const cacheAge = now - lastCacheUpdate
  
  // Refresh if cache is stale (older than 1 hour)
  if (cacheAge > CACHE_TTL || cachedIPs.size === 0) {
    return await updateIPBlocklist()
  }
  
  return Array.from(cachedIPs)
}

/**
 * Check if IP should be blocked (from updated lists)
 */
export async function isIPInUpdatedBlocklist(ip: string): Promise<boolean> {
  const blocklist = await getUpdatedBlocklist()
  
  // Check exact match
  if (blocklist.includes(ip)) {
    return true
  }
  
  // Check CIDR ranges
  for (const entry of blocklist) {
    if (entry.includes('/')) {
      if (isIPInCIDR(ip, entry)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [rangeIP, prefix] = cidr.split('/')
  const prefixLength = parseInt(prefix, 10)
  
  if (isNaN(prefixLength)) return false
  
  const ipNum = ipToNumber(ip)
  const rangeNum = ipToNumber(rangeIP)
  const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0
  
  return (ipNum & mask) === (rangeNum & mask)
}

/**
 * Convert IP to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.')
  return (parseInt(parts[0], 10) << 24) +
         (parseInt(parts[1], 10) << 16) +
         (parseInt(parts[2], 10) << 8) +
         parseInt(parts[3], 10)
}






