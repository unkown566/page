import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

/**
 * Get CAPTCHA background configuration
 * Public API (no auth required) - safe for visitors
 */
export async function GET() {
  try {
    const settings = await getSettings()
    
    // Get background setting from admin settings
    type CaptchaBackgroundOption = 'default' | 'bg1' | 'bg2' | 'bg3' | 'bg4' | 'random'
    const background = (settings?.security?.captcha?.background as CaptchaBackgroundOption) || 'default'
    
    // Background mapping - supports both JPG (preferred) and SVG (fallback)
    const getBackgroundUrl = (bgId: string): string => {
      if (bgId === 'default') return ''
      // Try JPG first, fallback to SVG
      // Note: In production, you'd check if file exists, but for simplicity we'll let the browser handle 404s
      // JPG takes priority if both exist
      return `/captcha-bg/${bgId}.jpg` // Browser will fallback to SVG if JPG doesn't exist via CSS
    }
    
    const backgroundNames: Record<string, string> = {
      default: 'Default',
      bg1: 'Nature Blue',
      bg2: 'Dark Security',
      bg3: 'Soft Gradient',
      bg4: 'Corporate Clean',
    }
    
    // If random, select a random background server-side
    let selectedBackground: CaptchaBackgroundOption = background
    let backgroundUrl = ''
    
    if (background === 'random') {
      // Randomly select from bg1-bg4
      const randomBgs: Array<CaptchaBackgroundOption> = ['bg1', 'bg2', 'bg3', 'bg4']
      const randomIndex = Math.floor(Math.random() * randomBgs.length)
      selectedBackground = randomBgs[randomIndex]
      backgroundUrl = getBackgroundUrl(selectedBackground)
    } else {
      // Use selected background
      backgroundUrl = getBackgroundUrl(background)
    }
    
    return NextResponse.json({
      success: true,
      background: selectedBackground,
      url: backgroundUrl,
      isRandom: background === 'random',
    })
  } catch (error) {
    // Fallback to default on error
    return NextResponse.json({
      success: true,
      background: 'default',
      url: '',
      isRandom: false,
    })
  }
}

