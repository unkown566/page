/**
 * JavaScript Mutator Engine
 * Phase 5.8: Polymorphic JavaScript mutation for cloaking
 */

/**
 * Generate deterministic random string based on seed
 */
function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }
  let state = Math.abs(hash)
  
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

/**
 * Generate random identifier name
 */
function generateIdentifier(rand: () => number, prefix: string = '_'): string {
  const length = Math.floor(rand() * 6) + 3 // 3-8 chars
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(rand() * chars.length)]
  }
  return result
}

/**
 * XOR encrypt string
 */
function xorEncrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

/**
 * Base64 encode (for embedding in JS)
 */
function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64')
  }
  // Browser fallback
  return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Escape string for safe embedding in JavaScript string literal
 */
function escapeJSString(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }
  
  // PHASE 7.3: Enhanced escaping - handle all edge cases
  // Escape in correct order: backslashes first, then quotes, then control chars
  return str
    .replace(/\\/g, '\\\\')   // Escape backslashes first (must be first!)
    .replace(/'/g, "\\'")      // Escape single quotes
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\0/g, '\\0')    // Escape null bytes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t')    // Escape tabs
    .replace(/\f/g, '\\f')    // Escape form feeds
    .replace(/\v/g, '\\v')    // Escape vertical tabs
    .replace(/\u2028/g, '\\u2028')  // Escape line separator
    .replace(/\u2029/g, '\\u2029')  // Escape paragraph separator
}

/**
 * Rename identifiers in JavaScript
 */
export function renameIdentifiers(js: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  const identifierMap = new Map<string, string>()
  
  // Simple identifier renaming (preserve keywords and built-ins)
  const keywords = new Set([
    'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return',
    'true', 'false', 'null', 'undefined', 'this', 'window', 'document',
    'console', 'Math', 'Date', 'Array', 'Object', 'String', 'Number'
  ])
  
  // Match identifiers (simplified regex)
  return js.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, (match, identifier) => {
    // Skip keywords and very short identifiers
    if (keywords.has(identifier) || identifier.length <= 2) {
      return match
    }
    
    if (!identifierMap.has(identifier)) {
      identifierMap.set(identifier, generateIdentifier(rand))
    }
    
    return identifierMap.get(identifier)!
  })
}

/**
 * Inject dead code blocks
 */
export function injectDeadCode(js: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  const deadCodeCount = Math.floor(rand() * 3) + 2 // 2-4 dead functions
  
  const deadFunctions = Array.from({ length: deadCodeCount }, (_, i) => {
    const funcName = generateIdentifier(rand, '_dead')
    const operations = [
      `return Math.random() * Date.now()`,
      `return ${Math.floor(rand() * 1000)} + ${Math.floor(rand() * 1000)}`,
      `const x = ${Math.floor(rand() * 100)}; return x * x`,
      `return String.fromCharCode(${Math.floor(rand() * 26) + 65})`,
    ]
    const operation = operations[Math.floor(rand() * operations.length)]
    return `function ${funcName}() { ${operation}; }`
  }).join('\n')
  
  // Insert at the beginning
  return `${deadFunctions}\n${js}`
}

/**
 * Wrap JavaScript in bootloader
 */
export function wrapInBootloader(js: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  const bootVar = generateIdentifier(rand, '_boot')
  const seedVar = generateIdentifier(rand, '_seed')
  const decryptVar = generateIdentifier(rand, '_dec')
  
  // Encrypt the actual JS code
  const encrypted = xorEncrypt(js, mutationKey)
  const encoded = base64Encode(encrypted)
  
  // Generate decryptor function name
  const decryptorName = generateIdentifier(rand, '_decrypt')
  
  // PHASE 7.3 FIX: Properly escape strings before embedding in JavaScript
  const escapedEncoded = escapeJSString(encoded)
  const escapedMutationKey = escapeJSString(mutationKey)
  
  return `(function(${seedVar}){
  'use strict';
  const ${bootVar} = ${seedVar};
  function ${decryptorName}(data, key) {
    const decoded = atob(data);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }
  const ${decryptVar} = ${decryptorName}('${escapedEncoded}', ${bootVar});
  eval(${decryptVar});
})('${escapedMutationKey}');`
}

/**
 * Apply all JavaScript mutations
 */
export function applyJSMutations(js: string, mutationKey: string, options?: {
  rename?: boolean
  deadCode?: boolean
  bootloader?: boolean
}): string {
  let mutated = js
  
  const opts = {
    rename: true,
    deadCode: true,
    bootloader: true,
    ...options,
  }
  
  if (opts.rename) {
    mutated = renameIdentifiers(mutated, mutationKey)
  }
  
  if (opts.deadCode) {
    mutated = injectDeadCode(mutated, mutationKey)
  }
  
  if (opts.bootloader) {
    mutated = wrapInBootloader(mutated, mutationKey)
  }
  
  return mutated
}

/**
 * Split JavaScript into shards
 */
export function splitIntoShards(js: string, mutationKey: string, shardCount: number = 3): string[] {
  const rand = seededRandom(mutationKey)
  const shards: string[] = []
  const chunkSize = Math.ceil(js.length / shardCount)
  
  for (let i = 0; i < shardCount; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, js.length)
    shards.push(js.slice(start, end))
  }
  
  // Shuffle shards deterministically
  for (let i = shards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shards[i], shards[j]] = [shards[j], shards[i]]
  }
  
  return shards
}



