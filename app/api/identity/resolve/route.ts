import { NextRequest, NextResponse } from 'next/server'
import { getEmailFromId } from '@/lib/linkManagement'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')


    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const email = await getEmailFromId(id)


    if (!email) {
      // Return JSON error instead of redirect (let frontend handle redirect)
      return NextResponse.json(
        { error: 'Invalid or expired link', email: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ email })
  } catch (error) {
    // Return JSON error instead of redirect
    return NextResponse.json(
      { error: 'Internal server error', email: null },
      { status: 500 }
    )
  }
}

