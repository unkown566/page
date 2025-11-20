import { NextRequest, NextResponse } from 'next/server'
import { getLink, saveLink } from '@/lib/linkDatabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Get link
    const link = await getLink(token)

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      )
    }

    // Soft delete (update status)
    link.status = 'deleted'
    await saveLink(link)

    return NextResponse.json({
      success: true,
      message: 'Link deleted successfully',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to delete link',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}










