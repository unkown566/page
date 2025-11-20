/**
 * Behavioral Signals - Static Scoring Values
 * Phase 5.9: Micro-action scoring for behavioral analysis
 */

/**
 * Micro-signal scoring values
 * Positive = human-like behavior
 * Negative = bot-like behavior
 */
export const microSignals: Record<string, number> = {
  // Negative signals (bot-like)
  fast_click: -2,           // Click without delay
  no_mouse: -1,            // No mouse movement detected
  no_scroll: -1,           // No scroll events
  repeated_uas: -3,        // Multiple different user agents
  incognito_hint: -1,      // Incognito/private mode indicators
  headless_canvas: -4,     // Headless browser canvas fingerprint
  no_webgl: -3,            // WebGL not available
  rapid_sequence: -2,      // Rapid sequence of actions
  perfect_timing: -2,      // Too-perfect timing patterns
  no_focus_blur: -1,       // No focus/blur events
  
  // Positive signals (human-like)
  human_drag: +2,          // Mouse drag events
  human_scroll: +2,        // Natural scroll behavior
  messy_typing: +3,         // Variable typing speed (human)
  jitter_mouse: +3,         // Natural mouse jitter/movement
  focus_blur_events: +1,    // Focus/blur events
  variable_delays: +2,     // Variable delays between actions
  natural_pauses: +2,      // Natural pauses in interaction
  touch_events: +1,         // Touch events (mobile)
  pointer_events: +1,       // Pointer events
  context_menu: +1,         // Right-click context menu
}

/**
 * Event type categories
 */
export type BehaviorEventType = keyof typeof microSignals

/**
 * Get score for a behavior event type
 */
export function getSignalScore(eventType: string): number {
  return microSignals[eventType] || 0
}

/**
 * Check if event type is positive (human-like)
 */
export function isPositiveSignal(eventType: string): boolean {
  const score = getSignalScore(eventType)
  return score > 0
}

/**
 * Check if event type is negative (bot-like)
 */
export function isNegativeSignal(eventType: string): boolean {
  const score = getSignalScore(eventType)
  return score < 0
}





