import { NextRequest, NextResponse } from 'next/server'
import { checkLinkUsage } from '@/lib/linkManagement'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const email = request.nextUrl.searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json({ used: false })
    }

    const used = checkLinkUsage(token, email)

    return NextResponse.json({ used })
  } catch (error) {
    return NextResponse.json({ used: false })
  }
}




