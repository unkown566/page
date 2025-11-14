// Real IP geolocation using ipapi.co (free tier: 1,500 requests/day)
import { GeoData } from './visitorTracker'

// Cache geo lookups to avoid rate limiting
const geoCache = new Map<string, GeoData>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function getGeoData(ip: string): Promise<GeoData> {
  // Normalize IPv6 localhost formats (::ffff:127.0.0.1 → 127.0.0.1)
  const normalizedIP = ip
    .replace('::ffff:', '')
    .replace('::1', '127.0.0.1')
    .trim()
  
  // Handle localhost/private IPs
  if (
    normalizedIP === '127.0.0.1' ||
    normalizedIP === 'localhost' ||
    normalizedIP === 'unknown' ||
    normalizedIP.startsWith('192.168.') ||
    normalizedIP.startsWith('10.') ||
    normalizedIP.startsWith('172.16.') ||
    normalizedIP.startsWith('172.17.') ||
    normalizedIP.startsWith('172.18.') ||
    normalizedIP.startsWith('172.19.') ||
    normalizedIP.startsWith('172.20.') ||
    normalizedIP.startsWith('172.21.') ||
    normalizedIP.startsWith('172.22.') ||
    normalizedIP.startsWith('172.23.') ||
    normalizedIP.startsWith('172.24.') ||
    normalizedIP.startsWith('172.25.') ||
    normalizedIP.startsWith('172.26.') ||
    normalizedIP.startsWith('172.27.') ||
    normalizedIP.startsWith('172.28.') ||
    normalizedIP.startsWith('172.29.') ||
    normalizedIP.startsWith('172.30.') ||
    normalizedIP.startsWith('172.31.') ||
    normalizedIP.startsWith('fe80:')
  ) {
    return {
      country: 'Local',
      city: 'Development'
    }
  }
  
  // Check cache
  const cached = geoCache.get(normalizedIP)
  if (cached) {
    return cached
  }
  
  try {
    // Use ipapi.co (free tier: 1,500 requests/day, no API key required)
    const response = await fetch(`https://ipapi.co/${normalizedIP}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FOX-System/1.0)'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    // Handle API errors
    if (data.error) {
      throw new Error(data.reason || 'API error')
    }
    
    const geoData: GeoData = {
      country: data.country_name || data.country || 'Unknown',
      city: data.city || 'Unknown'
    }
    
    // Cache for 24 hours
    geoCache.set(normalizedIP, geoData)
    setTimeout(() => geoCache.delete(normalizedIP), CACHE_DURATION)
    
    return geoData
    
  } catch (error) {
    
    // Fallback: Return unknown
    const fallback: GeoData = {
      country: 'Unknown',
      city: 'Unknown'
    }
    
    // Cache failures briefly (5 minutes) to avoid hammering API
    geoCache.set(normalizedIP, fallback)
    setTimeout(() => geoCache.delete(normalizedIP), 5 * 60 * 1000)
    
    return fallback
  }
}

