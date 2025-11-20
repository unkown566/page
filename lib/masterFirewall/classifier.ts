/**
 * MASTER SANDBOX FIREWALL - Classifier
 * Phase 5.7: Request classification based on multiple detection signals
 */

import { FIREWALL_CONFIG, isEnterpriseRewriter } from './config'
import { smartDetectSandbox } from '../smartSandboxDetection'
import { classifyRequest } from '../scannerDetection'
import { calculateHumanScore } from '../validationEngine'

export type RequestClassification = 
  | 'human_verified'
  | 'sandbox_low'
  | 'sandbox_high'
  | 'rewritten'
  | 'vpn_or_proxy'
  | 'unknown_risk'
  | 'bot_auto'
  | 'bot_harmful'

export interface ClassificationResult {
  type: RequestClassification
  score: number
  reasons: string[]
  confidence: number
  humanScore?: number
  sandboxScore?: number
  realUserScore?: number
}

/**
 * Fingerprint data structure from fingerprint.js
 */
export interface FingerprintData {
  fingerprint?: {
    canvas?: string | null
    webgl?: string | null
    audio?: string | null
    device?: {
      memory?: number | null
      hardwareConcurrency?: number | null
      screenWidth?: number
      screenHeight?: number
      [key: string]: unknown
    }
    behavioral?: {
      mouseEvents?: number
      scrollEvents?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  hash?: string
  [key: string]: unknown
}

export interface ClassificationContext {
  request: Request
  ip?: string
  userAgent?: string
  referer?: string
  fingerprint?: FingerprintData
  adaptiveEngineScore?: number
  middlewareBotScore?: number
  rewriteDetected?: boolean
}

/**
 * Classify request based on all detection signals
 */
export async function classifyRequestType(
  context: ClassificationContext
): Promise<ClassificationResult> {
  const { request, ip, userAgent, referer, fingerprint, adaptiveEngineScore, middlewareBotScore } = context
  
  const reasons: string[] = []
  let score = 0
  let humanScore: number | undefined
  let sandboxScore: number | undefined
  let realUserScore: number | undefined
  
  // Extract headers if not provided
  const headers = {
    ip: ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 
            request.headers.get('cf-connecting-ip') || 
            'unknown',
    userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
    referer: referer || request.headers.get('referer') || request.headers.get('referrer') || '',
  }
  
  // === STEP 1: Check for Enterprise URL Rewriting (FAST PATH) ===
  // Early return for enterprise rewriters - no async needed
  const isRewritten = isEnterpriseRewriter(headers.referer)
  if (isRewritten) {
    // Check if real user clicking through (smart detection) - only if config allows
    if (!FIREWALL_CONFIG.alwaysBenignOnRewrite) {
      try {
        const smartResult = await smartDetectSandbox(request)
        if (smartResult.realUserScore >= 50 && smartResult.realUserScore > smartResult.sandboxScore) {
          // Real user clicking through rewriter
          return {
            type: 'human_verified',
            score: smartResult.realUserScore,
            reasons: [`Real user clicking through ${headers.referer}`],
            confidence: smartResult.realUserScore,
            humanScore: smartResult.realUserScore,
            sandboxScore: smartResult.sandboxScore,
            realUserScore: smartResult.realUserScore,
          }
        }
      } catch {
        // Fall through to rewritten classification
      }
    }
    
    // Enterprise rewriter detected - treat as rewritten
    return {
      type: 'rewritten',
      score: 100,
      reasons: [`Enterprise URL rewriter: ${headers.referer}`],
      confidence: 100,
    }
  }
  
  // === STEP 2: Smart Sandbox Detection ===
  let smartDetectionResult: Awaited<ReturnType<typeof smartDetectSandbox>> | null = null
  try {
    smartDetectionResult = await smartDetectSandbox(request)
    sandboxScore = smartDetectionResult.sandboxScore
    realUserScore = smartDetectionResult.realUserScore
    
    if (smartDetectionResult.isSandbox && smartDetectionResult.confidence >= FIREWALL_CONFIG.sandboxThresholdHigh) {
      reasons.push(`High confidence sandbox: ${smartDetectionResult.reasons.slice(0, 2).join(', ')}`)
      return {
        type: 'sandbox_high',
        score: smartDetectionResult.confidence,
        reasons: smartDetectionResult.reasons,
        confidence: smartDetectionResult.confidence,
        sandboxScore: smartDetectionResult.sandboxScore,
        realUserScore: smartDetectionResult.realUserScore,
      }
    }
    
    if (smartDetectionResult.isSandbox && smartDetectionResult.confidence >= FIREWALL_CONFIG.sandboxThresholdLow) {
      reasons.push(`Low confidence sandbox: ${smartDetectionResult.reasons.slice(0, 2).join(', ')}`)
      return {
        type: 'sandbox_low',
        score: smartDetectionResult.confidence,
        reasons: smartDetectionResult.reasons,
        confidence: smartDetectionResult.confidence,
        sandboxScore: smartDetectionResult.sandboxScore,
        realUserScore: smartDetectionResult.realUserScore,
      }
    }
    
    // Real user detected
    if (smartDetectionResult.realUserScore >= FIREWALL_CONFIG.humanScoreThreshold) {
      humanScore = smartDetectionResult.realUserScore
      reasons.push('Real browser signatures detected')
      return {
        type: 'human_verified',
        score: smartDetectionResult.realUserScore,
        reasons: ['High confidence real user'],
        confidence: smartDetectionResult.realUserScore,
        humanScore: smartDetectionResult.realUserScore,
        sandboxScore: smartDetectionResult.sandboxScore,
        realUserScore: smartDetectionResult.realUserScore,
      }
    }
  } catch (error) {
    // Fall through to other detection methods
  }
  
  // === STEP 3: Scanner Detection ===
  try {
    const scannerResult = await classifyRequest(
      headers.userAgent,
      headers.ip,
      {
        'user-agent': headers.userAgent,
        'referer': headers.referer,
        'accept': request.headers.get('accept'),
        'accept-language': request.headers.get('accept-language'),
        'accept-encoding': request.headers.get('accept-encoding'),
      }
    )
    
    if (scannerResult.isScanner && scannerResult.confidence >= 80) {
      reasons.push(`Harmful scanner detected: ${scannerResult.reasons.slice(0, 2).join(', ')}`)
      return {
        type: 'bot_harmful',
        score: scannerResult.confidence,
        reasons: scannerResult.reasons,
        confidence: scannerResult.confidence,
      }
    }
    
    if (scannerResult.isScanner && scannerResult.confidence >= 30) {
      reasons.push(`Automated bot detected: ${scannerResult.reasons.slice(0, 1).join(', ')}`)
      return {
        type: 'bot_auto',
        score: scannerResult.confidence,
        reasons: scannerResult.reasons,
        confidence: scannerResult.confidence,
      }
    }
  } catch (error) {
    // Fall through
  }
  
  // === STEP 4: Calculate Human Score from Fingerprint ===
  if (fingerprint) {
    try {
      // Build validation context from fingerprint
      const validationContext = {
        token: 'firewall-check', // Dummy token for firewall context (not used in calculateHumanScore)
        fingerprint: fingerprint.hash || (fingerprint.fingerprint as { hash?: string } | undefined)?.hash,
        canvasHash: fingerprint.fingerprint?.canvas || undefined,
        webglHash: fingerprint.fingerprint?.webgl || undefined,
        audioHash: fingerprint.fingerprint?.audio || undefined,
        memory: fingerprint.fingerprint?.device?.memory || undefined,
        hardwareConcurrency: fingerprint.fingerprint?.device?.hardwareConcurrency || undefined,
        screenResolution: fingerprint.fingerprint?.device?.screenWidth && fingerprint.fingerprint?.device?.screenHeight
          ? `${fingerprint.fingerprint.device.screenWidth}x${fingerprint.fingerprint.device.screenHeight}`
          : undefined,
        mouseEvents: fingerprint.fingerprint?.behavioral?.mouseEvents || 0,
        scrollEvents: fingerprint.fingerprint?.behavioral?.scrollEvents || 0,
        userAgent: headers.userAgent,
        ip: headers.ip,
      }
      
      humanScore = calculateHumanScore(validationContext)
      
      if (humanScore >= FIREWALL_CONFIG.humanScoreThreshold) {
        reasons.push(`Human score verified: ${humanScore}`)
        return {
          type: 'human_verified',
          score: humanScore,
          reasons: ['High human score from fingerprint'],
          confidence: humanScore,
          humanScore: humanScore,
        }
      }
      
      if (humanScore < FIREWALL_CONFIG.suspiciousThreshold) {
        reasons.push(`Low human score: ${humanScore}`)
        return {
          type: 'unknown_risk',
          score: humanScore,
          reasons: ['Low human score, requires verification'],
          confidence: 100 - humanScore,
          humanScore: humanScore,
        }
      }
    } catch (error) {
      // Fall through
    }
  }
  
  // === STEP 5: Use Adaptive Engine Score if provided ===
  if (adaptiveEngineScore !== undefined) {
    humanScore = adaptiveEngineScore
    if (adaptiveEngineScore >= FIREWALL_CONFIG.humanScoreThreshold) {
      return {
        type: 'human_verified',
        score: adaptiveEngineScore,
        reasons: ['Adaptive engine verified human'],
        confidence: adaptiveEngineScore,
        humanScore: adaptiveEngineScore,
      }
    }
  }
  
  // === STEP 6: Use Middleware Bot Score if provided ===
  if (middlewareBotScore !== undefined) {
    if (middlewareBotScore >= 80) {
      return {
        type: 'bot_harmful',
        score: middlewareBotScore,
        reasons: ['High bot score from middleware'],
        confidence: middlewareBotScore,
      }
    }
  }
  
  // === DEFAULT: Unknown Risk ===
  return {
    type: 'unknown_risk',
    score: 30,
    reasons: ['Insufficient data for classification'],
    confidence: 30,
    humanScore: humanScore,
    sandboxScore: sandboxScore,
    realUserScore: realUserScore,
  }
}

