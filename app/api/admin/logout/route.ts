import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Clear all admin cookies
  response.cookies.delete('admin_auth')
  response.cookies.delete('admin_session')
  
  return response
}

