/**
 * Shared CAPTCHA Configuration Types
 * Used by both client and server code
 * NO IMPORTS - types only!
 */

export type CaptchaProvider = 'turnstile' | 'privatecaptcha' | 'none'

export interface CaptchaConfig {
  provider: CaptchaProvider
  // Turnstile (Cloudflare) settings
  turnstile?: {
    siteKey: string
    secretKey?: string
    endpoint?: string
  }
  // PrivateCaptcha settings
  privatecaptcha?: {
    siteKey: string
    endpoint?: string // 'us' | 'eu' | custom URL
    displayMode?: 'widget' | 'popup' | 'hidden'
    theme?: 'light' | 'dark'
    lang?: string
    startMode?: 'click' | 'auto'
  }
}

// Official Cloudflare Turnstile testing keys
export const TURNSTILE_TEST_KEYS = {
  SITE_KEY_PASS: '1x00000000000000000000AA',
  SITE_KEY_FAIL: '2x00000000000000000000BB',
  SECRET_KEY_PASS: '1x0000000000000000000000000000000AA',
  SECRET_KEY_FAIL: '2x0000000000000000000000000000000BB',
} as const









