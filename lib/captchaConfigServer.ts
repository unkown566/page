/**
 * Server-side CAPTCHA Configuration
 * This file is server-only and can use adminSettings
 * DO NOT import this file directly from client components
 * 
 * Uses dynamic imports to prevent client bundling
 */

import type { CaptchaConfig, CaptchaProvider } from './captchaConfigTypes'

/**
 * Get CAPTCHA configuration from admin settings (admin panel is single source of truth)
 * Server-side only - uses adminSettings
 */
export async function getCaptchaConfigFromAdmin(): Promise<CaptchaConfig> {
  // Dynamic import to prevent client bundling
  const { getSettings } = await import('./adminSettings')
  
  // Try admin settings first
  const settings = await getSettings()
  
  if (settings.security.captcha.enabled && settings.security.captcha.provider !== 'none') {
    const provider = settings.security.captcha.provider
    
    const config: CaptchaConfig = {
      provider,
    }
    
    // Configure Turnstile if enabled (admin panel only - no .env fallback)
    if (provider === 'turnstile') {
      const siteKey = settings.security.captcha.turnstileSiteKey?.trim()
      const secretKey = settings.security.captcha.turnstileSecretKey?.trim()
      
      if (siteKey && siteKey !== '') {
        config.turnstile = {
          siteKey,
          secretKey,
          endpoint: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        }
      }
    }
    
    // Configure PrivateCaptcha if enabled (admin panel only - no .env fallback)
    if (provider === 'privatecaptcha') {
      const siteKey = settings.security.captcha.privatecaptchaSiteKey?.trim()
      
      if (siteKey && siteKey !== '') {
        // Endpoint can be configured in admin settings in the future, for now use default
        let endpointUrl = 'https://api.privatecaptcha.com/puzzle'
        
        config.privatecaptcha = {
          siteKey,
          endpoint: endpointUrl,
          displayMode: 'widget',
          theme: 'light',
          lang: 'en',
          startMode: 'click',
        }
      }
    }
    
    return config
  }
  
  // Return null to indicate admin settings didn't provide config
  // Caller should fall back to env vars
  return {
    provider: 'none',
  } as CaptchaConfig
}

