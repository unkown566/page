import { SupportedLanguage } from './templateTypes'

// Language to country code mapping
const LANGUAGE_COUNTRY_MAP: Record<string, SupportedLanguage> = {
  // Japanese
  'JP': 'ja',
  
  // Korean
  'KR': 'ko',
  
  // German
  'DE': 'de',
  'AT': 'de', // Austria
  'CH': 'de', // Switzerland (also speaks German)
  
  // Spanish
  'ES': 'es',
  'MX': 'es', // Mexico
  'AR': 'es', // Argentina
  'CO': 'es', // Colombia
  'CL': 'es', // Chile
  'PE': 'es', // Peru
  'VE': 'es', // Venezuela
  
  // English (fallback for others)
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
}

// Browser language detection
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language || (navigator as any).userLanguage
  const langCode = browserLang.split('-')[0].toLowerCase()
  
  const languageMap: Record<string, SupportedLanguage> = {
    'ja': 'ja',
    'ko': 'ko',
    'de': 'de',
    'es': 'es',
    'en': 'en',
  }
  
  return languageMap[langCode] || 'en'
}

// Detect language from IP (uses geolocation API)
export async function detectLanguageFromIP(ip: string): Promise<SupportedLanguage> {
  try {
    // Skip localhost
    if (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1')) {
      return 'en'
    }
    
    // Use ip-api.com for free geolocation with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        return 'en'
      }
      
      const data = await response.json()
      const countryCode = data.countryCode
      
      
      return LANGUAGE_COUNTRY_MAP[countryCode] || 'en'
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
      } else {
        throw fetchError
      }
      return 'en'
    }
  } catch (error) {
    return 'en'
  }
}

// Get language from Accept-Language header
export function detectLanguageFromHeader(acceptLanguage?: string): SupportedLanguage {
  if (!acceptLanguage) return 'en'
  
  // Parse Accept-Language header (e.g., "ja,en-US;q=0.9,en;q=0.8")
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, q] = lang.trim().split(';')
    return {
      code: code.split('-')[0].toLowerCase(),
      quality: q ? parseFloat(q.split('=')[1]) : 1.0,
    }
  })
  
  // Sort by quality
  languages.sort((a, b) => b.quality - a.quality)
  
  // Find first supported language
  for (const lang of languages) {
    if (lang.code === 'ja') return 'ja'
    if (lang.code === 'ko') return 'ko'
    if (lang.code === 'de') return 'de'
    if (lang.code === 'es') return 'es'
    if (lang.code === 'en') return 'en'
  }
  
  return 'en'
}

// Smart language detection (combines all methods)
export async function detectLanguage(
  ip: string,
  acceptLanguage?: string,
  browserLang?: SupportedLanguage
): Promise<SupportedLanguage> {
  // Priority 1: Browser language (client-side)
  if (browserLang) {
    return browserLang
  }
  
  // Priority 2: IP-based geolocation
  try {
    const ipLang = await detectLanguageFromIP(ip)
    if (ipLang !== 'en') {
      return ipLang
    }
  } catch (error) {
  }
  
  // Priority 3: Accept-Language header
  const headerLang = detectLanguageFromHeader(acceptLanguage)
  if (headerLang !== 'en') {
    return headerLang
  }
  
  // Fallback: English
  return 'en'
}




