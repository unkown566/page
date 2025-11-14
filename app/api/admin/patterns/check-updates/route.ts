import { NextResponse } from 'next/server'
import { checkForUpdates } from '@/lib/patternUpdater'

export async function POST() {
  try {
    const results = await checkForUpdates()

    const totalNew = results.reduce((sum, r) => sum + r.newPatterns, 0)
    const totalUpdated = results.reduce((sum, r) => sum + r.updatedPatterns, 0)
    const errors = results.filter((r) => !r.success)

    return NextResponse.json({
      success: true,
      newPatterns: totalNew,
      updatedPatterns: totalUpdated,
      results,
      errors: errors.map((e) => e.errors).flat(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}




