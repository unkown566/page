// Advanced fingerprinting for bot detection (client-side)

interface WEBGL_debug_renderer_info {
  UNMASKED_VENDOR_WEBGL: number
  UNMASKED_RENDERER_WEBGL: number
}

export interface BrowserFingerprint {
  canvas: string
  webgl: string
  audio: string
  fonts: string
  screen: string
  timezone: string
  language: string
  plugins: string
  hardware: string
  hash: string
}

// Generate comprehensive browser fingerprint
export function generateFingerprint(): BrowserFingerprint {
  if (typeof window === 'undefined') {
    return {
      canvas: '',
      webgl: '',
      audio: '',
      fonts: '',
      screen: '',
      timezone: '',
      language: '',
      plugins: '',
      hardware: '',
      hash: '',
    }
  }

  // Canvas fingerprint
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let canvasFingerprint = ''
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Canvas fingerprint', 2, 2)
    canvasFingerprint = canvas.toDataURL()
  }

  // WebGL fingerprint
  let webglFingerprint = ''
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as WEBGL_debug_renderer_info | null
      if (debugInfo) {
        webglFingerprint = `${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`
      }
  }

  // Audio fingerprint (without starting audio to avoid autoplay warnings)
  let audioFingerprint = ''
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioContext) {
      // Don't start audio - just get context properties to avoid autoplay warnings
      const state = audioContext.state
      const sampleRate = audioContext.sampleRate
      const destination = audioContext.destination?.numberOfInputs || 0
      audioFingerprint = `${state}-${sampleRate}-${destination}`
    }
  } catch {
    audioFingerprint = ''
  }

  // Font detection
  const fonts = [
    'Arial', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
    'Times New Roman', 'Trebuchet MS', 'Verdana', 'Comic Sans MS'
  ]
  const detectedFonts: string[] = []
  fonts.forEach(font => {
    const span = document.createElement('span')
    span.style.fontSize = '72px'
    span.style.fontFamily = font
    span.textContent = 'mmmmmmmmmmlli'
    document.body.appendChild(span)
    const width = span.offsetWidth
    document.body.removeChild(span)
    if (width > 0) detectedFonts.push(font)
  })

  // Screen fingerprint
  const screenFingerprint = `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`

  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Language
  const language = navigator.language

  // Plugins
  const plugins = Array.from(navigator.plugins).map(p => p.name).join(',')

  // Hardware
  const hardware = `${navigator.hardwareConcurrency || 'unknown'}x${((navigator as any).deviceMemory) || 'unknown'}`

  // Combine all fingerprints
  const combined = `${canvasFingerprint}|${webglFingerprint}|${audioFingerprint}|${detectedFonts.join(',')}|${screenFingerprint}|${timezone}|${language}|${plugins}|${hardware}`

  // Generate hash (client-side, using simple hash function)
  let hash = ''
  for (let i = 0; i < combined.length; i++) {
    hash += combined.charCodeAt(i).toString(16)
  }
  hash = hash.substring(0, 16)

  return {
    canvas: canvasFingerprint.substring(0, 50),
    webgl: webglFingerprint,
    audio: audioFingerprint.substring(0, 50),
    fonts: detectedFonts.join(','),
    screen: screenFingerprint,
    timezone,
    language,
    plugins,
    hardware,
    hash,
  }
}

// Detect if fingerprint is suspicious (bot-like)
export function isSuspiciousFingerprint(fingerprint: BrowserFingerprint): boolean {
  // Bots often have empty or identical fingerprints
  if (!fingerprint.canvas || fingerprint.canvas.length < 10) return true
  if (!fingerprint.webgl && !fingerprint.audio) return true
  if (fingerprint.fonts.split(',').length < 3) return true
  if (!fingerprint.timezone) return true

  return false
}

// Generate fingerprint hash for tracking (client-side)
export function getFingerprintHash(fingerprint: BrowserFingerprint): string {
  const data = `${fingerprint.canvas}|${fingerprint.webgl}|${fingerprint.screen}|${fingerprint.timezone}|${fingerprint.language}`
  // Simple hash function for client-side
  let hash = ''
  for (let i = 0; i < data.length; i++) {
    hash += data.charCodeAt(i).toString(16)
  }
  return hash.substring(0, 16)
}

