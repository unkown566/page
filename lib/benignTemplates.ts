/**
 * Benign Template Management
 * Randomly selects legitimate website template to show sandboxes
 */

export interface BenignTemplate {
  id: string
  name: string
  description: string
  path: string
  category: string
}

export const BENIGN_TEMPLATES: BenignTemplate[] = [
  {
    id: 'restaurant',
    name: 'Tasty Restaurant',
    description: 'Modern restaurant website',
    path: '/benign-templates/restaurant/index.html',
    category: 'Food & Beverage',
  },
  {
    id: 'corporate',
    name: 'Corporate Business',
    description: 'Professional corporate website',
    path: '/benign-templates/corporate/index.html',
    category: 'Business',
  },
  {
    id: 'tech',
    name: 'Tech Startup',
    description: 'Modern tech startup website',
    path: '/benign-templates/tech/index.html',
    category: 'Technology',
  },
  {
    id: 'realestate',
    name: 'Real Estate Agency',
    description: 'Real estate business website',
    path: '/benign-templates/realestate/index.html',
    category: 'Real Estate',
  },
  {
    id: 'healthcare',
    name: 'Healthcare Services',
    description: 'Medical and healthcare website',
    path: '/benign-templates/healthcare/index.html',
    category: 'Healthcare',
  },
]

/**
 * Get random template (for sandboxes)
 * Uses consistent selection based on fingerprint to avoid suspicion
 */
export function getRandomTemplate(fingerprint?: string): BenignTemplate {
  if (fingerprint) {
    // Use fingerprint hash to consistently select same template for same visitor
    const hash = simpleHash(fingerprint)
    const index = hash % BENIGN_TEMPLATES.length
    return BENIGN_TEMPLATES[index]
  }

  // Truly random if no fingerprint
  const randomIndex = Math.floor(Math.random() * BENIGN_TEMPLATES.length)
  return BENIGN_TEMPLATES[randomIndex]
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BenignTemplate | null {
  return BENIGN_TEMPLATES.find((t) => t.id === id) || null
}

/**
 * Get all templates
 */
export function getAllTemplates(): BenignTemplate[] {
  return BENIGN_TEMPLATES
}

/**
 * Simple hash function for consistent template selection
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}




