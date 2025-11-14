import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Load settings from admin panel (not .env)
    const settings = await getSettings()
    
    // Try admin settings first, then fall back to .env
    const botToken = settings?.notifications?.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN
    const chatId = settings?.notifications?.telegram?.chatId || process.env.TELEGRAM_CHAT_ID
    
    // Debug info to see what's being used
    const usingSettings = !!(settings?.notifications?.telegram?.botToken)
    const usingEnv = !usingSettings
    
    if (!botToken || !chatId) {
      return NextResponse.json({
        success: false,
        error: 'Telegram bot token or chat ID not configured',
        messageDelivered: false,
        debug: {
          hasSettingsBotToken: !!settings?.notifications?.telegram?.botToken,
          hasSettingsChatId: !!settings?.notifications?.telegram?.chatId,
          hasEnvBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
          hasEnvChatId: !!process.env.TELEGRAM_CHAT_ID
        }
      })
    }
    
    // Simple test message (no HTML to avoid parsing errors)
    const testMessage = `🧪 Test Message from Admin Panel

Time: ${new Date().toLocaleString()}
Status: Connection Test
Source: Admin Settings

If you receive this message, your Telegram bot is configured correctly! ✅`
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        // Don't use parse_mode to avoid HTML validation errors
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any
      
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { description: errorText }
      }
      
      return NextResponse.json({
        success: false,
        error: `Telegram API error: ${errorData.description || response.statusText}`,
        messageDelivered: false,
        details: errorData
      })
    }
    
    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      messageDelivered: result.ok,
      message: 'Test message sent successfully!',
      botUsername: '@foxresultsbot',
      debug: {
        usingAdminSettings: usingSettings,
        usingEnvVars: usingEnv,
        botTokenLength: botToken.length,
        chatId: chatId
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test message',
      messageDelivered: false
    })
  }
}

