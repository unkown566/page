/**
 * Parse email lists from CSV or TXT files
 */

/**
 * Parse email list from uploaded file
 * Supports CSV and TXT formats
 */
export async function parseEmailList(file: File): Promise<string[]> {
  const text = await file.text()
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    return parseCSV(text)
  } else if (extension === 'txt') {
    return parseTXT(text)
  } else {
    throw new Error('Unsupported file type. Please use .csv or .txt')
  }
}

/**
 * Parse CSV format
 * Supports header row (skips if contains "email")
 * Takes first column as email
 */
function parseCSV(text: string): string[] {
  const lines = text.split('\n')
  const emails: string[] = []

  // Skip header row if present
  const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle CSV with multiple columns (take first column)
    const email = line.split(',')[0].trim()

    if (isValidEmail(email)) {
      emails.push(email.toLowerCase())
    }
  }

  // Remove duplicates
  return Array.from(new Set(emails))
}

/**
 * Parse TXT format (one email per line)
 */
function parseTXT(text: string): string[] {
  const lines = text.split('\n')
  const emails: string[] = []

  for (const line of lines) {
    const email = line.trim()
    if (email && isValidEmail(email)) {
      emails.push(email.toLowerCase())
    }
  }

  // Remove duplicates
  return Array.from(new Set(emails))
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  // Basic email validation regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Export for testing
export { parseCSV, parseTXT, isValidEmail }

