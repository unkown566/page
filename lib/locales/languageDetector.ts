/**
 * Auto-detect language from visitor's IP location
 * Uses existing geo-location system
 */

import { Language } from './translations'

// Country code to language mapping
const countryToLanguage: Record<string, Language> = {
  // English-speaking countries
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
  
  // Japanese
  'JP': 'ja',
  
  // Korean
  'KR': 'ko',
  
  // German-speaking
  'DE': 'de', 'AT': 'de', 'CH': 'de',
  
  // Spanish-speaking
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es',
  'PE': 'es', 'VE': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es',
  'BO': 'es', 'DO': 'es', 'HN': 'es', 'PY': 'es', 'SV': 'es',
  'NI': 'es', 'CR': 'es', 'PA': 'es', 'UY': 'es', 'GQ': 'es',
  
  // Default for others
  'DEFAULT': 'en'
}

/**
 * Detect language from country code
 */
export function detectLanguageFromCountry(countryCode: string | null): Language {
  if (!countryCode) return 'en'
  
  const upperCode = countryCode.toUpperCase()
  return countryToLanguage[upperCode] || countryToLanguage['DEFAULT']
}

/**
 * Detect language from Accept-Language header (fallback)
 */
export function detectLanguageFromHeader(acceptLanguage: string | null): Language {
  if (!acceptLanguage) return 'en'
  
  const lang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
  
  switch (lang) {
    case 'ja': return 'ja'
    case 'ko': return 'ko'
    case 'de': return 'de'
    case 'es': return 'es'
    default: return 'en'
  }
}

/**
 * Get best language for visitor
 */
export async function getBestLanguage(
  request: Request,
  preferredLanguage?: Language | 'auto'
): Promise<Language> {
  // If specific language is set, use it
  if (preferredLanguage && preferredLanguage !== 'auto') {
    return preferredLanguage
  }
  
  // Auto-detect from IP (use existing geo-location)
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               request.headers.get('x-real-ip') ||
               '0.0.0.0'
    
    // Use existing geo-location service
    const geo = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await geo.json()
    
    if (data.country_code) {
      return detectLanguageFromCountry(data.country_code)
    }
  } catch (error) {
    // Fallback to Accept-Language header
    const acceptLanguage = request.headers.get('accept-language')
    return detectLanguageFromHeader(acceptLanguage)
  }
  
  return 'en'
}







