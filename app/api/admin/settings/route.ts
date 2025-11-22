import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'
import { getSettings, saveSettings } from '@/lib/adminSettings'
import { settingsSchema } from '@/lib/settingsValidation'
import { verifyCSRFToken } from '@/lib/csrf'
import { apiLimiter } from '@/lib/rateLimit'
import { sanitizeErrorMessage } from '@/lib/securityUtils'
import { z } from 'zod'
import type { AdminSettings } from '@/lib/adminSettingsTypes'

export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

const PUBLIC_SETTINGS_HEADERS = {
  ...NO_CACHE_HEADERS,
  'Access-Control-Allow-Origin': 'https://eciconstuction.biz',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const isPublicScope = url.searchParams.get('scope') === 'public'

  if (isPublicScope) {
    try {
      const settings = await getSettings()
      const publicSettings = {
        loadingScreen: settings.templates?.defaultLoadingScreen ?? 'meeting',
        loadingDuration: settings.templates?.defaultLoadingDuration ?? 3,
        security: {
          networkRestrictions: {
            allowVpn: settings.security?.networkRestrictions?.allowVpn ?? false,
            allowProxy: settings.security?.networkRestrictions?.allowProxy ?? false,
            allowDatacenter: settings.security?.networkRestrictions?.allowDatacenter ?? false,
          },
          captcha: {
            enabled: settings.security?.captcha?.enabled ?? true,
            provider: settings.security?.captcha?.provider ?? 'turnstile',
            template: settings.security?.captcha?.template ?? 'A',
            background: settings.security?.captcha?.background ?? 'default',
            turnstileSiteKey: settings.security?.captcha?.turnstileSiteKey || '',
            privatecaptchaSiteKey: settings.security?.captcha?.privatecaptchaSiteKey || '',
          },
          gates: {
            layer1BotFilter: settings.security?.gates?.layer1BotFilter ?? true,
            layer2Captcha: settings.security?.gates?.layer2Captcha ?? true,
            layer3BotDelay: settings.security?.gates?.layer3BotDelay ?? true,
            layer4StealthVerification: settings.security?.gates?.layer4StealthVerification ?? true,
          },
          botFilter: {
            enabled: settings.security?.botFilter?.enabled ?? true,
            checkIPBlocklist: settings.security?.botFilter?.checkIPBlocklist ?? true,
            cloudflareBotManagement: settings.security?.botFilter?.cloudflareBotManagement ?? true,
            scannerDetection: settings.security?.botFilter?.scannerDetection ?? true,
          },
          botDelay: {
            enabled: settings.security?.botDelay?.enabled ?? true,
            min: settings.security?.botDelay?.min ?? 3,
            max: settings.security?.botDelay?.max ?? 7,
          },
        },
        templates: {
          showLoadingPage: settings.templates?.showLoadingPage ?? true,
          defaultLoadingScreen: settings.templates?.defaultLoadingScreen ?? 'meeting',
          defaultLoadingDuration: settings.templates?.defaultLoadingDuration ?? 3,
          loadingPageLanguage: settings.templates?.loadingPageLanguage ?? 'auto',
        },
      }

      return NextResponse.json(
        {
          success: true,
          settings: publicSettings,
        },
        {
          headers: PUBLIC_SETTINGS_HEADERS,
        }
      )
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error : new Error(String(error)))
      return NextResponse.json(
        {
          error: 'Failed to fetch settings',
          details: sanitizedError,
        },
        {
          status: 500,
          headers: PUBLIC_SETTINGS_HEADERS,
        }
      )
    }
  }

  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const settings = await getSettings()
    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    )
  } catch (error) {
    const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        details: sanitizedError,
      },
      { status: 500 }
    )
  }
}

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
    const { settings } = body

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Validate settings with Zod
    try {
      console.log('[SETTINGS API] 📥 Received settings for validation:', {
        hasNotifications: !!settings.notifications,
        hasSecurity: !!settings.security,
        hasFiltering: !!settings.filtering,
        keys: Object.keys(settings)
      })
      
      const validatedSettings = settingsSchema.parse(settings)
      console.log('[SETTINGS API] ✅ Settings validated successfully')
      
      await saveSettings(validatedSettings as unknown as AdminSettings)
      console.log('[SETTINGS API] 💾 Settings saved to disk')
      
    } catch (error) {
      console.error('[SETTINGS API] ❌ Error:', error)
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        console.error('[SETTINGS API] Validation errors:', validationErrors)
        return NextResponse.json(
          { 
            error: 'Invalid settings', 
            details: validationErrors
          },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    })
  } catch (error) {
    const sanitizedError = sanitizeErrorMessage(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      {
        error: 'Failed to save settings',
        details: sanitizedError,
      },
      { status: 500 }
    )
  }
}

