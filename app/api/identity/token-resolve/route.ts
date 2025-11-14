import { NextRequest, NextResponse } from 'next/server'
import { getEmailFromId } from '@/lib/linkManagement'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const email = await getEmailFromId(id)

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token resolve error:', error)
    }
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 404 }
    )
  }
}



