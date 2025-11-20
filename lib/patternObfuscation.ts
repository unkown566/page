// Pattern Obfuscation & Encoding
// Encodes patterns to avoid detection by security scanners

/**
 * Obfuscate patterns to avoid detection
 * Uses multiple encoding layers and randomization
 */

// Base64 with random padding
export function obfuscatePattern(pattern: string): string {
  // Layer 1: Base64 encode
  const encoded = Buffer.from(pattern).toString('base64')
  
  // Layer 2: Add random padding
  const padding = Math.random().toString(36).substring(2, 10)
  
  // Layer 3: Reverse and add delimiter
  const reversed = encoded.split('').reverse().join('')
  
  // Layer 4: XOR with random key
  const key = Math.floor(Math.random() * 255)
  const xorEncoded = xorEncode(reversed, key)
  
  return `${xorEncoded}.${padding}.${key.toString(36)}`
}

// Deobfuscate pattern
export function deobfuscatePattern(obfuscated: string): string {
  try {
    const parts = obfuscated.split('.')
    if (parts.length !== 3) return obfuscated
    
    const [encoded, , keyStr] = parts
    const key = parseInt(keyStr, 36)
    
    // Reverse XOR
    const xorDecoded = xorDecode(encoded, key)
    
    // Reverse string
    const reversed = xorDecoded.split('').reverse().join('')
    
    // Base64 decode
    return Buffer.from(reversed, 'base64').toString('utf-8')
  } catch {
    return obfuscated
  }
}

// XOR encode
function xorEncode(str: string, key: number): string {
  return str
    .split('')
    .map(char => String.fromCharCode(char.charCodeAt(0) ^ key))
    .join('')
}

// XOR decode
function xorDecode(str: string, key: number): string {
  return xorEncode(str, key) // XOR is symmetric
}

// Obfuscate User-Agent patterns
export function obfuscateUserAgent(baseUA: string): string {
  // Add random variations
  const variations = [
    () => baseUA.replace(/Chrome\/\d+/, `Chrome/${120 + Math.floor(Math.random() * 5)}`),
    () => baseUA.replace(/Safari\/\d+/, `Safari/${605 + Math.floor(Math.random() * 5)}`),
    () => baseUA.replace(/Firefox\/\d+/, `Firefox/${121 + Math.floor(Math.random() * 5)}`),
  ]
  
  const variation = variations[Math.floor(Math.random() * variations.length)]
  return variation()
}

// Obfuscate headers
export function obfuscateHeaders(headers: Record<string, string>): Record<string, string> {
  const obfuscated: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(headers)) {
    // Obfuscate sensitive headers
    if (key.toLowerCase().includes('security') || 
        key.toLowerCase().includes('auth') ||
        key.toLowerCase().includes('token')) {
      obfuscated[key] = obfuscatePattern(value)
    } else {
      obfuscated[key] = value
    }
  }
  
  return obfuscated
}

// Encode detection patterns
export function encodeDetectionPattern(pattern: string): string {
  // Multiple encoding layers
  const layer1 = Buffer.from(pattern).toString('base64')
  const layer2 = Buffer.from(layer1).toString('base64')
  const layer3 = encodeURIComponent(layer2)
  
  // Add random noise
  const noise = Math.random().toString(36).substring(2, 8)
  return `${layer3}_${noise}`
}

// Decode detection pattern
export function decodeDetectionPattern(encoded: string): string {
  try {
    const [data] = encoded.split('_')
    const layer3 = decodeURIComponent(data)
    const layer2 = Buffer.from(layer3, 'base64').toString('utf-8')
    const layer1 = Buffer.from(layer2, 'base64').toString('utf-8')
    return layer1
  } catch {
    return encoded
  }
}

// Rotate patterns to avoid static detection
export function rotatePatterns(patterns: string[]): string[] {
  // Shuffle array
  const shuffled = [...patterns]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  // Encode some patterns
  return shuffled.map((pattern, index) => {
    if (index % 3 === 0) { // Encode every 3rd pattern
      return encodeDetectionPattern(pattern)
    }
    return pattern
  })
}

// Obfuscate email content
export function obfuscateEmailContent(content: string): string {
  // Replace common phishing indicators with encoded versions
  const replacements: Record<string, string> = {
    'click here': encodeDetectionPattern('click here'),
    'verify now': encodeDetectionPattern('verify now'),
    'urgent': encodeDetectionPattern('urgent'),
    'immediately': encodeDetectionPattern('immediately'),
  }
  
  let obfuscated = content
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'gi')
    obfuscated = obfuscated.replace(regex, value)
  }
  
  return obfuscated
}

// Encode HTML to avoid pattern detection
export function encodeHTML(html: string): string {
  // Encode special characters
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Decode HTML
export function decodeHTML(encoded: string): string {
  return encoded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// Obfuscate URLs
export function obfuscateURL(url: string): string {
  // Add random parameters
  const params = new URLSearchParams()
  params.set('_t', Date.now().toString())
  params.set('_r', Math.random().toString(36).substring(2, 15))
  params.set('_v', Math.random().toString(36).substring(2, 8))
  
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

// Rotate encryption keys
export function rotateKey(baseKey: string): string {
  const timestamp = Math.floor(Date.now() / (60 * 60 * 1000)) // Hourly rotation
  const rotated = `${baseKey}_${timestamp}`
  return Buffer.from(rotated).toString('base64').substring(0, 32)
}

// Obfuscate JavaScript patterns
export function obfuscateJS(code: string): string {
  // Simple obfuscation (for patterns, not full code)
  const encoded = Buffer.from(code).toString('base64')
  const reversed = encoded.split('').reverse().join('')
  return `atob(${JSON.stringify(reversed)}.split('').reverse().join(''))`
}

// Generate random identifiers
export function generateRandomID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 10)}`
}

// Obfuscate detection logic
export function obfuscateDetectionLogic(logic: string): string {
  // Encode the logic
  const encoded = encodeDetectionPattern(logic)
  
  // Split into chunks
  const chunks = []
  for (let i = 0; i < encoded.length; i += 10) {
    chunks.push(encoded.substring(i, i + 10))
  }
  
  // Reorder chunks
  const reordered = chunks.reverse()
  
  return reordered.join('_')
}

// Deobfuscate detection logic
export function deobfuscateDetectionLogic(obfuscated: string): string {
  try {
    const chunks = obfuscated.split('_').reverse()
    const encoded = chunks.join('')
    return decodeDetectionPattern(encoded)
  } catch {
    return obfuscated
  }
}












