import { NextRequest, NextResponse } from 'next/server'
import { getEmailByMappingId } from '@/lib/linkDatabaseSql'

export const dynamic = 'force-dynamic'

/**
 * EMAIL FROM MAPPING ID API
 * Type C Link Support - Fetch email from database using mappingId
 * 
 * GET /api/email-from-mapping?mappingId=<mappingId>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mappingId = searchParams.get('mappingId')
    
    if (!mappingId) {
      return NextResponse.json(
        { email: null, error: 'MappingId required' },
        { status: 400 }
      )
    }
    
    // Fetch email from mappingId
    const email = await getEmailByMappingId(mappingId)
    
    if (!email) {
      return NextResponse.json(
        { email: null, error: 'Email not found for mappingId' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      email,
      mappingId,
    })
  } catch (error) {
    console.error('[EMAIL-FROM-MAPPING] Error:', error)
    return NextResponse.json(
      { email: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


