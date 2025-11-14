import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllLinks } from '@/lib/linkDatabase'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'all' | 'personalized' | 'generic'
    const status = searchParams.get('status') // 'active' | 'expired' | 'archived' | 'deleted'

    // Get all links
    let links = await getAllLinks()

    // Filter by type
    if (type && type !== 'all') {
      links = links.filter((link) => link.type === type)
    }

    // Filter by status
    if (status) {
      if (status === 'active') {
        // Show active links (not used, not expired, not deleted)
        links = links.filter((link) => 
          link.status === 'active' && 
          link.expiresAt > Date.now() &&
          !link.used
        )
      } else if (status === 'expired') {
        // Show expired links (expired but not used)
        links = links.filter((link) => 
          link.status === 'active' && 
          link.expiresAt <= Date.now() &&
          !link.used
        )
      } else if (status === 'archived') {
        // Show archived links: used links OR deleted links
        links = links.filter((link) => 
          link.status === 'used' || 
          link.status === 'deleted' ||
          (link.type === 'personalized' && link.used === true)
        )
      }
    }

    // Sort by created date (newest first)
    links.sort((a, b) => b.createdAt - a.createdAt)

    return NextResponse.json({
      success: true,
      links,
      count: links.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch links',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

