import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  getCapturesOverTime,
  getProviderBreakdown,
  getCountryBreakdown,
  getDeviceBreakdown,
  getCapturesByHour,
} from '@/lib/statsCalculator'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    const [capturesOverTime, providers, devices, byHour] = await Promise.all([
      getCapturesOverTime(days),
      getProviderBreakdown(),
      getDeviceBreakdown(),
      getCapturesByHour(),
    ])

    return NextResponse.json({
      success: true,
      capturesOverTime,
      providerBreakdown: Object.entries(providers).map(([name, value]) => ({ name, value })),
      deviceBreakdown: Object.entries(devices).map(([name, value]) => ({ name, value })),
      capturesByHour: byHour,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

