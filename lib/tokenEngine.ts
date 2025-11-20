/**
 * TOKEN ENGINE - AES-256-GCM Encryption Layer
 * 
 * Phase 5: Full implementation of encrypted token generation/decoding
 * Phase 6: Token Engine v3 with polymorphic mutation engine
 * 
 * Handles all token encryption, decryption, and normalization.
 * Supports v1, v2 (legacy), and v3 (new) token formats.
 * 
 * v1/v2: AES-256-GCM with version prefix: v1_<url-safe-base64>
 * v3: AES-256-GCM with HMAC signature, device binding, one-time-use
 * 
 * Follows: /PROJECT_ARCHITECTURE/LINK_ENGINE_BLUEPRINT.md
 */

// Use Web Crypto API for Edge runtime compatibility
const webCrypto = typeof crypto !== 'undefined' && 'webcrypto' in crypto 
  ? (crypto as any).webcrypto 
  : globalThis.crypto

// Fallback to Node crypto for non-Edge environments
let nodeCrypto: any = null
try {
  nodeCrypto = require('crypto')
} catch {
  // Not available in Edge runtime
}

// ============================================
// Custom Error Classes
// ============================================

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTokenError'
  }
}

export class InvalidSignatureError extends Error {
  constructor(message: string = 'Token signature verification failed') {
    super(message)
    this.name = 'InvalidSignatureError'
  }
}

export class LinkExpiredError extends Error {
  constructor(message: string = 'Token has expired') {
    super(message)
    this.name = 'LinkExpiredError'
  }
}

export class TokenAlreadyUsedError extends Error {
  constructor(message: string = 'Token has already been used') {
    super(message)
    this.name = 'TokenAlreadyUsedError'
  }
}

// ============================================
// Type Definitions
// ============================================

/**
 * Token payload structure (v1/v2 legacy)
 */
export interface TokenPayload {
  linkId: string
  email?: string
  expiresAt: number
  type: 'personalized' | 'generic'
  ts?: number // Timestamp in milliseconds (for hardened mode millisecond-window expiry)
  fingerprintHash?: string // SHA-256 hash of fingerprint (for hardened mode binding)
  ipBinding?: string // SHA-256 hash of IP+ASN+continent+region (for hardened mode binding)
  uaFamily?: string // User-agent family (Chrome/Safari/etc) (for hardened mode binding)
  [key: string]: any // Allow additional fields
}

/**
 * Token payload structure (v3)
 */
export interface TokenPayloadV3 {
  version: 3
  linkId: string
  email?: string
  type: 'personalized' | 'generic'
  expiresAt: number
  once: boolean // One-time-use flag
  fpBinding?: boolean // Fingerprint binding enabled
  device?: {
    ipHash?: string // HMAC-SHA256 hash of IP
    uaHash?: string // HMAC-SHA256 hash of user-agent
  }
  rndPad: string // Random padding (32-64 bytes, base64url)
  entropy: string // Random entropy (12-24 bytes, base64url)
  issuedAt: number // Timestamp in seconds
  signature: string // HMAC-SHA256 signature (excluded from signature calculation)
}

/**
 * Encryption configuration
 */
interface EncryptionConfig {
  algorithm: 'aes-256-gcm'
  keyLength: number // 32 bytes for AES-256
  ivLength: number // 12 bytes for GCM
  tagLength: number // 16 bytes for GCM auth tag
}

// ============================================
// Constants
// ============================================

const ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 12,
  tagLength: 16,
}

const TOKEN_VERSION = 'v1'
const TOKEN_PREFIX = `${TOKEN_VERSION}_`
const TOKEN_VERSION_V3 = 'v3'
const TOKEN_PREFIX_V3 = `${TOKEN_VERSION_V3}_`

/**
 * Get encryption key from environment
 * Derives a 32-byte key from TOKEN_SECRET
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY
  
  if (!secret) {
    throw new Error('TOKEN_SECRET or TOKEN_ENCRYPTION_KEY environment variable is required')
  }
  
  // Derive 32-byte key from secret using SHA-256
  if (nodeCrypto) {
    return nodeCrypto.createHash('sha256').update(secret).digest()
  }
  
  // Web Crypto API fallback (synchronous hash not available, use async)
  throw new Error('Node crypto required for v1/v2 tokens. Use v3 tokens for Edge runtime.')
}

/**
 * Get encryption key as CryptoKey for Web Crypto API (v3)
 */
async function getEncryptionKeyV3(): Promise<CryptoKey> {
  const secret = process.env.TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY
  
  if (!secret) {
    throw new Error('TOKEN_SECRET or TOKEN_ENCRYPTION_KEY environment variable is required')
  }
  
  // Derive 32-byte key from secret using SHA-256
  const encoder = new TextEncoder()
  const secretData = encoder.encode(secret)
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', secretData)
  const hashArray = new Uint8Array(hashBuffer)
  
  // Import as AES-GCM key
  return await webCrypto.subtle.importKey(
    'raw',
    hashArray,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Get HMAC key for signature verification (v3)
 */
async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY
  
  if (!secret) {
    throw new Error('TOKEN_SECRET or TOKEN_ENCRYPTION_KEY environment variable is required')
  }
  
  const encoder = new TextEncoder()
  const secretData = encoder.encode(secret)
  
  return await webCrypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/**
 * Convert standard base64 to URL-safe base64
 */
function toUrlSafeBase64(buffer: Buffer | Uint8Array): string {
  let base64: string
  if (buffer instanceof Buffer) {
    base64 = buffer.toString('base64')
  } else {
    // Convert Uint8Array to base64
    const binary = String.fromCharCode(...buffer)
    base64 = btoa(binary)
  }
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Convert URL-safe base64 to standard base64
 */
function fromUrlSafeBase64(urlSafeBase64: string): string {
  // Add padding if needed
  let base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (base64.length % 4)) % 4
  base64 += '='.repeat(padding)
  return base64
}

/**
 * Convert base64url string to Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = fromUrlSafeBase64(base64url)
  const binary = atob(base64)
  return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)))
}

/**
 * Generate random bytes (Web Crypto API)
 */
async function randomBytes(length: number): Promise<Uint8Array> {
  return new Uint8Array(webCrypto.getRandomValues(new Uint8Array(length)))
}

/**
 * Generate random base64url string
 */
async function randomBase64Url(minLength: number, maxLength: number): Promise<string> {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
  const bytes = await randomBytes(length)
  return toUrlSafeBase64(bytes)
}

// ============================================
// Core Encryption Functions
// ============================================

/**
 * Encrypt a payload and generate a token
 * 
 * Process:
 * 1. Serialize payload to JSON
 * 2. Generate random 12-byte IV
 * 3. Encrypt with AES-256-GCM
 * 4. Combine IV + ciphertext + auth tag
 * 5. Encode as URL-safe base64
 * 6. Prefix with version: v1_<encoded>
 * 
 * @param payload Token payload to encrypt
 * @returns Encrypted token string (v1_<url-safe-base64>)
 */
export function encryptPayload(payload: TokenPayload): string {
  try {
    // 1. Serialize payload to JSON
    const plaintext = JSON.stringify(payload)
    
    // 2. Generate random 12-byte IV
    if (!nodeCrypto) {
      throw new Error('Node crypto required for v1 tokens')
    }
    const iv = nodeCrypto.randomBytes(ENCRYPTION_CONFIG.ivLength)
    
    // 3. Get encryption key
    const key = getEncryptionKey()
    
    // 4. Create cipher with AES-256-GCM
    const cipher = nodeCrypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv)
    
    // 5. Encrypt the JSON string
    let ciphertext = cipher.update(plaintext, 'utf8')
    ciphertext = Buffer.concat([ciphertext, cipher.final()])
    
    // 6. Get authentication tag
    const authTag = cipher.getAuthTag()
    
    // 7. Combine: iv (12 bytes) + ciphertext + authTag (16 bytes)
    const combined = Buffer.concat([iv, ciphertext, authTag])
    
    // 8. Encode as URL-safe base64
    const urlSafeBase64 = toUrlSafeBase64(combined)
    
    // 9. Prepend version prefix
    return `${TOKEN_PREFIX}${urlSafeBase64}`
  } catch (error) {
    throw new Error(`Failed to encrypt payload: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decrypt a token and extract the payload
 * 
 * Process:
 * 1. Normalize token first
 * 2. Validate version prefix (v1_)
 * 3. Decode URL-safe base64 to buffer
 * 4. Extract IV (first 12 bytes), auth tag (last 16 bytes), ciphertext (middle)
 * 5. Decrypt with AES-256-GCM
 * 6. Validate authentication tag
 * 7. Parse JSON and return payload
 * 
 * @param token Encrypted token string
 * @returns Decrypted token payload
 * @throws InvalidTokenError if token is invalid, corrupted, or authentication fails
 */
export function decryptToken(token: string): TokenPayload | TokenPayloadV3 {
  try {
    // 1. Normalize token first
    const normalized = normalizeToken(token)
    
    // 2. Version switching: route to appropriate decryption function
    if (normalized.startsWith(TOKEN_PREFIX_V3)) {
      // v3 token - use async decryption
      throw new Error('v3 tokens require async decryptTokenV3() function')
    } else if (normalized.startsWith(TOKEN_PREFIX) || normalized.startsWith('v2_')) {
      // v1 or v2 token - use legacy decryption
      return decryptTokenV1V2(normalized)
    } else {
      throw new InvalidTokenError(`Token must start with ${TOKEN_PREFIX}, v2_, or ${TOKEN_PREFIX_V3}`)
    }
  } catch (error) {
    if (error instanceof InvalidTokenError || error instanceof InvalidSignatureError || 
        error instanceof LinkExpiredError || error instanceof TokenAlreadyUsedError) {
      throw error
    }
    throw new InvalidTokenError(`Token decryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decrypt v1/v2 token (legacy)
 */
function decryptTokenV1V2(normalized: string): TokenPayload {
  try {
    // Validate version prefix
    if (!normalized.startsWith(TOKEN_PREFIX) && !normalized.startsWith('v2_')) {
      throw new InvalidTokenError('Token does not start with v1_ or v2_ prefix')
    }
    
    // Determine prefix length
    const prefix = normalized.startsWith(TOKEN_PREFIX) ? TOKEN_PREFIX : 'v2_'
    
    // 3. Extract encoded part after prefix
    const encoded = normalized.slice(prefix.length)
    
    if (!encoded) {
      throw new InvalidTokenError('Token has no encoded data after prefix')
    }
    
    // 4. Convert URL-safe base64 to standard base64
    const base64 = fromUrlSafeBase64(encoded)
    
    // 5. Decode base64 to buffer
    let combined: Buffer
    try {
      combined = Buffer.from(base64, 'base64')
    } catch (error) {
      throw new InvalidTokenError('Invalid base64 encoding in token')
    }
    
    // 6. Validate minimum length (iv + authTag = 12 + 16 = 28 bytes minimum)
    if (combined.length < 28) {
      throw new InvalidTokenError('Token is too short to contain valid encrypted data')
    }
    
    // 7. Extract IV (first 12 bytes)
    const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength)
    
    // 8. Extract auth tag (last 16 bytes)
    const authTag = combined.slice(-ENCRYPTION_CONFIG.tagLength)
    
    // 9. Extract ciphertext (middle bytes)
    const ciphertext = combined.slice(
      ENCRYPTION_CONFIG.ivLength,
      combined.length - ENCRYPTION_CONFIG.tagLength
    )
    
    // 10. Get decryption key
    const key = getEncryptionKey()
    
    // 11. Create decipher
    if (!nodeCrypto) {
      throw new Error('Node crypto required for v1 tokens')
    }
    const decipher = nodeCrypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv)
    
    // 12. Set authentication tag
    decipher.setAuthTag(authTag)
    
    // 13. Decrypt ciphertext
    let plaintext: string
    try {
      let decrypted = decipher.update(ciphertext)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      plaintext = decrypted.toString('utf8')
    } catch (error) {
      throw new InvalidTokenError('Token decryption failed - invalid or corrupted token')
    }
    
    // 14. Parse JSON string to TokenPayload
    try {
      return JSON.parse(plaintext) as TokenPayload
    } catch (error) {
      throw new InvalidTokenError('Token payload is not valid JSON')
    }
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      throw error
    }
    throw new InvalidTokenError(`Token decryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ============================================
// Token Engine v3 - Polymorphic Mutation Engine
// ============================================

/**
 * Create device hash (HMAC-SHA256) for IP or User-Agent
 */
async function createDeviceHash(data: string): Promise<string> {
  const hmacKey = await getHmacKey()
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data)
  const signature = await webCrypto.subtle.sign('HMAC', hmacKey, dataBytes)
  const hashArray = new Uint8Array(signature)
  return toUrlSafeBase64(hashArray)
}

/**
 * Generate HMAC-SHA256 signature for payload
 */
async function generateSignature(payload: Omit<TokenPayloadV3, 'signature'>): Promise<string> {
  const hmacKey = await getHmacKey()
  const encoder = new TextEncoder()
  const payloadJson = JSON.stringify(payload)
  const payloadBytes = encoder.encode(payloadJson)
  const signature = await webCrypto.subtle.sign('HMAC', hmacKey, payloadBytes)
  const signatureArray = new Uint8Array(signature)
  return toUrlSafeBase64(signatureArray)
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifySignature(payload: Omit<TokenPayloadV3, 'signature'>, signature: string): Promise<boolean> {
  try {
    const hmacKey = await getHmacKey()
    const encoder = new TextEncoder()
    const payloadJson = JSON.stringify(payload)
    const payloadBytes = encoder.encode(payloadJson)
    const signatureBytes = base64UrlToUint8Array(signature)
    return await webCrypto.subtle.verify('HMAC', hmacKey, signatureBytes, payloadBytes)
  } catch {
    return false
  }
}

/**
 * Encrypt v3 payload and generate token
 * 
 * Process:
 * 1. Generate random padding and entropy
 * 2. Create device hashes (IP/UA) if provided
 * 3. Build payload with signature
 * 4. Encrypt with AES-256-GCM
 * 5. Encode as base64url
 * 6. Prefix with v3_
 * 
 * @param payload Base payload (without version, rndPad, entropy, issuedAt, signature)
 * @param options Options for token generation
 * @returns Encrypted token string (v3_<base64url>)
 */
export async function encryptPayloadV3(
  payload: Omit<TokenPayloadV3, 'version' | 'rndPad' | 'entropy' | 'issuedAt' | 'signature'>,
  options?: {
    ip?: string
    userAgent?: string
    fpBinding?: boolean
  }
): Promise<string> {
  try {
    // 1. Generate random padding (32-64 bytes)
    const rndPad = await randomBase64Url(32, 64)
    
    // 2. Generate random entropy (12-24 bytes)
    const entropy = await randomBase64Url(12, 24)
    
    // 3. Create device hashes if IP/UA provided
    const device: TokenPayloadV3['device'] = {}
    if (options?.ip) {
      device.ipHash = await createDeviceHash(options.ip)
    }
    if (options?.userAgent) {
      device.uaHash = await createDeviceHash(options.userAgent)
    }
    
    // 4. Build payload without signature
    const payloadWithoutSig: Omit<TokenPayloadV3, 'signature'> = {
      version: 3,
      linkId: payload.linkId,
      email: payload.email,
      type: payload.type,
      expiresAt: payload.expiresAt,
      once: payload.once,
      fpBinding: options?.fpBinding ?? false,
      device: Object.keys(device).length > 0 ? device : undefined,
      rndPad,
      entropy,
      issuedAt: Math.floor(Date.now() / 1000),
    }
    
    // 5. Generate signature
    const signature = await generateSignature(payloadWithoutSig)
    
    // 6. Add signature to payload
    const fullPayload: TokenPayloadV3 = {
      ...payloadWithoutSig,
      signature,
    }
    
    // 7. Serialize to JSON
    const plaintext = JSON.stringify(fullPayload)
    const encoder = new TextEncoder()
    const plaintextBytes = encoder.encode(plaintext)
    
    // 8. Generate random 12-byte IV
    const iv = await randomBytes(ENCRYPTION_CONFIG.ivLength)
    
    // 9. Get encryption key
    const key = await getEncryptionKeyV3()
    
    // 10. Encrypt with AES-256-GCM
    const encrypted = await webCrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: ENCRYPTION_CONFIG.tagLength * 8, // bits
      },
      key,
      plaintextBytes
    )
    
    // 11. Extract ciphertext and auth tag
    const encryptedArray = new Uint8Array(encrypted)
    // GCM mode: ciphertext + auth tag are combined
    // Auth tag is last 16 bytes
    const authTag = encryptedArray.slice(-ENCRYPTION_CONFIG.tagLength)
    const ciphertext = encryptedArray.slice(0, -ENCRYPTION_CONFIG.tagLength)
    
    // 12. Combine: iv (12 bytes) + ciphertext + authTag (16 bytes)
    const combined = new Uint8Array(iv.length + ciphertext.length + authTag.length)
    combined.set(iv, 0)
    combined.set(ciphertext, iv.length)
    combined.set(authTag, iv.length + ciphertext.length)
    
    // 13. Encode as URL-safe base64
    const urlSafeBase64 = toUrlSafeBase64(combined)
    
    // 14. Prepend version prefix
    return `${TOKEN_PREFIX_V3}${urlSafeBase64}`
  } catch (error) {
    throw new Error(`Failed to encrypt v3 payload: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decrypt v3 token and verify signature
 * 
 * Process:
 * 1. Normalize token
 * 2. Decode base64url
 * 3. Extract IV, ciphertext, auth tag
 * 4. Decrypt with AES-256-GCM
 * 5. Parse JSON payload
 * 6. Verify signature
 * 7. Check expiration
 * 8. Verify device binding if enabled
 * 
 * @param token Encrypted token string
 * @param options Options for verification (IP, UA for device binding)
 * @returns Decrypted token payload
 * @throws InvalidTokenError, InvalidSignatureError, LinkExpiredError
 */
export async function decryptTokenV3(
  token: string,
  options?: {
    ip?: string
    userAgent?: string
    checkOneTimeUse?: (tokenHash: string) => Promise<boolean>
    markTokenUsed?: (tokenHash: string, linkId: string, ip?: string, userAgent?: string) => Promise<void>
  }
): Promise<TokenPayloadV3> {
  try {
    // 1. Normalize token
    const normalized = normalizeToken(token)
    
    // 2. Validate version prefix
    if (!normalized.startsWith(TOKEN_PREFIX_V3)) {
      throw new InvalidTokenError(`Token must start with ${TOKEN_PREFIX_V3}`)
    }
    
    // 3. Extract encoded part after prefix
    const encoded = normalized.slice(TOKEN_PREFIX_V3.length)
    if (!encoded) {
      throw new InvalidTokenError('Token has no encoded data after prefix')
    }
    
    // 4. Convert URL-safe base64 to Uint8Array
    const combined = base64UrlToUint8Array(encoded)
    
    // 5. Validate minimum length (iv + authTag = 12 + 16 = 28 bytes minimum)
    if (combined.length < 28) {
      throw new InvalidTokenError('Token is too short to contain valid encrypted data')
    }
    
    // 6. Extract IV (first 12 bytes)
    const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength)
    
    // 7. Extract auth tag (last 16 bytes)
    const authTag = combined.slice(-ENCRYPTION_CONFIG.tagLength)
    
    // 8. Extract ciphertext (middle bytes)
    const ciphertext = combined.slice(
      ENCRYPTION_CONFIG.ivLength,
      combined.length - ENCRYPTION_CONFIG.tagLength
    )
    
    // 9. Reconstruct encrypted data (ciphertext + auth tag)
    const encrypted = new Uint8Array(ciphertext.length + authTag.length)
    encrypted.set(ciphertext, 0)
    encrypted.set(authTag, ciphertext.length)
    
    // 10. Get decryption key
    const key = await getEncryptionKeyV3()
    
    // 11. Decrypt with AES-256-GCM
    let plaintextBytes: Uint8Array
    try {
      const decrypted = await webCrypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.tagLength * 8, // bits
        },
        key,
        encrypted
      )
      plaintextBytes = new Uint8Array(decrypted)
    } catch (error) {
      throw new InvalidTokenError('Token decryption failed - invalid or corrupted token')
    }
    
    // 12. Decode to string
    const decoder = new TextDecoder()
    const plaintext = decoder.decode(plaintextBytes)
    
    // 13. Parse JSON payload
    let payload: TokenPayloadV3
    try {
      payload = JSON.parse(plaintext) as TokenPayloadV3
    } catch (error) {
      throw new InvalidTokenError('Token payload is not valid JSON')
    }
    
    // 14. Validate version
    if (payload.version !== 3) {
      throw new InvalidTokenError('Token version mismatch')
    }
    
    // 15. Extract signature and verify
    const { signature, ...payloadWithoutSig } = payload
    const isValid = await verifySignature(payloadWithoutSig, signature)
    if (!isValid) {
      throw new InvalidSignatureError('Token signature verification failed')
    }
    
    // 16. Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.expiresAt < now) {
      throw new LinkExpiredError(`Token expired at ${new Date(payload.expiresAt * 1000).toISOString()}`)
    }
    
    // 17. Verify device binding if enabled
    if (payload.fpBinding && payload.device) {
      if (options?.ip && payload.device.ipHash) {
        const expectedIpHash = await createDeviceHash(options.ip)
        if (expectedIpHash !== payload.device.ipHash) {
          throw new InvalidTokenError('IP address binding mismatch')
        }
      }
      if (options?.userAgent && payload.device.uaHash) {
        const expectedUaHash = await createDeviceHash(options.userAgent)
        if (expectedUaHash !== payload.device.uaHash) {
          throw new InvalidTokenError('User-agent binding mismatch')
        }
      }
    }
    
    // 18. Check one-time-use if enabled
    if (payload.once && options?.checkOneTimeUse) {
      // Generate token hash for checking
      const tokenHash = await createTokenHash(normalized)
      const isUsed = await options.checkOneTimeUse(tokenHash)
      if (isUsed) {
        throw new TokenAlreadyUsedError('Token has already been used')
      }
      
      // Mark token as used
      if (options.markTokenUsed) {
        await options.markTokenUsed(tokenHash, payload.linkId, options.ip, options.userAgent)
      }
    }
    
    return payload
  } catch (error) {
    if (error instanceof InvalidTokenError || error instanceof InvalidSignatureError || 
        error instanceof LinkExpiredError || error instanceof TokenAlreadyUsedError) {
      throw error
    }
    throw new InvalidTokenError(`v3 token decryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Create SHA-256 hash of token for consumed_tokens table
 */
async function createTokenHash(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const tokenBytes = encoder.encode(token)
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', tokenBytes)
  const hashArray = new Uint8Array(hashBuffer)
  return toUrlSafeBase64(hashArray)
}

/**
 * Normalize a token to handle email client corruption
 * 
 * Fixes common issues:
 * - Double encoding (URL encoding applied multiple times)
 * - Query parameter wrappers (?token=, &token=)
 * - Open redirect wrappers (%26id%3D...)
 * - Unicode normalization issues
 * - Extra whitespace
 * 
 * Should ALWAYS return a clean v1_... token or throw error.
 * 
 * @param token Raw token string (may be corrupted)
 * @returns Normalized token string (v1_<url-safe-base64>)
 * @throws InvalidTokenError if token cannot be normalized
 */
export function normalizeToken(token: string): string {
  if (!token || typeof token !== 'string') {
    throw new InvalidTokenError('Token must be a non-empty string')
  }
  
  let normalized = token
  
  // 1. Trim whitespace
  normalized = normalized.trim()
  
  // 2. Remove surrounding quotes
  normalized = normalized.replace(/^["']|["']$/g, '')
  
  // 3. If it's a full URL, extract token first
  if (normalized.includes('://') || normalized.startsWith('http')) {
    const extracted = extractTokenFromUrl(normalized)
    if (extracted) {
      normalized = extracted
    }
  }
  
  // 4. Remove query parameter wrappers: ?token=, &token=, ?id=, &id=
  normalized = normalized.replace(/[?&](?:token|id)=([^&]*)/i, '$1')
  
  // 5. Remove everything after &id= or &token= (if not already handled)
  normalized = normalized.split('&id=')[0]
  normalized = normalized.split('&token=')[0]
  
  // 6. Remove open redirect wrappers: %26id%3D... patterns
  // Try to decode URL encoding (may be double-encoded)
  let decoded = normalized
  let decodeAttempts = 0
  const maxDecodeAttempts = 5
  
  while (decodeAttempts < maxDecodeAttempts && decoded.includes('%')) {
    try {
      const prev = decoded
      decoded = decodeURIComponent(decoded)
      // If decoding didn't change anything, break
      if (prev === decoded) break
      decodeAttempts++
    } catch {
      // If decoding fails, stop trying
      break
    }
  }
  
  normalized = decoded
  
  // 7. Remove %26id%3D patterns (URL-encoded &id=)
  normalized = normalized.replace(/%26id%3D([^&%]*)/gi, '$1')
  normalized = normalized.replace(/&id=([^&]*)/gi, '$1')
  
  // 8. Extract v1_/v2_/v3_ token if embedded in URL
  const versionMatch = normalized.match(/(v[123]_[A-Za-z0-9_\-]+)/i)
  if (versionMatch) {
    normalized = versionMatch[0]
  }
  
  // 9. Apply Unicode normalization (NFKC)
  try {
    normalized = normalized.normalize('NFKC')
  } catch {
    // If normalization fails, continue with original
  }
  
  // 10. Trim again after all processing
  normalized = normalized.trim()
  
  // 11. PHASE 7.4 FIX: Support JWT tokens (from createToken in lib/tokens.ts)
  // JWT tokens start with 'eyJ' (base64url encoded JSON payload)
  // Format: <base64url-payload>.<signature>
  if (normalized.startsWith('eyJ')) {
    // JWT token - validate it has the dot separator
    if (normalized.includes('.')) {
      const parts = normalized.split('.')
      if (parts.length >= 2) {
        // Valid JWT format - return as-is (no prefix needed)
        return normalized
      }
    }
    // Invalid JWT format - fall through to error
  }
  
  // 12. Validate format: must start with v1_, v2_, or v3_
  if (!normalized.startsWith(TOKEN_PREFIX) && 
      !normalized.startsWith('v2_') && 
      !normalized.startsWith(TOKEN_PREFIX_V3)) {
    throw new InvalidTokenError(`Token must start with ${TOKEN_PREFIX}, v2_, ${TOKEN_PREFIX_V3}, or be a JWT token (eyJ...), got: ${normalized.substring(0, 20)}...`)
  }
  
  // 13. Validate the rest is valid URL-safe base64
  const prefix = normalized.startsWith(TOKEN_PREFIX_V3) ? TOKEN_PREFIX_V3 : 
                 normalized.startsWith('v2_') ? 'v2_' : TOKEN_PREFIX
  const encodedPart = normalized.slice(prefix.length)
  if (!encodedPart || !/^[A-Za-z0-9_\-]+$/.test(encodedPart)) {
    throw new InvalidTokenError(`Token contains invalid characters after ${prefix} prefix`)
  }
  
  return normalized
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate token format without decrypting
 * 
 * @param token Token string to validate
 * @returns true if token format is valid, false otherwise
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // Must match: ^v[123]_[A-Za-z0-9_\-]+$
  const pattern = /^v[123]_[A-Za-z0-9_\-]+$/
  return pattern.test(token)
}

/**
 * Extract token from URL
 * 
 * Handles various URL formats:
 * - Format A: /r/<token>
 * - Format B: /?id=<token>
 * - Format C: /r/<mappingId>/<token>
 * - Legacy: https://site.com/?token=v1_xxxx&id=123
 * - Open redirect wrappers
 * - Random encoded wrappers
 * 
 * @param url URL string
 * @returns Extracted token or null if not found
 */
export function extractTokenFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }
  
  let searchUrl = url
  
  // Try to decode URL encoding multiple times (handle double/triple encoding)
  let decodeAttempts = 0
  const maxDecodeAttempts = 5
  
  while (decodeAttempts < maxDecodeAttempts && searchUrl.includes('%')) {
    try {
      const prev = searchUrl
      searchUrl = decodeURIComponent(searchUrl)
      if (prev === searchUrl) break
      decodeAttempts++
    } catch {
      break
    }
  }
  
  // Try parsing as URL first (handles formats A, B, C)
  try {
    const urlObj = new URL(searchUrl)
    
    // Format B: Extract from query parameter ?id=<token>
    const idParam = urlObj.searchParams.get('id')
    if (idParam && isValidTokenFormat(idParam)) {
      return idParam
    }
    
    // Format A: Extract from /r/<token> or /<entropy>/r/<token>
    // Format C: Extract from /r/<mappingId>/<token> or /<entropy>/r/<mappingId>/<token>
    // Handle daily mutation by finding "/r/" anywhere in the pathname
    const pathname = urlObj.pathname
    const rIndex = pathname.indexOf('/r/')
    
    if (rIndex !== -1) {
      // Extract everything after "/r/"
      const afterR = pathname.substring(rIndex + 3) // +3 to skip "/r/"
      const pathParts = afterR.split('/').filter(p => p) // Remove empty parts
      
      if (pathParts.length === 1) {
        // Format A: /r/<token> or /<entropy>/r/<token>
        const token = pathParts[0]
        if (isValidTokenFormat(token)) {
          return token
        }
      } else if (pathParts.length === 2) {
        // Format C: /r/<mappingId>/<token> or /<entropy>/r/<mappingId>/<token>
        const token = pathParts[1]
        if (isValidTokenFormat(token)) {
          return token
        }
      }
    }
    
    // Legacy: Check query parameters: token, id
    const tokenParam = urlObj.searchParams.get('token')
    if (tokenParam && isValidTokenFormat(tokenParam)) {
      return tokenParam
    }
    
    // Check hash fragment
    if (urlObj.hash) {
      const versionPattern = /v[123]_[A-Za-z0-9_\-]+/g
      const hashMatch = urlObj.hash.match(versionPattern)
      if (hashMatch && hashMatch.length > 0) {
        for (const match of hashMatch) {
          if (isValidTokenFormat(match)) {
            return match
          }
        }
      }
    }
  } catch {
    // If URL parsing fails, continue with regex search
  }
  
  // Fallback: Look for v1_/v2_/v3_ pattern directly in the URL
  const versionPattern = /v[123]_[A-Za-z0-9_\-]+/g
  const matches = searchUrl.match(versionPattern)
  
  if (matches && matches.length > 0) {
    // Return the last match (most likely to be the actual token)
    for (let i = matches.length - 1; i >= 0; i--) {
      if (isValidTokenFormat(matches[i])) {
        return matches[i]
      }
    }
  }
  
  return null
}

// ============================================
// Hardened Mode Helper Functions
// ============================================

/**
 * Create token payload with binding data for hardened mode
 * 
 * @param basePayload Base token payload
 * @param context Security context with fingerprint, IP, etc.
 * @returns Token payload with binding data
 */
export function createHardenedPayload(
  basePayload: Omit<TokenPayload, 'ts' | 'fingerprintHash' | 'ipBinding' | 'uaFamily'>,
  context: {
    fingerprint?: string
    ip?: string
    asn?: string
    continent?: string
    region?: string
    browserFamily?: string
  }
): TokenPayload {
  // Ensure basePayload has required fields
  if (!basePayload.linkId || !basePayload.expiresAt || !basePayload.type) {
    throw new Error('Base payload must include linkId, expiresAt, and type')
  }
  
  // Create payload with all base fields plus timestamp
  const payload: TokenPayload = {
    linkId: basePayload.linkId,
    expiresAt: basePayload.expiresAt,
    type: basePayload.type,
    email: basePayload.email,
    ts: Date.now(), // Millisecond timestamp for expiry window
  }
  
  // Add fingerprint binding
  if (context.fingerprint) {
    if (!nodeCrypto) {
      throw new Error('Node crypto required for hardened payload creation')
    }
    payload.fingerprintHash = nodeCrypto.createHash('sha256')
      .update(context.fingerprint)
      .digest('hex')
  }
  
  // Add IP/ASN/Region binding
  if (context.ip) {
    if (!nodeCrypto) {
      throw new Error('Node crypto required for hardened payload creation')
    }
    const bindingString = `${context.ip}|${context.asn || ''}|${context.continent || ''}|${context.region || ''}`
    payload.ipBinding = nodeCrypto.createHash('sha256')
      .update(bindingString)
      .digest('hex')
  }
  
  // Add user-agent family binding
  if (context.browserFamily) {
    payload.uaFamily = context.browserFamily
  }
  
  return payload
}

/**
 * Extract browser family from user-agent string
 * 
 * @param userAgent User-agent string
 * @returns Browser family (chrome, safari, firefox, edge, etc.)
 */
export function extractBrowserFamily(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    return 'chrome'
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'safari'
  } else if (ua.includes('firefox')) {
    return 'firefox'
  } else if (ua.includes('edg')) {
    return 'edge'
  } else if (ua.includes('opera') || ua.includes('opr')) {
    return 'opera'
  }
  
  return 'unknown'
}

