'use client'

import { useEffect, useState } from 'react'

export interface ClientDetectionResults {
  hasWebGL: boolean
  hasWebRTC: boolean
  canvasFingerprint: string
  timezoneOffset: number
  screenResolution: string
  touchSupport: boolean
  deviceMemory: number
  hardwareConcurrency: number
  plugins: number
  languages: string[]
  colorDepth: number
  pixelRatio: number
  hasNotifications: boolean
  hasGeolocation: boolean
  platform: string
  vendor: string
  maxTouchPoints: number
}

interface SandboxScore {
  score: number
  isSandbox: boolean
  reasons: string[]
}

export function useSandboxDetection() {
  const [results, setResults] = useState<ClientDetectionResults | null>(null)
  const [score, setScore] = useState<SandboxScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const detect = async () => {
      // Wait a bit to ensure all browser APIs are loaded
      await new Promise((resolve) => setTimeout(resolve, 100))

      const detectionResults: ClientDetectionResults = {
        // WebGL support (sandboxes often don't have GPU)
        hasWebGL: detectWebGL(),

        // WebRTC support (sandboxes often lack this)
        hasWebRTC: detectWebRTC(),

        // Canvas fingerprint (sandboxes have generic fingerprints)
        canvasFingerprint: getCanvasFingerprint(),

        // Timezone
        timezoneOffset: new Date().getTimezoneOffset(),

        // Screen resolution (sandboxes often have generic: 1024x768, 800x600)
        screenResolution: `${window.screen.width}x${window.screen.height}`,

        // Touch support
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,

        // Device memory (sandboxes often have low values: 2GB or less)
        deviceMemory: (navigator as any).deviceMemory || 0,

        // CPU cores (sandboxes often have 1-2 cores)
        hardwareConcurrency: navigator.hardwareConcurrency || 0,

        // Browser plugins (sandboxes have 0 plugins)
        plugins: navigator.plugins.length,

        // Languages (sandboxes often have generic: ['en-US'])
        languages: Array.from(navigator.languages || [navigator.language]),

        // Color depth (sandboxes often have 24)
        colorDepth: window.screen.colorDepth,

        // Pixel ratio (sandboxes always have 1)
        pixelRatio: window.devicePixelRatio,

        // Notification API
        hasNotifications: 'Notification' in window,

        // Geolocation API
        hasGeolocation: 'geolocation' in navigator,

        // Platform
        platform: navigator.platform,

        // Vendor
        vendor: navigator.vendor,

        // Max touch points
        maxTouchPoints: navigator.maxTouchPoints || 0,
      }

      setResults(detectionResults)

      // Calculate sandbox score
      const calculatedScore = calculateSandboxScore(detectionResults)
      setScore(calculatedScore)

      setLoading(false)
    }

    detect()
  }, [])

  return { results, score, loading }
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

function detectWebRTC(): boolean {
  return !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  )
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    canvas.width = 200
    canvas.height = 50

    // Draw text with specific styling
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 200, 50)
    ctx.fillStyle = '#069'
    ctx.fillText('FOX 🦊', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('FOX 🦊', 4, 4)

    // Get data URL
    return canvas.toDataURL()
  } catch {
    return ''
  }
}

function calculateSandboxScore(results: ClientDetectionResults): SandboxScore {
  let score = 0
  const reasons: string[] = []

  // Check for missing WebGL (strong indicator)
  if (!results.hasWebGL) {
    score += 25
    reasons.push('No WebGL support')
  }

  // Check for missing WebRTC
  if (!results.hasWebRTC) {
    score += 20
    reasons.push('No WebRTC support')
  }

  // Low device memory (< 4GB)
  if (results.deviceMemory > 0 && results.deviceMemory < 4) {
    score += 15
    reasons.push(`Low device memory: ${results.deviceMemory}GB`)
  }

  // Low CPU cores (< 4)
  if (results.hardwareConcurrency > 0 && results.hardwareConcurrency < 4) {
    score += 15
    reasons.push(`Low CPU cores: ${results.hardwareConcurrency}`)
  }

  // No plugins (strong indicator)
  if (results.plugins === 0) {
    score += 20
    reasons.push('No browser plugins')
  }

  // Generic screen resolution
  const genericResolutions = ['1024x768', '800x600', '1366x768', '1280x720']
  if (genericResolutions.includes(results.screenResolution)) {
    score += 10
    reasons.push(`Generic resolution: ${results.screenResolution}`)
  }

  // Pixel ratio exactly 1 (real devices vary)
  if (results.pixelRatio === 1) {
    score += 5
    reasons.push('Generic pixel ratio: 1')
  }

  // Missing Notification API
  if (!results.hasNotifications) {
    score += 5
    reasons.push('No Notification API')
  }

  // Single language (real browsers have multiple)
  if (results.languages.length === 1) {
    score += 5
    reasons.push('Single language only')
  }

  return {
    score,
    isSandbox: score >= 50,
    reasons,
  }
}




