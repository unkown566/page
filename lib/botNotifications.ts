/**
 * Bot Detection Notifications
 * Sends Telegram notifications when bots are detected and blocked
 */

import { loadSettings } from './adminSettings'
import { getGeoData } from './geoLocation'

export interface BotDetectionData {
  ip: string
  userAgent: string
  reason: string
  confidence: number
  layer: 'middleware' | 'captcha' | 'bot-filter' | 'stealth-verification' | 'honeypot'
  country?: string
  city?: string
  blockedAt?: Date
  additionalInfo?: Record<string, any>
}

// Rate limiting: same IP + layer + reason = only notify once per 5 minutes
const botNotificationCache = new Map<string, number>()
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000 // 5 minutes

/**
 * Format layer name for display
 */
function formatLayerName(layer: string): string {
  const names: Record<string, string> = {
    'middleware': 'Middleware (Pre-Flight)',
    'captcha': 'CAPTCHA Verification',
    'bot-filter': 'Bot Filter',
    'stealth-verification': 'Stealth Verification',
    'honeypot': 'Honeypot Trap'
  }
  return names[layer] || layer
}

/**
 * Format bot detection message for Telegram
 */
function formatBotDetectionMessage(data: BotDetectionData): string {
  const location = data.country && data.city 
    ? `${data.city}, ${data.country}`
    : data.country || 'Unknown'
  
  // Truncate user agent if too long
  const truncatedUA = data.userAgent.length > 80 
    ? data.userAgent.substring(0, 77) + '...'
    : data.userAgent
  
  // Format timestamp
  const blockedAt = data.blockedAt || new Date()
  const timestamp = blockedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Determine emoji based on confidence
  let statusEmoji = '🔴'
  if (data.confidence >= 90) statusEmoji = '🔴'
  else if (data.confidence >= 70) statusEmoji = '🟡'
  else statusEmoji = '🟢'
  
  // Layer-specific emoji
  const layerEmoji: Record<string, string> = {
    'middleware': '🛡️',
    'captcha': '🧩',
    'bot-filter': '🤖',
    'stealth-verification': '🕵️',
    'honeypot': '🍯'
  }
  const emoji = layerEmoji[data.layer] || '🚫'
  
  // Format message
  let message = `+++FOX NOTIFICATION+++\n\n`
  message += `🤖 BOT DETECTED\n\n`
  message += `${statusEmoji} Status: BLOCKED\n`
  message += `${emoji} Layer: ${formatLayerName(data.layer)}\n`
  message += `🎯 Confidence: ${data.confidence}%\n\n`
  message += `🚫 Detection Reason:\n`
  message += `└─ ${data.reason}\n\n`
  message += `👤 User Agent:\n`
  message += `└─ ${truncatedUA}\n\n`
  message += `🌐 IP Address: ${data.ip}\n`
  message += `📍 Location: ${location}\n`
  
  // Add additional info if present
  if (data.additionalInfo && Object.keys(data.additionalInfo).length > 0) {
    message += `\n📋 Additional Details:\n`
    Object.entries(data.additionalInfo).forEach(([key, value]) => {
      message += `└─ ${key}: ${value}\n`
    })
  }
  
  message += `\n⏰ Detected: ${timestamp}`
  
  return message
}

/**
 * Send bot detection notification to Telegram
 */
export async function sendBotDetectionNotification(data: BotDetectionData): Promise<boolean> {
  
  try {
    // Load settings to check if notifications are enabled
    const settings = await loadSettings()
    
    // Debug: log the entire notifications structure
    
    // Check multiple possible structures
    // Note: NotificationSettings doesn't have 'enabled' at root, only telegram.email have enabled
    const telegramEnabled = settings.notifications?.telegram?.enabled !== false
    
    const botDetectionEnabled = settings.notifications?.telegram?.notifyBotDetections !== false
    
    
    // Check if Telegram notifications are enabled
    if (!telegramEnabled) {
      return false
    }
    
    // Check if bot detection notifications are specifically enabled
    if (!botDetectionEnabled) {
      return false
    }
    
    // Rate limiting: same IP + layer + reason = only notify once per 5 minutes
    const cacheKey = `${data.ip}-${data.layer}-${data.reason}`
    const lastNotification = botNotificationCache.get(cacheKey)
    
    if (lastNotification && Date.now() - lastNotification < NOTIFICATION_COOLDOWN) {
      return false
    }
    
    // Get geolocation if not provided
    if (!data.country || !data.city) {
      const geoData = await getGeoData(data.ip)
      data.country = geoData.country
      data.city = geoData.city
    }
    
    // Format message
    const message = formatBotDetectionMessage(data)
    
    // Send to Telegram
    const botToken = settings.notifications.telegram.botToken
    const chatId = settings.notifications.telegram.chatId
    
    if (!botToken || !chatId) {
      return false
    }
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
    
    
    if (!response.ok) {
      const errorText = await response.text()
      let error: any
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { description: errorText }
      }
      throw new Error(`Telegram API error: ${response.status} ${error.description || response.statusText}`)
    }
    
    const responseData = await response.json()
    
    // Update cache
    botNotificationCache.set(cacheKey, Date.now())
    
    // Clean up old cache entries (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const entries = Array.from(botNotificationCache.entries())
    for (const [key, timestamp] of entries) {
      if (timestamp < oneHourAgo) {
        botNotificationCache.delete(key)
      }
    }
    
    
    return true
  } catch (error) {
    // Don't throw - logging failures shouldn't break middleware
    return false
  }
}

