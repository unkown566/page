// Utility to decrypt Telegram messages (for backend/admin use)
import { decryptData } from './encryption'

/**
 * Decrypt a Telegram message that was sent with encryption
 * Usage: Extract the encrypted part from Telegram message and decrypt
 * 
 * Example Telegram message format:
 * 🔐 ENCRYPTED_DATA
 * 
 * <base64_encrypted_data>
 */
export function decryptTelegramMessage(telegramMessage: string): string {
  try {
    // Extract the encrypted part (after "ENCRYPTED_DATA\n\n")
    const lines = telegramMessage.split('\n')
    const encryptedLineIndex = lines.findIndex(line => line.includes('ENCRYPTED_DATA'))
    
    if (encryptedLineIndex === -1) {
      // No encryption marker, return as-is
      return telegramMessage
    }
    
    // Get the encrypted data (line after "ENCRYPTED_DATA\n\n")
    const encryptedData = lines.slice(encryptedLineIndex + 2).join('\n').trim()
    
    if (!encryptedData) {
      return telegramMessage
    }
    
    // Decrypt
    return decryptData(encryptedData)
  } catch (error) {
    return telegramMessage
  }
}












