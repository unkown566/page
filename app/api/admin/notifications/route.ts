import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAllCapturedEmails } from '@/lib/linkDatabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Verify authentication
        const cookieStore = await cookies()
        const authCookie = cookieStore.get('admin_session')

        if (!authCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch recent captures to show as notifications
        const captures = await getAllCapturedEmails()

        // Transform captures into notifications
        // We'll show the 5 most recent captures
        const notifications = captures
            .slice(0, 5)
            .map(capture => ({
                id: capture.id,
                type: 'capture',
                title: 'New Capture',
                message: `New login from ${capture.email}`,
                timestamp: capture.capturedAt,
                read: false // In a real app, we'd track read status in DB
            }))

        return NextResponse.json({ notifications })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
