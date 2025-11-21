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

// Force Node.js runtime (not Edge) to support file system operations
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const isPublic = url.searchParams.get('scope') === 'public'
  
  try {
    const settings = await getSettings()

    // Public read-only access (for landing page)
    if (isPublic) {
      // Expose ONLY what the landing page needs, nothing sensitive
      const publicSettings = {
        success: true,
        settings: {
          security: {
            networkRestrictions: {
              allowVpn: settings.security?.networkRestrictions?.allowVpn ?? true,
              allowProxy: settings.security?.networkRestrictions?.allowProxy ?? true,
              allowDatacenter: settings.security?.networkRestrictions?.allowDatacenter ?? true,
            },
            gates: {
              layer1BotFilter: settings.security?.gates?.layer1BotFilter,
              layer2Captcha: settings.security?.gates?.layer2Captcha,
              layer3BotDelay: settings.security?.gates?.layer3BotDelay,
            },
            botDelay: {
              enabled: settings.security?.botDelay?.enabled,
              min: settings.security?.botDelay?.min,
              max: settings.security?.botDelay?.max,
            },
          },
          captcha: {
            provider: settings.captcha?.provider ?? 'turnstile',
            rotationEnabled: settings.captcha?.rotationEnabled ?? false,
          },
        },
      }

      return NextResponse.json(publicSettings, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

    // Admin mode (requires authentication)
    const authError = await requireAdmin(request)
    if (authError) return authError

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
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

