/**
 * ADAPTIVE LINK EXPIRY ENGINE - Phase 5.6
 * 
 * Implements adaptive validation rules:
 * - 4-Attempt Rule (after 4 attempts → allow forever)
 * - Bot-Friendly / No Burn Rule (bot clicks don't expire links)
 * - Soft Device Binding (fingerprint mismatch allowed if human score > 0)
 * - Human Score Enforcer
 * - Attempt Tracking (per-day)
 * - Session Locking
 * - Bot Click Logging (no block)
 * - No-negative-user logic (never harm the real recipient)
 */

import { getLinkByToken, getLinkById, type LinkRecord } from './linkDatabaseSql'
import { decryptToken, type TokenPayload, InvalidTokenError } from './tokenEngine'
import { getAttemptCount, recordAttempt, resetAttempt } from './attemptTracker'
import { logSecurityEvent } from './securityMonitoring'
import { getCachedSettings } from './adminSettings'
import { hasCompletedLogin, recordSuccessfulLogin, getRecordsForEmail } from './fingerprintStorage'
import { createHash } from 'crypto'

// ============================================
// Type Definitions
// ============================================

export interface ValidationContext {
  token: string
  email?: string
  fingerprint?: string
  ip?: string
  userAgent?: string
  humanScore?: number
  isBot?: boolean
  botScore?: number
  honeypotTriggered?: boolean
  cloudflareBotScore?: number
  behaviorScore?: number
  mouseEvents?: number
  scrollEvents?: number
  canvasHash?: string
  webglHash?: string
  audioHash?: string
  timestamp?: number
  // Firewall flags (Phase 5.7)
  skipAttemptIncrement?: boolean
  skipTokenBurn?: boolean
  // Phase 5.8: Mutation key for polymorphic cloaking
  mutationKey?: string
  // Phase 5.9: Behavioral analysis
  behavior?: {
    score: number
    category: 'HUMAN' | 'BOT' | 'UNKNOWN'
  }
  // Phase 5.10: Unified Security Brain decision
  brainDecision?: import('./securityBrain/decisionBrain').BrainDecision
  // Phase 5.11: Micro human verification score
  microHumanScore?: number
  // PATCH 1: CAPTCHA session ID (from httpOnly cookie)
  captchaSessionId?: string
  [key: string]: any
}

export interface AdaptiveValidationResult {
  status: 'valid' | 'suspicious' | 'challenge' | 'bot' | 'invalid' | 'expired' | 'used' | 'safe_redirect' // PATCH 2: Added safe_redirect
  allowAccess?: boolean
  requireCaptcha?: boolean
  behavior?: {
    score: number
    category: 'HUMAN' | 'BOT' | 'UNKNOWN'
  }
  brainDecision?: import('./securityBrain/decisionBrain').BrainDecision // Phase 5.10: Security brain decision
  email?: string
  attempts?: number
  allowRedirect?: boolean
  reason?: string
  skipExpiry?: boolean
  skipDeviceChecks?: boolean
  fingerprintChanged?: boolean
  humanScore?: number
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate human score from context
 * Exported for use in master firewall
 */
export function calculateHumanScore(context: ValidationContext): number {
  let score = 0
  
  // Base score for having fingerprint data
  if (context.fingerprint) score += 20
  
  // Behavior indicators
  if (context.mouseEvents && context.mouseEvents > 5) score += 15
  if (context.scrollEvents && context.scrollEvents > 3) score += 15
  
  // Canvas/WebGL/Audio entropy
  if (context.canvasHash) score += 10
  if (context.webglHash) score += 10
  if (context.audioHash) score += 10
  
  // Cloudflare bot score (inverted: lower bot score = higher human score)
  if (context.cloudflareBotScore !== undefined) {
    const humanScore = 100 - context.cloudflareBotScore
    score += humanScore * 0.2 // 20% weight
  }
  
  // Behavior score
  if (context.behaviorScore !== undefined) {
    score += context.behaviorScore * 0.3 // 30% weight
  }
  
  // Penalties
  if (context.honeypotTriggered) score -= 50
  if (context.isBot) score -= 30
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Detect if request is from a bot
 */
function detectBot(context: ValidationContext): boolean {
  // Explicit bot flag
  if (context.isBot === true) return true
  
  // Honeypot triggered
  if (context.honeypotTriggered === true) return true
  
  // High Cloudflare bot score
  if (context.cloudflareBotScore !== undefined && context.cloudflareBotScore > 80) return true
  
  // Low behavior score
  if (context.behaviorScore !== undefined && context.behaviorScore < 20) return true
  
  // Missing fingerprint data (suspicious)
  if (!context.fingerprint && !context.canvasHash && !context.webglHash) {
    // But allow if user-agent looks legitimate
    const ua = context.userAgent || ''
    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
      return true
    }
  }
  
  return false
}

/**
 * Get fingerprint hash for comparison
 */
function getFingerprintHash(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Get today's date key (YYYY-MM-DD)
 */
function getTodayKey(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

/**
 * Get attempt key for per-day tracking
 */
function getAttemptKey(email: string, token: string): string {
  const today = getTodayKey()
  return `attempt:${email}:${token}:${today}`
}

// ============================================
// Main Adaptive Decision Engine
// ============================================

/**
 * Adaptive decision engine for link validation
 * 
 * Implements:
 * - 4-Attempt Rule
 * - Bot-Friendly / No Burn Rule
 * - Soft Device Binding
 * - Human Score Enforcement
 * - Attempt Tracking
 * - Session Locking
 * - Phase 5.10: Unified Security Brain integration
 */
export async function adaptiveDecisionEngine(
  context: ValidationContext
): Promise<AdaptiveValidationResult> {
  const { token, email } = context
  
  // === PATCH 1: CHECK CAPTCHA SESSION (BEFORE ANY CHECKS) ===
  // If user already solved CAPTCHA, skip all challenges
  let captchaSessionVerified = false
  if (context.captchaSessionId) {
    try {
      const { sql } = await import('./sql')
      const now = Math.floor(Date.now() / 1000)
      const session = sql.get<{ sessionId: string }>(
        `SELECT sessionId FROM captcha_sessions
         WHERE sessionId = ? AND expiresAt > ?`,
        [context.captchaSessionId, now]
      )
      if (session) {
        captchaSessionVerified = true
      }
    } catch (error) {
      // Fail silently - session check is optional
    }
  }
  
  // === PHASE 5.10: UNIFIED SECURITY BRAIN ===
  // Aggregate all security signals into one final decision
  // PATCH 3: Moved to top (before bot detection)
  let brainDecision: import('./securityBrain/decisionBrain').BrainDecision | null = null
  try {
    const { decisionBrain } = await import('./securityBrain/decisionBrain')
    brainDecision = await decisionBrain(context)
    context.brainDecision = brainDecision
    
    // PATCH 1: Override brain CAPTCHA decision when session is verified
    if (captchaSessionVerified && brainDecision && brainDecision.finalAction === 'CAPTCHA') {
      // Human already solved CAPTCHA - override brain CAPTCHA decision
      // Change brain decision to ALLOW to prevent re-challenge
      brainDecision.finalAction = 'ALLOW'
      brainDecision.requireCaptcha = false
      brainDecision.reasons.push('CAPTCHA session verified - overriding brain CAPTCHA decision')
    }
    
    // PATCH 3: Check brain decision BEFORE bot detection
    if (brainDecision.finalAction === 'CAPTCHA' && !captchaSessionVerified) {
      return {
        status: 'challenge',
        requireCaptcha: true,
        allowAccess: false,
        allowRedirect: false,
        reason: 'Security brain requires CAPTCHA',
        brainDecision: brainDecision,
      }
    }
    
    if (brainDecision.finalAction === 'SAFE_REDIRECT') {
      return {
        status: 'safe_redirect',
        requireCaptcha: false,
        allowAccess: false,
        allowRedirect: false,
        reason: 'Security brain: safe redirect required',
        brainDecision: brainDecision,
      }
    }
  } catch (error) {
    // Fail silently - brain is optional enhancement
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security brain failed:', error)
    }
  }
  
  // STEP 1: Detect Bot (PATCH 3: Now runs AFTER brain decision)
  const isBot = detectBot(context)
  
  // Check if brain decision indicates sandbox/rewriter (these should get safe redirect, not CAPTCHA)
  let isSandbox = brainDecision?.sandboxFlag === true
  let isRewriter = brainDecision?.rewriterFlag === true
  
  // PATCH 2 (FIX-4): Fallback sandbox/rewriter detection if brain fails
  if (!brainDecision) {
    if (context.skipAttemptIncrement === true) {
      isSandbox = true
    }
    if (context.skipTokenBurn === true) {
      isRewriter = true
    }
  }
  
  if (isBot && !isSandbox && !isRewriter) {
    // Bot click - DO NOT burn token, DO NOT apply attempts
    // BOT → require CAPTCHA (not block)
    await logSecurityEvent({
      type: 'bot_detected',
      ip: context.ip || 'unknown',
      fingerprint: context.fingerprint,
      severity: 'low',
      details: {
        token: token.substring(0, 10) + '...',
        botScore: context.botScore,
        cloudflareBotScore: context.cloudflareBotScore,
        behaviorScore: context.behaviorScore,
        action: 'CAPTCHA required',
      },
      userAgent: context.userAgent,
    })
    
    // Ensure token burn and attempt increment are disabled for bots
    context.skipAttemptIncrement = true
    context.skipTokenBurn = true
    
    return {
      status: 'challenge',
      requireCaptcha: true,
      allowAccess: false,
      allowRedirect: false,
      reason: 'Bot detected — CAPTCHA required',
      brainDecision: brainDecision || undefined,
    }
  }
  
    // STEP 2: Load Link Row
    let link: LinkRecord | null = null
    let payload: TokenPayload | null = null
    let extractedEmail: string | null = null
    
    try {
      // Try to decrypt token to get email (for v1/v2/v3 tokens)
      try {
        if (token.startsWith('v1_') || token.startsWith('v2_') || token.startsWith('v3_')) {
          payload = decryptToken(token) as TokenPayload
          extractedEmail = payload.email || null
        }
      } catch (error) {
        // Token might be simple token (Type B/C) - will get from database
      }
      
      // Get link from database
      link = await getLinkByToken(token)
      
      // If email not in payload, use provided email or link email
      const finalEmail = email || extractedEmail || (link ? link.email : null)
      
      if (!link) {
        return {
          status: 'invalid',
          reason: 'Link not found',
          allowAccess: false,
        }
      }
      
      if (!finalEmail) {
        // For generic links, email might come later - allow for now
        if (link.type === 'generic') {
          // Will validate email later in the flow
        } else {
          return {
            status: 'invalid',
            reason: 'Email not found',
            allowAccess: false,
          }
        }
      }
    
    // STEP 3: Apply 4-Attempt Rule
    // Only apply if we have an email
    let attempts = 0
    if (finalEmail) {
      const attemptKey = getAttemptKey(finalEmail, token)
      attempts = await getAttemptCount(attemptKey)
    }
    
    if (attempts >= 4) {
      // 4 attempts reached - allow forever
      return {
        status: 'valid',
        allowAccess: true,
        skipExpiry: true,
        skipDeviceChecks: true,
        email: finalEmail || undefined,
        attempts: attempts,
        allowRedirect: true,
      }
    }
    
    // STEP 4: Check Expiration (only if attempts < 1 and humanScore = 0)
    const humanScore = context.humanScore !== undefined 
      ? context.humanScore 
      : calculateHumanScore(context)
    
    let securityMode = 'strict'
    let allowAllLinks = false
    try {
      const settings = getCachedSettings()
      securityMode = settings.security?.securityMode || 'strict'
      allowAllLinks = settings.linkManagement?.allowAllLinks || false
    } catch (error) {
      console.error('[VALIDATION] Failed to load settings, using defaults:', error)
      // Use default 'strict' mode and allowAllLinks = false
    }
    
    if (attempts < 1 && humanScore === 0 && !allowAllLinks) {
      const now = Math.floor(Date.now() / 1000)
      if (link.expires_at && link.expires_at < now) {
        return {
          status: 'expired',
          reason: 'Link expired',
          allowAccess: false,
        }
      }
    }
    
    // STEP 5: Check if already used (only for personalized links)
    if (link.type === 'personalized' && link.used === 1) {
      // But allow if attempts >= 4 (4-attempt rule override)
      if (attempts < 4) {
        return {
          status: 'used',
          reason: 'Link already used',
          allowAccess: false,
        }
      }
    }
    
    // === PHASE 5.11: MICRO HUMAN VERIFICATION ===
    // Read micro human score and add to behavior score (before behavioral analysis)
    let microHumanScore = 0
    let microHumanWeight = 0.3 // Default weight
    
    try {
      const settings = getCachedSettings()
      const behavioralSettings = settings.security?.behavioral
      const enableMicroSignals = behavioralSettings?.enableMicroHumanSignals !== false
      microHumanWeight = behavioralSettings?.microHumanWeight ?? 0.3
      
      if (enableMicroSignals && context.microHumanScore !== undefined) {
        microHumanScore = context.microHumanScore
        // PRIORITY ZERO FIX: Ensure behaviorScore is always a number
        // Add to behaviorScore with weight (NEVER negative)
        const currentBehaviorScore = context.behaviorScore ?? 0
        context.behaviorScore = currentBehaviorScore + (microHumanScore * microHumanWeight)
      }
    } catch (error) {
      // Fail silently - micro signals are optional
    }
    
    // STEP 5.5: Behavioral Analysis (Phase 5.9)
    // Fetch behavioral history and compute score BEFORE fingerprint logic
    let behaviorResult: { score: number; category: 'HUMAN' | 'BOT' | 'UNKNOWN' } | null = null
    
    if (context.ip && context.userAgent) {
      try {
        const { getBehaviorScoreForRequest, classifyBehavior } = await import('./behavioral/behaviorModel')
        
        // Extract fingerprint data for behavioral analysis
        const fingerprintData = {
          hasWebGL: context.webglHash ? true : undefined,
          hasCanvas: context.canvasHash ? true : undefined,
          // Additional fingerprint data can be extracted from context if available
        }
        
        // Extract attempt data
        const attemptData = {
          mouseEvents: context.mouseEvents,
          scrollEvents: context.scrollEvents,
          keyboardEvents: context.timestamp ? 1 : 0, // Basic indicator
        }
        
        const behaviorScore = getBehaviorScoreForRequest(
          context.ip,
          context.userAgent,
          fingerprintData,
          attemptData
        )
        
        // PATCH 2 (FIX-3): Add MicroHuman score to behavioral classification
        // PRIORITY ZERO FIX: Ensure behaviorScore is never undefined
        const safeBehaviorScore = context.behaviorScore ?? 0
        const finalBehaviorScore = behaviorScore.score + safeBehaviorScore
        const finalCategory = classifyBehavior(finalBehaviorScore)
        
        behaviorResult = {
          score: finalBehaviorScore,
          category: finalCategory,
        }
        
        // Apply behavioral classification effect
        const settings = getCachedSettings()
        const behavioralSettings = settings.security?.behavioral
        const enableBehaviorModel = behavioralSettings?.enableBehaviorModel !== false
        
        if (enableBehaviorModel) {
          const blockBelow = behavioralSettings?.behaviorThresholds?.blockBelow ?? 0
          const captchaBelow = behavioralSettings?.behaviorThresholds?.captchaBelow ?? 5
          
          // PATCH 2 (FIX-3): Use final behavioral score and category (includes MicroHuman score)
          if (finalCategory === 'BOT' && finalBehaviorScore < blockBelow) {
            // Auto-block bots
            return {
              status: 'bot',
              requireCaptcha: false,
              allowAccess: false,
              allowRedirect: false,
              reason: `Behavioral analysis: ${behaviorScore.reasons.join(', ')}`,
            }
          }
          
          if (finalCategory === 'UNKNOWN' && finalBehaviorScore < captchaBelow) {
            // Require CAPTCHA for unknown
            return {
              status: 'challenge',
              requireCaptcha: true,
              allowAccess: false,
              allowRedirect: false,
              reason: `Behavioral analysis: ${behaviorScore.reasons.join(', ')}`,
            }
          }
        }
      } catch (error) {
        // Fail silently - behavioral analysis is optional
        if (process.env.NODE_ENV === 'development') {
          console.warn('Behavioral analysis failed:', error)
        }
      }
    }
    
    // STEP 6: Fingerprint Handling (Soft Device Binding)
    let fingerprintChanged = false
    let originalFingerprint: string | null = null
    
    if (context.fingerprint && finalEmail) {
      // Get original fingerprint for this email
      const records = await getRecordsForEmail(finalEmail)
      if (records.length > 0) {
        originalFingerprint = records[0].fingerprint
        const currentHash = getFingerprintHash(context.fingerprint)
        const originalHash = getFingerprintHash(originalFingerprint)
        
        if (currentHash !== originalHash) {
          fingerprintChanged = true
          
          // Soft binding: allow if human score > 0
          // But don't challenge if it's a bot (bots already handled earlier)
          if (humanScore <= 0 && !isBot) {
            return {
              status: 'suspicious',
              requireCaptcha: true,
              allowAccess: false,
              fingerprintChanged: true,
              humanScore: humanScore,
            }
          }
          
          // Human score > 0 - allow and update fingerprint
          await recordSuccessfulLogin(finalEmail, context.fingerprint, context.ip || 'unknown', token)
        }
      } else {
        // First time - store fingerprint
        if (attempts === 0) {
          await recordSuccessfulLogin(finalEmail, context.fingerprint, context.ip || 'unknown', token)
        }
      }
    }
    
    // STEP 7: Human Score Check
    // But don't challenge if it's a bot (bots already handled earlier)
    if (humanScore <= 0 && attempts < 4 && !isBot) {
      return {
        status: 'challenge',
        requireCaptcha: true,
        allowAccess: false,
        humanScore: humanScore,
      }
    }
    
    // STEP 8: Increment Attempts (only for humans, not bots, and if firewall allows)
    let newAttempts = attempts
    if (!isBot && attempts < 4 && finalEmail && !context.skipAttemptIncrement) {
      // Record attempt (using email as key for attempt tracking)
      const attemptKey = getAttemptKey(finalEmail, token)
      await recordAttempt(attemptKey, 'human_attempt')
      newAttempts = attempts + 1
    }
    
    // STEP 9: Mark link as completed if 4 attempts reached
    if (newAttempts >= 4 && link.type === 'personalized') {
      // Mark as completed but NOT expired
      // This is handled by the calling code
    }
    
    // STEP 10: Produce Final Output
    return {
      status: 'valid',
      allowAccess: true,
      email: finalEmail || undefined,
      attempts: newAttempts,
      allowRedirect: true,
      fingerprintChanged: fingerprintChanged,
      humanScore: humanScore,
      behavior: behaviorResult || undefined,
      brainDecision: brainDecision || undefined, // Phase 5.10: Include brain decision
    }
  } catch (error) {
    // Log error
    await logSecurityEvent({
      type: 'suspicious_behavior',
      ip: context.ip || 'unknown',
      fingerprint: context.fingerprint,
      severity: 'medium',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token.substring(0, 10) + '...',
      },
      userAgent: context.userAgent,
    })
    
    return {
      status: 'invalid',
      reason: error instanceof Error ? error.message : 'Validation failed',
      allowAccess: false,
    }
  }
}

