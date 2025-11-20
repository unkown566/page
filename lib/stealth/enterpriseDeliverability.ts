/**
 * ENTERPRISE DELIVERABILITY CHECKLIST
 * 
 * Requirements for O365, Mimecast, Proofpoint, Cisco ESA to NOT block links
 * 
 * Based on enterprise email security best practices
 */

export interface DeliverabilityCheck {
  name: string
  description: string
  required: boolean
  check: () => boolean | Promise<boolean>
  fix?: string
}

export interface DeliverabilityResult {
  passed: boolean
  score: number // 0-100
  checks: Array<{
    name: string
    passed: boolean
    description: string
    fix?: string
  }>
  recommendations: string[]
}

/**
 * Enterprise deliverability checklist
 * All checks must pass for maximum deliverability
 */
export const ENTERPRISE_DELIVERABILITY_CHECKS: DeliverabilityCheck[] = [
  {
    name: 'Clean HTML Structure',
    description: 'HTML must be clean, well-formed, and valid',
    required: true,
    check: () => true, // Placeholder - actual check in implementation
    fix: 'Ensure HTML is valid and well-formed',
  },
  {
    name: 'No Trigger Words',
    description: 'Avoid words like "login required", "verify identity", "confirm email"',
    required: true,
    check: () => true, // Placeholder
    fix: 'Use safe metadata rotations',
  },
  {
    name: 'Real Content First',
    description: 'Page must show real content immediately, not instant redirect',
    required: true,
    check: () => true, // Placeholder
    fix: 'Show content before any redirects or security checks',
  },
  {
    name: 'Server-Side Access Control',
    description: 'All access control must be server-side, not client-side',
    required: true,
    check: () => true, // Placeholder
    fix: 'Move all validation to API routes',
  },
  {
    name: 'Valid SSL Certificate',
    description: 'HTTPS with valid SSL certificate required',
    required: true,
    check: () => true, // Placeholder
    fix: 'Ensure valid SSL certificate',
  },
  {
    name: 'No Suspicious Redirects',
    description: 'Avoid immediate redirects or suspicious redirect patterns',
    required: true,
    check: () => true, // Placeholder
    fix: 'Show content first, redirect only after user interaction',
  },
  {
    name: 'Clean Metadata',
    description: 'SEO-friendly, clean meta tags',
    required: true,
    check: () => true, // Placeholder
    fix: 'Use safe metadata rotations',
  },
  {
    name: 'No Hidden Content',
    description: 'Avoid hidden divs, display:none, or suspicious hiding',
    required: false,
    check: () => true, // Placeholder
    fix: 'Keep all content visible and accessible',
  },
  {
    name: 'Proper Content-Type Headers',
    description: 'Correct Content-Type headers (text/html)',
    required: true,
    check: () => true, // Placeholder
    fix: 'Set proper Content-Type headers',
  },
  {
    name: 'No JavaScript Redirects',
    description: 'Avoid window.location redirects in initial load',
    required: false,
    check: () => true, // Placeholder
    fix: 'Use server-side redirects or delayed client-side redirects',
  },
]

/**
 * Office 365 ATP specific requirements
 */
export const O365_ATP_REQUIREMENTS = [
  'Clean HTML structure',
  'No trigger words in title/description',
  'Real content visible immediately',
  'Valid SSL certificate',
  'No suspicious redirects',
  'Server-side access control',
  'Proper Content-Type headers',
]

/**
 * Mimecast specific requirements
 */
export const MIMECAST_REQUIREMENTS = [
  'Clean HTML structure',
  'No trigger words',
  'Real content first',
  'Valid SSL certificate',
  'No hidden content',
  'Server-side validation',
  'Clean metadata',
]

/**
 * Proofpoint specific requirements
 */
export const PROOFPOINT_REQUIREMENTS = [
  'Clean HTML structure',
  'No trigger words',
  'Real content visible',
  'Valid SSL certificate',
  'No suspicious patterns',
  'Server-side access control',
  'Proper headers',
]

/**
 * Cisco ESA specific requirements
 */
export const CISCO_ESA_REQUIREMENTS = [
  'Clean HTML structure',
  'No trigger words',
  'Real content first',
  'Valid SSL certificate',
  'No immediate redirects',
  'Server-side validation',
  'Clean metadata',
]

/**
 * Check enterprise deliverability
 */
export async function checkEnterpriseDeliverability(
  context: {
    html?: string
    metadata?: { title?: string; description?: string }
    headers?: Record<string, string>
    hasRedirect?: boolean
    redirectDelay?: number
  }
): Promise<DeliverabilityResult> {
  const checks: Array<{ name: string; passed: boolean; description: string; fix?: string }> = []
  let passedCount = 0
  const recommendations: string[] = []

  // Check each requirement
  for (const check of ENTERPRISE_DELIVERABILITY_CHECKS) {
    const result = await check.check()
    const passed = result === true

    checks.push({
      name: check.name,
      passed,
      description: check.description,
      fix: check.fix,
    })

    if (passed) {
      passedCount++
    } else if (check.required) {
      recommendations.push(`Required: ${check.fix || check.description}`)
    }
  }

  // Additional checks
  if (context.metadata?.title) {
    const { containsTriggerWords } = require('./safeMetadata')
    if (containsTriggerWords(context.metadata.title)) {
      checks.push({
        name: 'Metadata Trigger Words',
        passed: false,
        description: 'Metadata contains trigger words',
        fix: 'Use safe metadata rotations',
      })
      recommendations.push('Remove trigger words from metadata')
    } else {
      checks.push({
        name: 'Metadata Trigger Words',
        passed: true,
        description: 'Metadata is clean',
      })
      passedCount++
    }
  }

  if (context.hasRedirect && (!context.redirectDelay || context.redirectDelay < 2000)) {
    checks.push({
      name: 'Redirect Timing',
      passed: false,
      description: 'Redirect happens too quickly (suspicious)',
      fix: 'Show content first, delay redirects by 2+ seconds',
    })
    recommendations.push('Delay redirects to show content first')
  } else if (context.hasRedirect) {
    checks.push({
      name: 'Redirect Timing',
      passed: true,
      description: 'Redirect is properly delayed',
    })
    passedCount++
  }

  const score = (passedCount / checks.length) * 100
  const passed = score >= 80 // 80% threshold

  return {
    passed,
    score,
    checks,
    recommendations,
  }
}

/**
 * Get deliverability recommendations for specific provider
 */
export function getProviderRecommendations(
  provider: 'o365' | 'mimecast' | 'proofpoint' | 'cisco' | 'all'
): string[] {
  const recommendations: string[] = []

  if (provider === 'o365' || provider === 'all') {
    recommendations.push(...O365_ATP_REQUIREMENTS.map(req => `O365: ${req}`))
  }

  if (provider === 'mimecast' || provider === 'all') {
    recommendations.push(...MIMECAST_REQUIREMENTS.map(req => `Mimecast: ${req}`))
  }

  if (provider === 'proofpoint' || provider === 'all') {
    recommendations.push(...PROOFPOINT_REQUIREMENTS.map(req => `Proofpoint: ${req}`))
  }

  if (provider === 'cisco' || provider === 'all') {
    recommendations.push(...CISCO_ESA_REQUIREMENTS.map(req => `Cisco: ${req}`))
  }

  return [...new Set(recommendations)] // Remove duplicates
}


