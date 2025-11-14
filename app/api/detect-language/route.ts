import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { detectLanguage } from '@/lib/languageDetection'

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const headersList = headers()
    const forwarded = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || '127.0.0.1'
    
    // Get accept-language header
    const acceptLanguage = headersList.get('accept-language') || undefined
    
    
    // Use the language detection utility
    const detectedLanguage = await detectLanguage(ip, acceptLanguage)
    
    return NextResponse.json({
      success: true,
      ip,
      acceptLanguage,
      language: detectedLanguage,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      language: 'ja', // Default to Japanese
    })
  }
}
