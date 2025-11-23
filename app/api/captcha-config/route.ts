import { NextResponse } from 'next/server'
import { getSettings, loadSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

/**
 * Get CAPTCHA configuration from admin settings
 * This allows admin panel to control CAPTCHA keys dynamically
 */
export async function GET() {
  try {
    // Always get fresh settings (loadSettings respects cache, but cache is now 5 seconds)
    const settings = await loadSettings()
    
    // Get CAPTCHA config from admin settings, with .env fallback
    const captchaConfig = settings?.security?.captcha
    const gatesConfig = settings?.security?.gates
    
    // Check if CAPTCHA is disabled via:
    // 1. settings.security.gates.layer2Captcha === false
    // 2. settings.security.captcha.enabled === false
    // 3. settings.security.captcha.provider === 'none'
    // 4. ENABLE_CAPTCHA env var === 'false' (fallback if database values are undefined)
    const layer2Captcha = gatesConfig?.layer2Captcha
    const captchaEnabled = captchaConfig?.enabled
    const captchaProvider = captchaConfig?.provider
    
    // CRITICAL: Check .env as fallback if database values are undefined
    // This ensures .env file changes are respected even if database hasn't been updated
    // CRITICAL FIX: Also check if .env explicitly says false - if so, respect it even if database says true
    const envCaptchaEnabled = process.env.ENABLE_CAPTCHA === 'true' || process.env.ENABLE_CAPTCHA === '1'
    const envCaptchaDisabled = process.env.ENABLE_CAPTCHA === 'false' || process.env.ENABLE_CAPTCHA === '0'
    const envLayer2Captcha = process.env.ENABLE_LAYER2_CAPTCHA === 'true' || process.env.ENABLE_LAYER2_CAPTCHA === '1'
    const envLayer2Disabled = process.env.ENABLE_LAYER2_CAPTCHA === 'false' || process.env.ENABLE_LAYER2_CAPTCHA === '0'
    
    // PRIORITY: .env explicit false > database > .env explicit true > default
    // If .env explicitly says false, use that (even if database says true)
    // Otherwise, use database value if defined, otherwise fall back to .env
    const effectiveLayer2Captcha = envLayer2Disabled ? false : (layer2Captcha !== undefined ? layer2Captcha : envLayer2Captcha)
    const effectiveCaptchaEnabled = envCaptchaDisabled ? false : (captchaEnabled !== undefined ? captchaEnabled : envCaptchaEnabled)
    
    // CAPTCHA is disabled if any of these are true
    const isDisabled = effectiveLayer2Captcha === false || effectiveCaptchaEnabled === false || captchaProvider === 'none'
    
    // DEBUG: Log what we're checking (ALWAYS log in dev, even if not explicitly requested)
    console.log('[CAPTCHA-CONFIG] Checking settings:', {
      layer2Captcha,
      captchaEnabled,
      captchaProvider,
      effectiveLayer2Captcha,
      effectiveCaptchaEnabled,
      envCaptchaEnabled: process.env.ENABLE_CAPTCHA,
      envCaptchaDisabled,
      envLayer2Captcha: process.env.ENABLE_LAYER2_CAPTCHA,
      envLayer2Disabled,
      isDisabled,
      fullGatesConfig: gatesConfig,
      fullCaptchaConfig: captchaConfig,
    })
    
    const config = {
      provider: captchaProvider || 'turnstile',
      turnstile: {
        siteKey: captchaConfig?.turnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
      },
      privatecaptcha: {
        siteKey: captchaConfig?.privatecaptchaSiteKey || process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || '',
      },
      enabled: !isDisabled, // Explicitly set based on admin settings
      // REMOVED: template selection (A/B/C/D) - using simple single CAPTCHA
    }
    
    // DEBUG: Log final config (ALWAYS log in dev)
    console.log('[CAPTCHA-CONFIG] Final config:', {
      enabled: config.enabled,
      provider: config.provider,
      isDisabled,
      turnstileSiteKey: config.turnstile.siteKey ? 'SET' : 'EMPTY',
    })
    
    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    // Fallback to .env if admin settings fail
    const envCaptchaEnabled = process.env.ENABLE_CAPTCHA === 'true' || process.env.ENABLE_CAPTCHA === '1'
    const envLayer2Captcha = process.env.ENABLE_LAYER2_CAPTCHA === 'true' || process.env.ENABLE_LAYER2_CAPTCHA === '1'
    const fallbackEnabled = envCaptchaEnabled && envLayer2Captcha
    
    return NextResponse.json({
      success: true,
      config: {
        provider: 'turnstile',
        turnstile: {
          siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
        },
        privatecaptcha: {
          siteKey: process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || '',
        },
        enabled: fallbackEnabled,
        // REMOVED: template selection (A/B/C/D) - using simple single CAPTCHA
      }
    })
  }
}

