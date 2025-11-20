/**
 * Behavioral Model - Score Computation and Classification
 * Phase 5.9: Core behavioral analysis engine
 */

import { getBehaviorHistory } from './behaviorTable'
import type { BehaviorHistory } from './behaviorTable'

export type BehaviorCategory = 'HUMAN' | 'BOT' | 'UNKNOWN'

export interface BehaviorScore {
  score: number
  category: BehaviorCategory
  confidence: number
  reasons: string[]
}

export interface FingerprintData {
  hasWebGL?: boolean
  hasCanvas?: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
  timezoneOffset?: number
  screenResolution?: string
  motionSensors?: boolean
  [key: string]: any
}

export interface AttemptData {
  mouseEvents?: number
  scrollEvents?: number
  keyboardEvents?: number
  touchEvents?: number
  focusBlurEvents?: number
  timingData?: {
    averageDelay?: number
    variance?: number
  }
  [key: string]: any
}

/**
 * Compute behavioral score from history, fingerprint, and attempt data
 */
export function computeBehaviorScore(
  history: BehaviorHistory,
  fingerprint?: FingerprintData,
  attemptData?: AttemptData
): BehaviorScore {
  let score = history.totalScore
  const reasons: string[] = []
  let confidence = 0.5 // Default confidence

  // Analyze fingerprint data
  if (fingerprint) {
    // Negative signals from fingerprint
    if (fingerprint.hasWebGL === false) {
      score -= 3
      reasons.push('No WebGL detected')
    }
    
    if (fingerprint.hasCanvas === false) {
      score -= 2
      reasons.push('No Canvas API')
    }
    
    if (fingerprint.deviceMemory !== undefined && fingerprint.deviceMemory < 2) {
      score -= 1
      reasons.push('Low device memory')
    }
    
    if (fingerprint.hardwareConcurrency !== undefined && fingerprint.hardwareConcurrency < 2) {
      score -= 1
      reasons.push('Low CPU cores')
    }
    
    // Positive signals from fingerprint
    if (fingerprint.hasWebGL === true) {
      score += 1
      reasons.push('WebGL available')
    }
    
    if (fingerprint.hasCanvas === true) {
      score += 1
      reasons.push('Canvas API available')
    }
    
    if (fingerprint.motionSensors === true) {
      score += 1
      reasons.push('Motion sensors available')
    }
  }

  // Analyze attempt data
  if (attemptData) {
    // Negative signals
    if (attemptData.mouseEvents === 0 || attemptData.mouseEvents === undefined) {
      score -= 1
      reasons.push('No mouse events')
    }
    
    if (attemptData.scrollEvents === 0 || attemptData.scrollEvents === undefined) {
      score -= 1
      reasons.push('No scroll events')
    }
    
    if (attemptData.focusBlurEvents === 0 || attemptData.focusBlurEvents === undefined) {
      score -= 1
      reasons.push('No focus/blur events')
    }
    
    // Positive signals
    if (attemptData.mouseEvents && attemptData.mouseEvents > 5) {
      score += 2
      reasons.push('Multiple mouse events')
    }
    
    if (attemptData.scrollEvents && attemptData.scrollEvents > 3) {
      score += 2
      reasons.push('Multiple scroll events')
    }
    
    if (attemptData.touchEvents && attemptData.touchEvents > 0) {
      score += 1
      reasons.push('Touch events detected')
    }
    
    // Timing analysis
    if (attemptData.timingData) {
      const { averageDelay, variance } = attemptData.timingData
      
      if (averageDelay !== undefined) {
        // Very fast actions (bot-like)
        if (averageDelay < 50) {
          score -= 2
          reasons.push('Too-fast action timing')
        }
        // Natural delays (human-like)
        else if (averageDelay > 200 && averageDelay < 2000) {
          score += 2
          reasons.push('Natural action timing')
        }
      }
      
      if (variance !== undefined) {
        // Low variance = too consistent (bot-like)
        if (variance < 10) {
          score -= 2
          reasons.push('Too-consistent timing')
        }
        // High variance = natural variation (human-like)
        else if (variance > 50) {
          score += 2
          reasons.push('Natural timing variation')
        }
      }
    }
  }

  // Increase confidence based on event count
  if (history.eventCount > 10) {
    confidence = 0.8
  } else if (history.eventCount > 5) {
    confidence = 0.6
  }

  // Classify behavior
  const category = classifyBehavior(score)

  return {
    score,
    category,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['Insufficient data'],
  }
}

/**
 * Classify behavior based on score
 * 
 * >5 → HUMAN
 * 0–5 → UNKNOWN
 * <0 → BOT
 */
export function classifyBehavior(score: number): BehaviorCategory {
  if (score > 5) {
    return 'HUMAN'
  } else if (score < 0) {
    return 'BOT'
  } else {
    return 'UNKNOWN'
  }
}

/**
 * Get behavior score for IP + User-Agent
 */
export function getBehaviorScoreForRequest(
  ip: string,
  userAgent: string,
  fingerprint?: FingerprintData,
  attemptData?: AttemptData,
  timeWindowSeconds: number = 300
): BehaviorScore {
  const history = getBehaviorHistory(ip, userAgent, timeWindowSeconds)
  return computeBehaviorScore(history, fingerprint, attemptData)
}






