import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json({
      success: true,
      settings,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load settings',
      settings: null,
    }, { status: 500 })
  }
}



