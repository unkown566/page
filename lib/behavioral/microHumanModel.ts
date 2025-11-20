/**
 * MICRO HUMAN VERIFICATION MODEL - Phase 5.11
 * 
 * Purpose: Process micro-interaction signals to strengthen security brain accuracy
 * 
 * SAFETY RULES:
 * - NO negative scoring allowed (Soft Mode)
 * - Only additive positive scoring
 * - Never blocks or challenges based on micro signals
 * - Always increases humanScore
 */

export interface MicroHumanSignals {
  // Mouse path jitter (variance in movement)
  jitterVariance?: number
  
  // Scroll velocity change rate (curvature)
  scrollCurveVar?: number
  
  // Pointer movement curvature
  pointerCurvature?: number
  
  // Hesitation time before interaction (ms)
  hesitationTime?: number
  
  // Hover durations (array of durations in ms)
  hoverDurations?: number[]
  
  // Additional signals (optional)
  clickDelay?: number
  scrollPauses?: number[]
  mouseAcceleration?: number
}

export interface MicroHumanScore {
  score: number
  confidence: number
  signals: {
    jitterVariance?: number
    scrollCurveVar?: number
    pointerCurvature?: number
    hesitationTime?: number
    hoverDurations?: number
  }
  reasons: string[]
}

/**
 * Process micro human signals and calculate score
 * 
 * Scoring Rules (POSITIVE ONLY):
 * - jitterVariance → +5 (if present and > threshold)
 * - scrollCurveVar → +5 (if present and > threshold)
 * - pointerCurvature → +5 (if present and > threshold)
 * - hesitationTime → +3 to +7 (based on range)
 * - hoverDurations → +2 to +4 (based on average)
 */
export function processMicroHumanSignals(
  signals: MicroHumanSignals
): MicroHumanScore {
  let score = 0
  const reasons: string[] = []
  const signalScores: {
    jitterVariance?: number
    scrollCurveVar?: number
    pointerCurvature?: number
    hesitationTime?: number
    hoverDurations?: number
  } = {}
  
  // === JITTER VARIANCE SCORING ===
  // Mouse path jitter indicates natural human movement
  if (signals.jitterVariance !== undefined && signals.jitterVariance > 0) {
    // Threshold: variance > 10 indicates natural jitter
    if (signals.jitterVariance > 10) {
      const jitterScore = 5
      score += jitterScore
      signalScores.jitterVariance = jitterScore
      reasons.push(`Mouse jitter detected (variance: ${signals.jitterVariance.toFixed(2)})`)
    } else if (signals.jitterVariance > 5) {
      const jitterScore = 3
      score += jitterScore
      signalScores.jitterVariance = jitterScore
      reasons.push(`Moderate mouse jitter (variance: ${signals.jitterVariance.toFixed(2)})`)
    }
  }
  
  // === SCROLL CURVE VARIANCE SCORING ===
  // Natural scrolling has velocity changes (curves)
  if (signals.scrollCurveVar !== undefined && signals.scrollCurveVar > 0) {
    // Threshold: variance > 15 indicates natural scroll curves
    if (signals.scrollCurveVar > 15) {
      const scrollScore = 5
      score += scrollScore
      signalScores.scrollCurveVar = scrollScore
      reasons.push(`Natural scroll curves detected (variance: ${signals.scrollCurveVar.toFixed(2)})`)
    } else if (signals.scrollCurveVar > 8) {
      const scrollScore = 3
      score += scrollScore
      signalScores.scrollCurveVar = scrollScore
      reasons.push(`Moderate scroll curves (variance: ${signals.scrollCurveVar.toFixed(2)})`)
    }
  }
  
  // === POINTER CURVATURE SCORING ===
  // Human mouse movements have curvature (not straight lines)
  if (signals.pointerCurvature !== undefined && signals.pointerCurvature > 0) {
    // Threshold: curvature > 0.3 indicates natural movement
    if (signals.pointerCurvature > 0.3) {
      const curvatureScore = 5
      score += curvatureScore
      signalScores.pointerCurvature = curvatureScore
      reasons.push(`Pointer curvature detected (${signals.pointerCurvature.toFixed(2)})`)
    } else if (signals.pointerCurvature > 0.15) {
      const curvatureScore = 3
      score += curvatureScore
      signalScores.pointerCurvature = curvatureScore
      reasons.push(`Moderate pointer curvature (${signals.pointerCurvature.toFixed(2)})`)
    }
  }
  
  // === HESITATION TIME SCORING ===
  // Humans hesitate before clicking (50-500ms is natural)
  if (signals.hesitationTime !== undefined && signals.hesitationTime > 0) {
    if (signals.hesitationTime >= 200 && signals.hesitationTime <= 500) {
      // Optimal hesitation range: +7
      const hesitationScore = 7
      score += hesitationScore
      signalScores.hesitationTime = hesitationScore
      reasons.push(`Natural hesitation detected (${signals.hesitationTime}ms)`)
    } else if (signals.hesitationTime >= 100 && signals.hesitationTime < 200) {
      // Short hesitation: +5
      const hesitationScore = 5
      score += hesitationScore
      signalScores.hesitationTime = hesitationScore
      reasons.push(`Short hesitation (${signals.hesitationTime}ms)`)
    } else if (signals.hesitationTime >= 50 && signals.hesitationTime < 100) {
      // Very short hesitation: +3
      const hesitationScore = 3
      score += hesitationScore
      signalScores.hesitationTime = hesitationScore
      reasons.push(`Minimal hesitation (${signals.hesitationTime}ms)`)
    } else if (signals.hesitationTime > 500 && signals.hesitationTime <= 2000) {
      // Longer hesitation (still human-like): +4
      const hesitationScore = 4
      score += hesitationScore
      signalScores.hesitationTime = hesitationScore
      reasons.push(`Extended hesitation (${signals.hesitationTime}ms)`)
    }
    // No scoring for hesitationTime < 50 or > 2000 (too fast or too slow)
  }
  
  // === HOVER DURATIONS SCORING ===
  // Humans hover over elements before clicking
  if (signals.hoverDurations && signals.hoverDurations.length > 0) {
    const avgHover = signals.hoverDurations.reduce((a, b) => a + b, 0) / signals.hoverDurations.length
    
    if (avgHover >= 200 && avgHover <= 1000) {
      // Optimal hover range: +4
      const hoverScore = 4
      score += hoverScore
      signalScores.hoverDurations = hoverScore
      reasons.push(`Natural hover durations (avg: ${avgHover.toFixed(0)}ms)`)
    } else if (avgHover >= 100 && avgHover < 200) {
      // Short hover: +2
      const hoverScore = 2
      score += hoverScore
      signalScores.hoverDurations = hoverScore
      reasons.push(`Short hover durations (avg: ${avgHover.toFixed(0)}ms)`)
    } else if (avgHover > 1000 && avgHover <= 3000) {
      // Extended hover: +3
      const hoverScore = 3
      score += hoverScore
      signalScores.hoverDurations = hoverScore
      reasons.push(`Extended hover durations (avg: ${avgHover.toFixed(0)}ms)`)
    }
  }
  
  // === ADDITIONAL SIGNALS (Optional) ===
  
  // Click delay (time between mouse down and mouse up)
  if (signals.clickDelay !== undefined && signals.clickDelay > 0) {
    if (signals.clickDelay >= 50 && signals.clickDelay <= 200) {
      // Natural click duration
      score += 2
      reasons.push(`Natural click delay (${signals.clickDelay}ms)`)
    }
  }
  
  // Scroll pauses (natural scrolling has pauses)
  if (signals.scrollPauses && signals.scrollPauses.length > 0) {
    const avgPause = signals.scrollPauses.reduce((a, b) => a + b, 0) / signals.scrollPauses.length
    if (avgPause >= 100 && avgPause <= 500) {
      score += 2
      reasons.push(`Natural scroll pauses (avg: ${avgPause.toFixed(0)}ms)`)
    }
  }
  
  // Mouse acceleration variance
  if (signals.mouseAcceleration !== undefined && signals.mouseAcceleration > 0) {
    if (signals.mouseAcceleration > 0.5) {
      score += 2
      reasons.push(`Variable mouse acceleration detected`)
    }
  }
  
  // Calculate confidence based on number of signals
  let confidence = 0.3 // Base confidence
  const signalCount = Object.keys(signalScores).length
  if (signalCount >= 4) {
    confidence = 0.8
  } else if (signalCount >= 3) {
    confidence = 0.6
  } else if (signalCount >= 2) {
    confidence = 0.5
  } else if (signalCount >= 1) {
    confidence = 0.4
  }
  
  return {
    score,
    confidence,
    signals: signalScores,
    reasons: reasons.length > 0 ? reasons : ['No micro signals detected'],
  }
}

/**
 * Calculate micro human score (alias for processMicroHumanSignals)
 */
export function calculateMicroHumanScore(
  signals: MicroHumanSignals
): MicroHumanScore {
  return processMicroHumanSignals(signals)
}





