import { NextRequest, NextResponse } from 'next/server'
import { getLink } from '@/lib/linkDatabase'

// Public endpoint to get link configuration (including template settings)
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token required',
      }, { status: 400 })
    }
    
    const link = await getLink(token)
    
    if (!link) {
      return NextResponse.json({
        success: false,
        error: 'Link not found',
      }, { status: 404 })
    }
    
    // Return only necessary config (no sensitive data)
    return NextResponse.json({
      success: true,
      config: {
        templateId: link.templateId,
        templateMode: link.templateMode,
        loadingScreen: link.loadingScreen || 'meeting',
        loadingDuration: link.loadingDuration || 3,
        id: link.id,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get link config',
    }, { status: 500 })
  }
}



