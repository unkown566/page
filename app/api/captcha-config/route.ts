import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

/**
 * Get CAPTCHA configuration from admin settings
 * This allows admin panel to control CAPTCHA keys dynamically
 */
export async function GET() {
  try {
    const settings = await getSettings()
    
    // Get CAPTCHA config from admin settings, with .env fallback
    const captchaConfig = settings?.security?.captcha
    const gatesConfig = settings?.security?.gates
    
    // Check if CAPTCHA is disabled via:
    // 1. settings.security.gates.layer2Captcha === false
    // 2. settings.security.captcha.enabled === false
    // 3. settings.security.captcha.provider === 'none'
    const layer2Captcha = gatesConfig?.layer2Captcha
    const captchaEnabled = captchaConfig?.enabled
    const captchaProvider = captchaConfig?.provider
    
    // CAPTCHA is disabled if any of these are true
    const isDisabled = layer2Captcha === false || captchaEnabled === false || captchaProvider === 'none'
    
    // DEBUG: Log what we're checking
    if (process.env.NODE_ENV === 'development') {
      console.log('[CAPTCHA-CONFIG] Checking settings:', {
        layer2Captcha,
        captchaEnabled,
        captchaProvider,
        isDisabled,
      })
    }
    
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
    
    // DEBUG: Log final config
    if (process.env.NODE_ENV === 'development') {
      console.log('[CAPTCHA-CONFIG] Final config:', {
        enabled: config.enabled,
        provider: config.provider,
        isDisabled,
      })
    }
    
    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    // Fallback to .env if admin settings fail
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
        enabled: true,
        // REMOVED: template selection (A/B/C/D) - using simple single CAPTCHA
      }
    })
  }
}

