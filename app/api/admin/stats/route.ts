import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { calculateDashboardStats } from '@/lib/statsCalculator'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const stats = await calculateDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

