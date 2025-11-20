/**
 * UNIFIED SECURITY BRAIN - Phase 5.10
 * 
 * Purpose: Aggregate all security signals into one final decision layer
 * 
 * CRITICAL RULES:
 * 1. NEVER block real humans under any circumstance
 * 2. If uncertain → ALWAYS give CAPTCHA first
 * 3. Only BLOCK when riskScore is clearly malicious (< -5)
 * 4. Unknown/Suspicious/Mixed MUST NEVER block
 */

import type { ValidationContext } from '../validationEngine'
import type { ClassificationResult, RequestClassification } from '../masterFirewall/classifier'
import type { BehaviorScore } from '../behavioral/behaviorModel'

export interface BrainDecision {
  riskScore: number              // Total weighted score
  behaviorScore: number          // From Phase 5.9 behavioral engine
  fingerprintScore: number       // From fingerprint engine
  firewallAction: string         // allow, captcha, safe-redirect, block
  sandboxFlag: boolean           // Sandbox detected
  rewriterFlag: boolean          // Enterprise rewriter detected
  isHumanLikely: boolean         // Human indicators present
  isBotLikely: boolean           // Bot indicators present
  requireCaptcha: boolean        // CAPTCHA required
  challengeBot: boolean          // Bot should receive CAPTCHA (not block)
  finalAction: 'ALLOW' | 'CAPTCHA' | 'SAFE_REDIRECT' | 'BLOCK'  // Final decision
  confidence: number             // Confidence level (0-1)
  reasons: string[]             // Decision reasons
}

export interface SecuritySignals {
  // Firewall signals
  firewallClassification?: ClassificationResult
  firewallAction?: string
  
  // Behavioral signals (Phase 5.9)
  behaviorScore?: BehaviorScore
  
  // Fingerprint signals
  fingerprintMatch?: boolean
  fingerprintConfidence?: number
  fingerprintBrowserConsistent?: boolean
  
  // Sandbox/Rewriter detection
  sandboxDetected?: boolean
  rewriterDetected?: boolean
  sandboxScore?: number
  
  // Smart detection
  smartDetectionRealUser?: boolean
  smartDetectionRoboticTiming?: boolean
  
  // Attempt tracking
  attemptCount?: number
  attemptHistory?: any
  
  // IP reputation (if available)
  ipReputation?: number
  
  // Device integrity
  deviceIntegrity?: number
  
  // Phase 5.11: Micro human verification score
  microHumanScore?: number
  
  // Browser capabilities
  browserCapabilities?: {
    hasWebGL?: boolean
    hasCanvas?: boolean
    hasAudio?: boolean
  }
  
  // Token pre-validation
  tokenValid?: boolean
  tokenExpired?: boolean
}

/**
 * Calculate risk score from all security signals
 */
function calculateRiskScore(signals: SecuritySignals): {
  riskScore: number
  behaviorScore: number
  fingerprintScore: number
  reasons: string[]
} {
  let riskScore = 0
  let behaviorScore = 0
  let fingerprintScore = 0
  const reasons: string[] = []

  // === BEHAVIORAL SCORING (Phase 5.9) ===
  if (signals.behaviorScore) {
    behaviorScore = signals.behaviorScore.score
    
    // === PHASE 5.11: Add micro human score (always positive) ===
    if (signals.microHumanScore !== undefined && signals.microHumanScore > 0) {
      // Micro human score is always additive (never negative)
      behaviorScore += signals.microHumanScore
      reasons.push(`Micro human signals detected (+${signals.microHumanScore})`)
    }
    
    if (behaviorScore > 5) {
      // Human-likely behavior
      riskScore += 10
      reasons.push(`Human-like behavior detected (score: ${behaviorScore})`)
    } else if (behaviorScore < 0) {
      // Bot-like behavior
      riskScore -= 10
      reasons.push(`Bot-like behavior detected (score: ${behaviorScore})`)
    } else {
      // Neutral (0-5)
      reasons.push(`Neutral behavior score (${behaviorScore})`)
    }
  } else if (signals.microHumanScore !== undefined && signals.microHumanScore > 0) {
    // If no behavior score but we have micro signals, add them directly
    behaviorScore = signals.microHumanScore
    riskScore += signals.microHumanScore * 0.5 // Add to risk score (positive only)
    reasons.push(`Micro human signals detected (+${signals.microHumanScore})`)
  }

  // === FINGERPRINT SCORING ===
  if (signals.fingerprintMatch !== undefined) {
    if (signals.fingerprintMatch && signals.fingerprintConfidence && signals.fingerprintConfidence > 0.7) {
      // Fingerprint match > 70%
      fingerprintScore = 5
      riskScore += 5
      reasons.push(`Fingerprint match confirmed (${Math.round(signals.fingerprintConfidence * 100)}%)`)
    } else if (!signals.fingerprintMatch) {
      // Fingerprint mismatch
      fingerprintScore = -3
      riskScore -= 3
      reasons.push('Fingerprint mismatch detected')
    }
  }

  // Browser consistency check
  if (signals.fingerprintBrowserConsistent === false) {
    fingerprintScore -= 5
    riskScore -= 5
    reasons.push('Browser fingerprint inconsistent')
  }

  // === SANDBOX/REWRITER DETECTION ===
  if (signals.rewriterDetected) {
    riskScore -= 10
    reasons.push('Enterprise URL rewriter detected')
  }

  if (signals.sandboxDetected) {
    riskScore -= 20
    reasons.push('Sandbox environment detected')
  }

  // === SMART DETECTION ===
  if (signals.smartDetectionRealUser) {
    riskScore += 3
    reasons.push('Smart detection: Real user action detected')
  }

  if (signals.smartDetectionRoboticTiming) {
    riskScore -= 5
    reasons.push('Smart detection: Robotic timing pattern')
  }

  // === ATTEMPT TRACKING ===
  if (signals.attemptCount !== undefined) {
    if (signals.attemptCount >= 4) {
      // 4-attempt rule: Trust established
      riskScore += 5
      reasons.push(`4-attempt rule: Trust established (${signals.attemptCount} attempts)`)
    } else if (signals.attemptCount > 0) {
      // Some attempts but not yet 4
      riskScore += 1
      reasons.push(`Attempt history: ${signals.attemptCount} attempts`)
    }
  }

  // === DEVICE INTEGRITY ===
  if (signals.deviceIntegrity !== undefined) {
    if (signals.deviceIntegrity > 0.7) {
      riskScore += 2
      reasons.push('High device integrity')
    } else if (signals.deviceIntegrity < 0.3) {
      riskScore -= 2
      reasons.push('Low device integrity')
    }
  }

  // === BROWSER CAPABILITIES ===
  if (signals.browserCapabilities) {
    const { hasWebGL, hasCanvas, hasAudio } = signals.browserCapabilities
    
    if (hasWebGL && hasCanvas && hasAudio) {
      riskScore += 2
      reasons.push('Full browser capabilities present')
    } else if (!hasWebGL && !hasCanvas) {
      riskScore -= 2
      reasons.push('Limited browser capabilities')
    }
  }

  // === IP REPUTATION ===
  if (signals.ipReputation !== undefined) {
    if (signals.ipReputation < 0.3) {
      riskScore -= 3
      reasons.push('Low IP reputation')
    } else if (signals.ipReputation > 0.7) {
      riskScore += 1
      reasons.push('Good IP reputation')
    }
  }

  return { riskScore, behaviorScore, fingerprintScore, reasons }
}

/**
 * Determine final action based on risk score and safety rules
 * 
 * SAFETY RULES (MANDATORY):
 * 1. Sandboxes/rewriters ALWAYS get safe redirect (never block)
 * 2. Unknown/suspicious ALWAYS get CAPTCHA (never block)
 * 3. Only block when ABSOLUTELY confirmed malicious
 * 4. Block requires TWO independent malicious indicators
 */
function determineFinalAction(
  riskScore: number,
  behaviorScore: number,
  fingerprintScore: number,
  sandboxFlag: boolean,
  rewriterFlag: boolean,
  signals: SecuritySignals,
  blockThreshold: number = -10 // Default threshold, can be overridden from settings
): {
  finalAction: 'ALLOW' | 'CAPTCHA' | 'SAFE_REDIRECT' | 'BLOCK'
  requireCaptcha: boolean
  reasons: string[]
} {
  const reasons: string[] = []

  // === RULE 1: Sandboxes/Rewriters ALWAYS get safe redirect (override CAPTCHA) ===
  if (sandboxFlag || rewriterFlag) {
    reasons.push('Sandbox/rewriter detected → Safe redirect (never block, never CAPTCHA)')
    return {
      finalAction: 'SAFE_REDIRECT',
      requireCaptcha: false,
      reasons,
    }
  }
  
  // === RULE 2: High risk but uncertain → CAPTCHA (never block) ===
  if (riskScore < -5) {
    reasons.push(`High risk score (${riskScore}) → CAPTCHA required (safety: never block on uncertainty)`)
    return {
      finalAction: 'CAPTCHA',
      requireCaptcha: true,
      reasons,
    }
  }

  // === RULE 3: Medium risk → CAPTCHA ===
  if (riskScore >= -5 && riskScore < 3) {
    reasons.push(`Medium risk score (${riskScore}) → CAPTCHA required`)
    return {
      finalAction: 'CAPTCHA',
      requireCaptcha: true,
      reasons,
    }
  }

  // === RULE 4: Low risk → ALLOW ===
  if (riskScore >= 3) {
    reasons.push(`Low risk score (${riskScore}) → Allow access`)
    return {
      finalAction: 'ALLOW',
      requireCaptcha: false,
      reasons,
    }
  }

  // === RULE 5: BLOCK ONLY IF ABSOLUTELY CONFIRMED MALICIOUS ===
  // Block requires:
  // - NOT a sandbox/rewriter
  // - Behavior score < blockThreshold (from settings, default -10)
  // - Fingerprint score < blockThreshold
  // - Two independent malicious indicators
  const hasTwoMaliciousIndicators = 
    (behaviorScore < blockThreshold && fingerprintScore < blockThreshold) ||
    (signals.sandboxDetected && signals.rewriterDetected) ||
    (behaviorScore < (blockThreshold - 5) && signals.smartDetectionRoboticTiming)

  if (
    !sandboxFlag &&
    !rewriterFlag &&
    behaviorScore < blockThreshold &&
    fingerprintScore < blockThreshold &&
    hasTwoMaliciousIndicators
  ) {
    reasons.push(`BLOCK: Confirmed malicious (behavior: ${behaviorScore}, fingerprint: ${fingerprintScore}, two indicators)`)
    return {
      finalAction: 'BLOCK',
      requireCaptcha: false,
      reasons,
    }
  }

  // === DEFAULT: Always fall back to CAPTCHA (safety first) ===
  reasons.push('Uncertain classification → CAPTCHA (safety: never block on uncertainty)')
  return {
    finalAction: 'CAPTCHA',
    requireCaptcha: true,
    reasons,
  }
}

/**
 * Extract security signals from validation context
 */
function extractSignals(context: ValidationContext): SecuritySignals {
  const signals: SecuritySignals = {}

  // Behavioral signals
  if (context.behavior) {
    signals.behaviorScore = {
      score: context.behavior.score,
      category: context.behavior.category,
      confidence: 0.5,
      reasons: [],
    }
  }

  // Fingerprint signals
  if (context.fingerprint) {
    // Check if fingerprint matches (simplified - actual logic in validationEngine)
    signals.fingerprintMatch = context.fingerprintChanged === false
    signals.fingerprintConfidence = context.humanScore ? context.humanScore / 100 : 0.5
    signals.fingerprintBrowserConsistent = true // Simplified
  }

  // Sandbox/rewriter detection (from firewall)
  if (context.skipAttemptIncrement || context.skipTokenBurn) {
    // These flags suggest sandbox/rewriter detection
    signals.sandboxDetected = context.skipAttemptIncrement === true
    signals.rewriterDetected = context.skipTokenBurn === true
  }

  // Browser capabilities
  signals.browserCapabilities = {
    hasWebGL: context.webglHash !== undefined,
    hasCanvas: context.canvasHash !== undefined,
    hasAudio: context.audioHash !== undefined,
  }

  // Attempt tracking
  if (context.attempts !== undefined) {
    signals.attemptCount = context.attempts
  }

  // Human score as device integrity proxy
  if (context.humanScore !== undefined) {
    signals.deviceIntegrity = context.humanScore / 100
  }

  // Bot detection
  if (context.isBot === true) {
    signals.smartDetectionRoboticTiming = true
  } else if (context.humanScore && context.humanScore > 50) {
    signals.smartDetectionRealUser = true
  }

  return signals
}

/**
 * Main decision brain function
 * 
 * Aggregates all security signals and produces final decision
 * 
 * SAFETY GUARANTEES:
 * 1. Real humans NEVER blocked
 * 2. Unknown → CAPTCHA (never block)
 * 3. Sandboxes/rewriters → Safe redirect (never block)
 * 4. Only block when ABSOLUTELY confirmed malicious
 */
export async function decisionBrain(
  context: ValidationContext,
  additionalSignals?: Partial<SecuritySignals>
): Promise<BrainDecision> {
  // Load settings first
  const { getCachedSettings } = await import('../adminSettings')
  let brainSettings
  try {
    const settings = getCachedSettings()
    brainSettings = settings.security?.securityBrain || {
      enabled: true,
      strictMode: false,
      blockThreshold: -10
    }
    
    // PRIORITY ZERO FIX: Safe defaults for blockThreshold
    // Ensure blockThreshold is always a valid number with safe fallback
    let blockThreshold = Number(brainSettings.blockThreshold ?? -10)
    
    // Guard: If NaN or undefined, use -10
    if (isNaN(blockThreshold)) {
      blockThreshold = -10
    }
    
    // Guard: If blockThreshold > -1, force it to at least -1 to avoid blocking everyone
    // (Negative values are more restrictive, positive values would block everyone)
    if (blockThreshold > -1) {
      blockThreshold = -1
    }
    
    // Update brainSettings with safe blockThreshold
    brainSettings = {
      ...brainSettings,
      blockThreshold
    }
  } catch (error) {
    console.error('[SECURITY BRAIN] Failed to load settings, using defaults:', error)
    brainSettings = {
      enabled: true,
      strictMode: false,
      blockThreshold: -10
    }
  }
  
  // Extract signals from context
  const baseSignals = extractSignals(context)
  const signals: SecuritySignals = { ...baseSignals, ...additionalSignals }

  // Calculate risk scores
  const { riskScore, behaviorScore, fingerprintScore, reasons: scoreReasons } = calculateRiskScore(signals)
  
  // PRIORITY ZERO FIX: Ensure behaviorScore is never undefined
  const safeBehaviorScore = behaviorScore ?? 0
  const safeFingerprintScore = fingerprintScore ?? 0

  // Determine sandbox/rewriter flags
  const sandboxFlag = signals.sandboxDetected === true
  const rewriterFlag = signals.rewriterDetected === true

  // Determine human/bot likelihood (ensure boolean)
  // PRIORITY ZERO FIX: Use safe behaviorScore
  const isHumanLikely: boolean = Boolean(
    safeBehaviorScore > 5 ||
    (signals.fingerprintMatch && signals.fingerprintConfidence && signals.fingerprintConfidence > 0.7) ||
    signals.smartDetectionRealUser === true ||
    (context.humanScore && context.humanScore > 50)
  )

  const isBotLikely: boolean = Boolean(
    safeBehaviorScore < 0 ||
    signals.smartDetectionRoboticTiming === true ||
    context.isBot === true ||
    (context.humanScore && context.humanScore < 20)
  )

  // Get firewall action (if available)
  let firewallAction = 'allow'
  if (signals.firewallAction) {
    firewallAction = signals.firewallAction
  } else if (sandboxFlag || rewriterFlag) {
    firewallAction = 'safe-redirect'
  } else if (riskScore < 0) {
    firewallAction = 'captcha'
  }

  // PRIORITY ZERO FIX: Ensure blockThreshold is safe before passing to determineFinalAction
  let safeBlockThreshold = Number(brainSettings.blockThreshold ?? -10)
  if (isNaN(safeBlockThreshold)) {
    safeBlockThreshold = -10
  }
  // Guard: If blockThreshold > -1, force it to at least -1 to avoid blocking everyone
  if (safeBlockThreshold > -1) {
    safeBlockThreshold = -1
  }
  
  // Determine final action (with safety rules)
  // PRIORITY ZERO FIX: Use safe scores
  let { finalAction, requireCaptcha, reasons: actionReasons } = determineFinalAction(
    riskScore,
    safeBehaviorScore,
    safeFingerprintScore,
    sandboxFlag,
    rewriterFlag,
    signals,
    safeBlockThreshold // Pass safe blockThreshold
  )
  
  // === BOT HANDLING: Bots get CAPTCHA, not BLOCK ===
  // Check if this is a bot (via signals or context)
  const isBotDetected = 
    isBotLikely ||
    signals.smartDetectionRoboticTiming === true ||
    (signals.behaviorScore && signals.behaviorScore.category === 'BOT')
  
  // If bot detected and not sandbox/rewriter, require CAPTCHA instead of BLOCK
  if (isBotDetected && !sandboxFlag && !rewriterFlag) {
    if (finalAction === 'BLOCK') {
      finalAction = 'CAPTCHA'
      requireCaptcha = true
      actionReasons.push('Bot detected → CAPTCHA required (not block)')
    } else if (finalAction === 'ALLOW' && isBotLikely) {
      // Even if risk score is high, bots should get CAPTCHA
      finalAction = 'CAPTCHA'
      requireCaptcha = true
      actionReasons.push('Bot indicators detected → CAPTCHA required')
    }
  }

  // Calculate confidence
  let confidence = 0.5
  if (isHumanLikely && !isBotLikely) {
    confidence = 0.8
  } else if (isBotLikely && !isHumanLikely) {
    confidence = 0.7
  } else if (riskScore >= 3) {
    confidence = 0.7
  } else if (riskScore < -5) {
    confidence = 0.6
  }

  // Combine all reasons
  const allReasons = [...scoreReasons, ...actionReasons]
  
  // Determine if bot should be challenged (CAPTCHA, not block)
  const challengeBot: boolean = Boolean(isBotDetected && !sandboxFlag && !rewriterFlag && finalAction !== 'SAFE_REDIRECT')

  return {
    riskScore,
    behaviorScore: safeBehaviorScore, // PRIORITY ZERO FIX: Return safe score
    fingerprintScore: safeFingerprintScore, // PRIORITY ZERO FIX: Return safe score
    firewallAction,
    sandboxFlag,
    rewriterFlag,
    isHumanLikely,
    isBotLikely,
    requireCaptcha,
    challengeBot, // Bot CAPTCHA logic
    finalAction,
    confidence,
    reasons: allReasons,
  }
}

