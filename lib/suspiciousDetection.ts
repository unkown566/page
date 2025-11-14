// Suspicious behavior detection for CAPTCHA triggering

interface SuspiciousBehavior {
  isSuspicious: boolean
  reasons: string[]
  score: number // 0-100
}

// Track user behavior
let behaviorMetrics = {
  mouseMovements: 0,
  keystrokes: 0,
  timeOnPage: 0,
  scrollEvents: 0,
  clickEvents: 0,
  suspiciousPatterns: [] as string[],
}

export function initBehaviorTracking() {
  if (typeof window === 'undefined') return

  // Track mouse movements
  let mouseMoveCount = 0
  document.addEventListener('mousemove', () => {
    mouseMoveCount++
    behaviorMetrics.mouseMovements = mouseMoveCount
  }, { passive: true })

  // Track keystrokes
  let keystrokeCount = 0
  document.addEventListener('keydown', () => {
    keystrokeCount++
    behaviorMetrics.keystrokes = keystrokeCount
  }, { passive: true })

  // Track scroll
  let scrollCount = 0
  document.addEventListener('scroll', () => {
    scrollCount++
    behaviorMetrics.scrollEvents = scrollCount
  }, { passive: true })

  // Track clicks
  let clickCount = 0
  document.addEventListener('click', () => {
    clickCount++
    behaviorMetrics.clickEvents = clickCount
  }, { passive: true })

  // Track time on page
  const startTime = Date.now()
  setInterval(() => {
    behaviorMetrics.timeOnPage = Date.now() - startTime
  }, 1000)
}

export function detectSuspiciousBehavior(): SuspiciousBehavior {
  const reasons: string[] = []
  let score = 0

  // Check for bot-like patterns
  const timeOnPage = behaviorMetrics.timeOnPage / 1000 // seconds

  // Too fast interactions (less than 2 seconds - very suspicious)
  if (timeOnPage < 2 && (behaviorMetrics.clickEvents > 0 || behaviorMetrics.keystrokes > 10)) {
    reasons.push('too_fast')
    score += 30
  }

  // No mouse movements but has clicks/keystrokes (very suspicious)
  if (behaviorMetrics.mouseMovements < 3 && behaviorMetrics.keystrokes > 5 && timeOnPage > 3) {
    reasons.push('no_mouse_movement')
    score += 25
  }

  // Very few interactions overall (after reasonable time)
  if (timeOnPage > 10 && behaviorMetrics.mouseMovements < 5 && behaviorMetrics.clickEvents < 1) {
    reasons.push('low_interaction')
    score += 20
  }

  // Rapid form filling (typing extremely fast - more than 10 chars per second)
  if (behaviorMetrics.keystrokes > 20 && timeOnPage < 2) {
    reasons.push('rapid_typing')
    score += 15
  }

  // No scroll but form interaction (after reasonable time)
  if (behaviorMetrics.scrollEvents === 0 && behaviorMetrics.clickEvents > 0 && timeOnPage > 5) {
    reasons.push('no_scroll')
    score += 10
  }

  return {
    isSuspicious: score >= 30,
    reasons,
    score: Math.min(score, 100),
  }
}

export function resetBehaviorMetrics() {
  behaviorMetrics = {
    mouseMovements: 0,
    keystrokes: 0,
    timeOnPage: 0,
    scrollEvents: 0,
    clickEvents: 0,
    suspiciousPatterns: [],
  }
}

