/**
 * Client-only CAPTCHA configuration
 * Uses ONLY public environment variables
 * NO SERVER IMPORTS AT ALL!
 * 
 * This file is 100% safe for client components
 */

import type { CaptchaProvider } from './captchaConfigTypes'
export type { CaptchaProvider } from './captchaConfigTypes'
export { TURNSTILE_TEST_KEYS } from './captchaConfigTypes'

export interface ClientCaptchaConfig {
  provider: CaptchaProvider
  turnstile?: {
    siteKey: string
  }
  privatecaptcha?: {
    endpoint: string
    siteKey: string
    displayMode?: 'widget' | 'popup' | 'hidden'
    theme?: 'light' | 'dark'
    lang?: string
    startMode?: 'click' | 'auto'
  }
}


/**
 * Get CAPTCHA config from public environment variables
 * Safe for client components - NO SERVER CODE!
 */
export function getClientCaptchaConfig(): ClientCaptchaConfig {
  // Determine provider from environment
  const providerEnv = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER?.toLowerCase()
  
  let provider: CaptchaProvider = 'none'
  
  // Check for PrivateCaptcha configuration
  const privateCaptchaSiteKey = process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY
  const privateCaptchaEndpoint = process.env.NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT || 'us'
  
  // Check for Turnstile configuration
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  
  // Determine provider
  if (providerEnv === 'privatecaptcha' || (privateCaptchaSiteKey && !turnstileSiteKey)) {
    provider = 'privatecaptcha'
  } else if (providerEnv === 'turnstile' || turnstileSiteKey) {
    provider = 'turnstile'
  } else if (providerEnv === 'none') {
    provider = 'none'
  }
  
  const config: ClientCaptchaConfig = {
    provider,
  }
  
  // Configure Turnstile if enabled
  if (provider === 'turnstile' && turnstileSiteKey) {
    config.turnstile = {
      siteKey: turnstileSiteKey,
    }
  }
  
  // Configure PrivateCaptcha if enabled
  if (provider === 'privatecaptcha' && privateCaptchaSiteKey) {
    // Determine endpoint URL
    let endpointUrl = 'https://api.privatecaptcha.com/puzzle'
    if (privateCaptchaEndpoint === 'eu') {
      endpointUrl = 'https://api.eu.privatecaptcha.com/puzzle'
    } else if (privateCaptchaEndpoint && privateCaptchaEndpoint.startsWith('http')) {
      endpointUrl = privateCaptchaEndpoint
    }
    
    config.privatecaptcha = {
      siteKey: privateCaptchaSiteKey,
      endpoint: endpointUrl,
      displayMode: (process.env.NEXT_PUBLIC_PRIVATECAPTCHA_DISPLAY_MODE as any) || 'widget',
      theme: (process.env.NEXT_PUBLIC_PRIVATECAPTCHA_THEME as any) || 'light',
      lang: process.env.NEXT_PUBLIC_PRIVATECAPTCHA_LANG || 'en',
      startMode: (process.env.NEXT_PUBLIC_PRIVATECAPTCHA_START_MODE as any) || 'click',
    }
  }
  
  return config
}

/**
 * Get just the provider (client-safe)
 */
export function getCaptchaProvider(): CaptchaProvider {
  const config = getClientCaptchaConfig()
  return config.provider
}

