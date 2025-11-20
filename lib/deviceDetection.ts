/**
 * Device Detection Utility
 * Detects device type from User-Agent string
 */

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'

export interface DeviceDetectionResult {
  type: DeviceType
  platform: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

/**
 * Detect device type from User-Agent
 */
export function detectDeviceType(userAgent: string): DeviceDetectionResult {
  const ua = userAgent.toLowerCase()
  
  // Tablet detection (must come before mobile)
  const tabletPatterns = [
    /ipad/i,
    /android(?!.*mobile)/i,
    /tablet/i,
    /playbook/i,
    /kindle/i,
    /silk/i,
    /windows.*touch/i,
  ]
  
  const isTablet = tabletPatterns.some(pattern => pattern.test(ua))
  
  // Mobile detection
  const mobilePatterns = [
    /mobile/i,
    /android/i,
    /iphone/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /opera mini/i,
    /iemobile/i,
    /palm/i,
    /smartphone/i,
  ]
  
  const isMobile = !isTablet && mobilePatterns.some(pattern => pattern.test(ua))
  
  // Desktop detection
  const desktopPatterns = [
    /windows/i,
    /macintosh/i,
    /mac os/i,
    /linux/i,
    /x11/i,
    /unix/i,
  ]
  
  const isDesktop = !isTablet && !isMobile && desktopPatterns.some(pattern => pattern.test(ua))
  
  // Platform detection
  let platform = 'unknown'
  if (ua.includes('windows')) platform = 'Windows'
  else if (ua.includes('mac') || ua.includes('macintosh')) platform = 'Mac'
  else if (ua.includes('linux')) platform = 'Linux'
  else if (ua.includes('iphone') || ua.includes('ipad')) platform = 'iOS'
  else if (ua.includes('android')) platform = 'Android'
  
  // Determine device type
  let type: DeviceType = 'unknown'
  if (isTablet) type = 'tablet'
  else if (isMobile) type = 'mobile'
  else if (isDesktop) type = 'desktop'
  
  return {
    type,
    platform,
    isMobile,
    isTablet,
    isDesktop,
  }
}

/**
 * Check if device is allowed based on settings
 * Default behavior: allow all devices if settings are not explicitly set to false
 */
export function isDeviceAllowed(
  userAgent: string,
  settings: {
    allowDesktop?: boolean
    allowMobile?: boolean
    allowTablet?: boolean
  }
): { allowed: boolean; reason?: string } {
  // Default: allow all if settings not configured (undefined = allow)
  // Only block if explicitly set to false
  const allowDesktop = settings.allowDesktop !== false
  const allowMobile = settings.allowMobile !== false
  const allowTablet = settings.allowTablet !== false
  
  const detection = detectDeviceType(userAgent)
  
  // Check based on device type
  if (detection.isDesktop) {
    if (!allowDesktop) {
      return { allowed: false, reason: 'Desktop devices are blocked' }
    }
    return { allowed: true }
  }
  
  if (detection.isTablet) {
    if (!allowTablet) {
      return { allowed: false, reason: 'Tablet devices are blocked' }
    }
    return { allowed: true }
  }
  
  if (detection.isMobile) {
    if (!allowMobile) {
      return { allowed: false, reason: 'Mobile devices are blocked' }
    }
    return { allowed: true }
  }
  
  // Unknown device type - allow by default (fail-open for safety)
  return { allowed: true }
}

