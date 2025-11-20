import { NextRequest, NextResponse } from 'next/server'
// PHASE 7.4: Use SQLite instead of JSON
import { getLinkByToken } from '@/lib/linkDatabaseSql'

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
    
    // PHASE 7.4: Use SQLite instead of JSON
    const link = await getLinkByToken(token)
    
    if (!link) {
      return NextResponse.json({
        success: false,
        error: 'Link not found',
      }, { status: 404 })
    }
    
    // PHASE 7.4: Return only necessary config (LinkRecord uses snake_case)
    return NextResponse.json({
      success: true,
      config: {
        templateId: link.template_id,
        templateMode: link.template_mode,
        loadingScreen: link.loading_screen || 'meeting',
        loadingDuration: link.loading_duration || 3,
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



