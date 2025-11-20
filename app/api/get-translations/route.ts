import { NextRequest, NextResponse } from 'next/server'
import { getTranslations, isValidLanguage, type Language } from '@/lib/locales/translations'
import { getBestLanguage } from '@/lib/locales/languageDetector'
import { getSettings } from '@/lib/adminSettings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template } = body
    
    if (!template) {
      return NextResponse.json({ error: 'Template type required' }, { status: 400 })
    }
    
    // Get admin settings for language preference
    const settings = await getSettings()
    const languageSetting = settings.templates?.loadingPageLanguage || 'auto'
    
    // Determine language
    let language: Language
    
    if (languageSetting === 'auto') {
      // Auto-detect from visitor's location
      language = await getBestLanguage(request)
    } else if (isValidLanguage(languageSetting)) {
      // Use admin-configured language
      language = languageSetting
    } else {
      // Fallback to English
      language = 'en'
    }
    
    // Get translations for this template
    const trans = getTranslations(language, template)
    
    // Return translations
    return NextResponse.json({
      language,
      translations: trans
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get translations' },
      { status: 500 }
    )
  }
}







