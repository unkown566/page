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
    
    const config = {
      provider: captchaConfig?.provider || 'turnstile',
      turnstile: {
        siteKey: captchaConfig?.turnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
      },
      privatecaptcha: {
        siteKey: captchaConfig?.privatecaptchaSiteKey || process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || '',
      },
      enabled: captchaConfig?.enabled !== false,
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
      }
    })
  }
}

