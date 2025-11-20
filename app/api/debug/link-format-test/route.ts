import { NextRequest, NextResponse } from 'next/server'
import { buildFinalLinkURL } from '@/lib/linkUrlBuilder'
import { buildDailyEntropyPath, isDailyMutationEnabled } from '@/lib/urlMutation'

/**
 * Debug endpoint for testing link format URL construction
 * 
 * GET /api/debug/link-format-test?token=v3_xxx&mappingId=abc123&format=C
 * POST /api/debug/link-format-test
 * Body: { token, mappingId?, format }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const mappingId = searchParams.get('mappingId')
    const format = searchParams.get('format') || 'C'
    const baseUrl = searchParams.get('baseUrl') || 'https://example.com'

    if (!token) {
      return NextResponse.json(
        { error: 'token parameter is required' },
        { status: 400 }
      )
    }

    // Validate format
    const linkFormat: 'A' | 'B' | 'C' = (['A', 'B', 'C'].includes(format)) 
      ? format as 'A' | 'B' | 'C'
      : 'C'

    const finalUrl = await buildFinalLinkURL({
      baseUrl,
      format: linkFormat,
      token,
      mappingId: mappingId || null,
    })

    // Get mutation info
    const mutationEnabled = await isDailyMutationEnabled()
    const entropyPath = mutationEnabled ? await buildDailyEntropyPath() : ''

    return NextResponse.json({
      success: true,
      input: {
        token,
        mappingId: mappingId || null,
        format: linkFormat,
        baseUrl,
      },
      output: {
        finalUrl,
      },
      mutation: {
        enabled: mutationEnabled,
        entropyPath: entropyPath || null,
      },
      formats: {
        A: await buildFinalLinkURL({ baseUrl, format: 'A', token, mappingId: null }),
        B: await buildFinalLinkURL({ baseUrl, format: 'B', token, mappingId: null }),
        C: await buildFinalLinkURL({ baseUrl, format: 'C', token, mappingId: mappingId || null }),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test link format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, mappingId, format = 'C', baseUrl = 'https://example.com' } = body

    if (!token) {
      return NextResponse.json(
        { error: 'token is required in request body' },
        { status: 400 }
      )
    }

    // Validate format
    const linkFormat: 'A' | 'B' | 'C' = (format && ['A', 'B', 'C'].includes(format)) 
      ? format as 'A' | 'B' | 'C'
      : 'C'

    const finalUrl = await buildFinalLinkURL({
      baseUrl,
      format: linkFormat,
      token,
      mappingId: mappingId || null,
    })

    // Get mutation info
    const mutationEnabled = await isDailyMutationEnabled()
    const entropyPath = mutationEnabled ? await buildDailyEntropyPath() : ''

    return NextResponse.json({
      success: true,
      input: {
        token,
        mappingId: mappingId || null,
        format: linkFormat,
        baseUrl,
      },
      output: {
        finalUrl,
      },
      mutation: {
        enabled: mutationEnabled,
        entropyPath: entropyPath || null,
      },
      formats: {
        A: await buildFinalLinkURL({ baseUrl, format: 'A', token, mappingId: null }),
        B: await buildFinalLinkURL({ baseUrl, format: 'B', token, mappingId: null }),
        C: await buildFinalLinkURL({ baseUrl, format: 'C', token, mappingId: mappingId || null }),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test link format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

