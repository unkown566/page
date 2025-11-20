/**
 * Adaptive Evasion System
 * Learns from detections and rotates techniques
 */

export interface EvasionTechnique {
  id: string
  name: string
  type: 'template' | 'header' | 'timing' | 'behavior'
  effectiveness: number // 0-100
  timesUsed: number
  timesSuccessful: number
  lastUsed: string
}

export interface DetectionEvent {
  timestamp: string
  technique: string
  wasDetected: boolean
  confidence: number
  vendor?: string
}

// Track which techniques work best
let evasionTechniques: EvasionTechnique[] = [
  {
    id: 'template-rotation',
    name: 'Random Template Selection',
    type: 'template',
    effectiveness: 85,
    timesUsed: 0,
    timesSuccessful: 0,
    lastUsed: '',
  },
  {
    id: 'header-randomization',
    name: 'Header Rotation',
    type: 'header',
    effectiveness: 70,
    timesUsed: 0,
    timesSuccessful: 0,
    lastUsed: '',
  },
  {
    id: 'timing-variation',
    name: 'Random Delays',
    type: 'timing',
    effectiveness: 60,
    timesUsed: 0,
    timesSuccessful: 0,
    lastUsed: '',
  },
  {
    id: 'behavioral-simulation',
    name: 'Mouse/Keyboard Simulation',
    type: 'behavior',
    effectiveness: 90,
    timesUsed: 0,
    timesSuccessful: 0,
    lastUsed: '',
  },
]

/**
 * Select best evasion technique based on success rate
 */
export function selectBestTechnique(
  type?: EvasionTechnique['type']
): EvasionTechnique {
  let candidates = evasionTechniques

  if (type) {
    candidates = candidates.filter((t) => t.type === type)
  }

  // Sort by effectiveness
  candidates.sort((a, b) => b.effectiveness - a.effectiveness)

  // Use weighted random selection (favor higher effectiveness)
  const weights = candidates.map((t) => t.effectiveness)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const random = Math.random() * totalWeight

  let cumulative = 0
  for (let i = 0; i < candidates.length; i++) {
    cumulative += weights[i]
    if (random <= cumulative) {
      return candidates[i]
    }
  }

  return candidates[0]
}

/**
 * Record detection event and update effectiveness
 */
export async function recordDetectionEvent(
  event: DetectionEvent
): Promise<void> {
  // Find technique
  const technique = evasionTechniques.find((t) => t.id === event.technique)
  if (!technique) return

  technique.timesUsed++
  technique.lastUsed = event.timestamp

  if (!event.wasDetected) {
    technique.timesSuccessful++
  }

  // Recalculate effectiveness
  if (technique.timesUsed > 0) {
    technique.effectiveness = Math.round(
      (technique.timesSuccessful / technique.timesUsed) * 100
    )
  }

  // Save to disk for persistence
  await saveTechniques()
}

/**
 * Rotate template based on detection patterns
 */
export function getAdaptiveTemplate(
  fingerprint: string,
  previousDetections: DetectionEvent[]
): string {
  // If this fingerprint was detected before, use different template
  const wasDetected = previousDetections.some(
    (d) =>
      d.timestamp >
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  )

  if (wasDetected) {
    // Use least-recently-used template
    const technique = selectBestTechnique('template')
    return technique.id
  }

  // Use most effective template
  const technique = selectBestTechnique('template')
  return technique.id
}

/**
 * Get all techniques (for admin dashboard)
 */
export function getAllTechniques(): EvasionTechnique[] {
  return evasionTechniques
}

/**
 * Get technique statistics
 */
export function getTechniqueStats() {
  const totalUsed = evasionTechniques.reduce((sum, t) => sum + t.timesUsed, 0)
  const totalSuccessful = evasionTechniques.reduce(
    (sum, t) => sum + t.timesSuccessful,
    0
  )

  return {
    totalTechniques: evasionTechniques.length,
    totalUsed,
    totalSuccessful,
    overallEffectiveness:
      totalUsed > 0 ? Math.round((totalSuccessful / totalUsed) * 100) : 0,
    techniques: evasionTechniques.map((t) => ({
      id: t.id,
      name: t.name,
      effectiveness: t.effectiveness,
      timesUsed: t.timesUsed,
      successRate:
        t.timesUsed > 0
          ? Math.round((t.timesSuccessful / t.timesUsed) * 100)
          : 0,
    })),
  }
}

async function saveTechniques(): Promise<void> {
  try {
    const fs = await import('fs').then((m) => m.promises)
    const path = await import('path')

    const dataPath = path.join(process.cwd(), '.evasion-techniques.json')
    await fs.writeFile(
      dataPath,
      JSON.stringify(evasionTechniques, null, 2)
    )
  } catch (error) {
    // Silent fail - not critical
  }
}

async function loadTechniques(): Promise<void> {
  try {
    const fs = await import('fs').then((m) => m.promises)
    const path = await import('path')

    const dataPath = path.join(process.cwd(), '.evasion-techniques.json')
    const content = await fs.readFile(dataPath, 'utf-8')
    evasionTechniques = JSON.parse(content)
  } catch {
    // Use defaults
  }
}

// Load on startup
loadTechniques()










