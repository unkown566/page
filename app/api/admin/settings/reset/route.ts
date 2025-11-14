import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'
import { saveSettings, loadSettings, DEFAULT_SETTINGS } from '@/lib/adminSettings'
import { verifyCSRFToken } from '@/lib/csrf'
import { apiLimiter } from '@/lib/rateLimit'
import { sanitizeErrorMessage } from '@/lib/securityUtils'

// Force Node.js runtime (not Edge) to support file system operations
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    // Rate limiting
    const rateLimit = await apiLimiter.check(request)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt)
          }
        }
      )
    }

    // CSRF protection
    const csrfToken = request.headers.get('x-csrf-token')
    const cookieStore = await cookies()
    const csrfSecret = cookieStore.get('csrf-secret')?.value
    
    if (!csrfSecret || !csrfToken || !verifyCSRFToken(csrfSecret, csrfToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { clearCaptchaKeys = false } = body

    // Load current settings to preserve some values (like Telegram, Email config)
    const currentSettings = await loadSettings()

    // Create reset settings - merge defaults with current non-security settings
    const resetSettings = {
      ...DEFAULT_SETTINGS,
      // Preserve notification settings (Telegram, Email)
      notifications: currentSettings.notifications,
      // Preserve template settings
      templates: currentSettings.templates,
      // Preserve redirect settings
      redirects: currentSettings.redirects,
      // Reset security settings
      security: {
        ...DEFAULT_SETTINGS.security,
        // Optionally clear CAPTCHA keys
        captcha: {
          ...DEFAULT_SETTINGS.security.captcha,
          ...(clearCaptchaKeys ? {
            turnstileSiteKey: '',
            turnstileSecretKey: '',
            privatecaptchaSiteKey: '',
            privatecaptchaSecretKey: '',
          } : {
            // Preserve CAPTCHA keys if not clearing
            turnstileSiteKey: currentSettings.security.captcha.turnstileSiteKey || '',
            turnstileSecretKey: currentSettings.security.captcha.turnstileSecretKey || '',
            privatecaptchaSiteKey: currentSettings.security.captcha.privatecaptchaSiteKey || '',
            privatecaptchaSecretKey: currentSettings.security.captcha.privatecaptchaSecretKey || '',
          }),
        },
      },
    }

    // Save reset settings
    await saveSettings(resetSettings)

    return NextResponse.json({
      success: true,
      message: 'Settings reset to defaults successfully',
      settings: resetSettings,
    })
  } catch (error) {
    const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to reset settings',
        details: sanitizedError,
      },
      { status: 500 }
    )
  }
}

