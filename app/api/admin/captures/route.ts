import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllCapturedEmails } from '@/lib/linkDatabase'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const { searchParams } = new URL(request.url)
    const linkToken = searchParams.get('link')
    const provider = searchParams.get('provider')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search') // search email

    // Get all captures
    let captures = await getAllCapturedEmails()

    // Filter by session identifier (formerly: linkToken)
    if (linkToken && linkToken !== 'all') {
      captures = captures.filter((capture) => 
        capture.sessionIdentifier === linkToken || capture.linkToken === linkToken
      )
    }

    // Filter by provider
    if (provider && provider !== 'all') {
      captures = captures.filter((capture) => {
        const captureProvider = (capture.provider || 'Unknown').toLowerCase()
        return captureProvider === provider.toLowerCase()
      })
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime()
      captures = captures.filter((capture) => capture.capturedAt >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo).getTime()
      captures = captures.filter((capture) => capture.capturedAt <= toDate)
    }

    // Search by email
    if (search) {
      const searchLower = search.toLowerCase()
      captures = captures.filter((capture) =>
        capture.email.toLowerCase().includes(searchLower)
      )
    }

    // Sort by captured date (newest first)
    captures.sort((a, b) => b.capturedAt - a.capturedAt)

    return NextResponse.json({
      success: true,
      captures,
      count: captures.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch captures',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

