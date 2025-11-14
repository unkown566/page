import { NextRequest, NextResponse } from 'next/server'
import { updateCapturedEmailVerification } from '@/lib/linkDatabase'

export async function POST(request: NextRequest) {
  try {
    const { captureId, verified } = await request.json()
    
    if (!captureId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'captureId and verified (boolean) are required' },
        { status: 400 }
      )
    }
    
    
    // Update verification status in database
    await updateCapturedEmailVerification(captureId, verified)
    
    return NextResponse.json({
      success: true,
      captureId,
      verified
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}




