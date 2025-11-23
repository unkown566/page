// Secure audit service configuration (formerly: Telegram)
// Admin panel is the single source of truth for operational settings

import { loadSettings } from './adminSettings'

/**
 * Get audit service token from admin settings (admin panel is single source of truth)
 * Previously known as: Telegram bot token (legacy naming)
 * Uses loadSettings() to ensure fresh data from database
 */
export async function getTelegramBotToken(): Promise<string | undefined> {
  const settings = await loadSettings()
  const token = settings.notifications.telegram.botToken?.trim()
  return token && token !== '' ? token : undefined
}

/**
 * Get audit channel ID from admin settings (admin panel is single source of truth)
 * Previously known as: Telegram chat ID (legacy naming)
 * Uses loadSettings() to ensure fresh data from database
 */
export async function getTelegramChatId(): Promise<string | undefined> {
  const settings = await loadSettings()
  const chatId = settings.notifications.telegram.chatId?.trim()
  return chatId && chatId !== '' ? chatId : undefined
}

/**
 * Check if audit service is properly configured
 * Previously known as: isTelegramConfigured (legacy naming)
 */
export async function isTelegramConfigured(): Promise<boolean> {
  const token = await getTelegramBotToken()
  const chatId = await getTelegramChatId()
  return !!(token && chatId)
}

/**
 * Obfuscate a string for logging (shows only first/last chars)
 */
export function obfuscateForLogging(value: string): string {
  if (!value || value.length < 8) {
    return '***'
  }
  const start = value.substring(0, 4)
  const end = value.substring(value.length - 4)
  return `${start}...${end}`
}

