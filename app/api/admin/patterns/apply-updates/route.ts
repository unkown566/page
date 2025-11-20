import { NextResponse } from 'next/server'
import { checkForUpdates, applyUpdates, UPDATE_SOURCES } from '@/lib/patternUpdater'

export async function POST() {
  try {
    // First check for updates
    const results = await checkForUpdates()

    // Collect all new patterns
    const newPatterns: any[] = []
    for (const source of UPDATE_SOURCES) {
      if (!source.enabled) continue
      try {
        const patterns = await source.scrapeFunction()
        newPatterns.push(...patterns)
      } catch (error) {
      }
    }

    // Apply updates
    const success = await applyUpdates(newPatterns)

    return NextResponse.json({
      success,
      patternsApplied: newPatterns.length,
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









