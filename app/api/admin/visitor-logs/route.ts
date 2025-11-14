import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getRecentVisitorLogs, getDashboardStats, getUniqueCountries } from '@/lib/visitorTracker'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    if (action === 'stats') {
      // Get dashboard statistics
      const stats = await getDashboardStats()
      return NextResponse.json(stats)
    }
    
    if (action === 'countries') {
      // Get unique countries
      const countries = await getUniqueCountries()
      return NextResponse.json({ countries })
    }
    
    // Get visitor logs with filters
    const limit = parseInt(searchParams.get('limit') || '100')
    const country = searchParams.get('country') || 'all'
    const botStatus = (searchParams.get('botStatus') as any) || 'all'
    
    const logs = await getRecentVisitorLogs({
      limit,
      country,
      botStatus
    })
    
    return NextResponse.json({ 
      logs,
      count: logs.length,
      filters: { country, botStatus, limit }
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || 'Failed to load visitor logs',
        logs: [],
        count: 0
      },
      { status: 500 }
    )
  }
}

