# ⚙️ SETTINGS SYSTEM DIAGNOSTIC REPORT

## 🔴 PROBLEM STATEMENT
User reports: "Settings are not saving"

## ✅ WHAT WE VERIFIED

### 1. Local Storage
- ✅ `.config-cache.json` exists
- ✅ File has proper content (verified 2229 bytes)
- ✅ File permissions: 0600 (owner read/write only)
- ✅ Last modified: Nov 14 03:11 (recent)

### 2. Code Structure
- ✅ `lib/adminSettings.ts` exports all necessary functions
  - `getSettings()` - loads from file
  - `saveSettings()` - saves to file with atomic writes
  - `loadSettings()` - alias with caching
  - `getCachedSettings()` - synchronous access
  - `updateSetting()` - path-based updates
  
- ✅ `app/api/admin/settings/route.ts` implemented
  - GET handler: loads settings, requires auth
  - POST handler: saves settings, requires auth + CSRF
  
- ✅ `app/mamacita/settings/page.tsx` client UI
  - Loads CSRF token from `/api/csrf-token`
  - Sends POST with settings
  - Reloads after successful save

### 3. File I/O
- ✅ `lib/secureFileSystem.ts` implements
  - `secureReadJSON()` with file locking
  - `secureWriteJSON()` with atomic writes
  - Proper error handling

### 4. Validation
- ✅ `lib/settingsValidation.ts` has Zod schema
  - All fields marked as `.optional()`
  - Proper types for all settings

## ❓ POSSIBLE ROOT CAUSES

### 🔴 CRITICAL - Check Browser Console
**When you click "Save Settings":**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for any errors
4. Go to **Network** tab
5. Look for POST request to `/api/admin/settings`
6. Check the response - what does the server say?

### 🟡 LIKELY - CSRF Token Issue
```typescript
// Client sends:
'X-CSRF-Token': csrfToken

// Server expects:
request.headers.get('x-csrf-token')
```
**HTTP headers are case-insensitive**, so this should work.
**BUT**: Check if CSRF token is actually being loaded:
- Open DevTools Console
- Type: `localStorage.getItem('csrf-token')`
- Does it have a value?

### 🟡 POSSIBLE - Rate Limiting
The API has rate limiting (100 req/min):
```typescript
const rateLimit = await apiLimiter.check(request)
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded...' },
    { status: 429 }
  )
}
```
**Fix**: Wait a minute and try again, or check if you're hitting the limit

### 🟡 POSSIBLE - Auth Check Failing
```typescript
const authError = await requireAdmin(request)
if (authError) return authError
```
**Check**: Are you logged in? Are you at `/mamacita/settings`?

### 🟡 POSSIBLE - Zod Validation Failing
If validation fails, API returns:
```json
{
  "error": "Invalid settings",
  "details": [
    { "path": "security.captcha.provider", "message": "..." }
  ]
}
```
**Check**: Browser console for the exact error details

### 🔴 CRITICAL - VPS Deployment Issue
**On the VPS**, the `.config-cache.json` file might be:
1. **Missing** - needs to be created
2. **Wrong permissions** - needs to be 0600
3. **Wrong ownership** - needs to be app user
4. **In wrong location** - should be in `/var/www/japan-landing/`

## 🛠️ DIAGNOSTIC STEPS

### Step 1: Check Browser
```
1. Go to https://eciconstuction.biz/mamacita/settings
2. Open DevTools (F12)
3. Change any setting
4. Click Save
5. Check Console tab for errors
6. Check Network tab for response
```

### Step 2: Check VPS File
```bash
ssh root@eciconstruction.biz
ls -la /var/www/japan-landing/.config-cache.json
cat /var/www/japan-landing/.config-cache.json | head -30
```

### Step 3: Check VPS Permissions
```bash
ssh root@eciconstruction.biz
# Should be 0600 and owned by app user
stat /var/www/japan-landing/.config-cache.json
```

### Step 4: Check VPS PM2 Logs
```bash
ssh root@eciconstruction.biz
pm2 logs japan-landing | tail -100
# Look for any errors when saving settings
```

## 🔧 FIXES TO APPLY

### If CSRF token not loading:
```typescript
// In app/mamacita/settings/page.tsx - line 31
fetch('/api/csrf-token')
  .then(r => r.json())
  .then(data => {
    console.log('CSRF token loaded:', data.token) // DEBUG
    setCsrfToken(data.token)
  })
```

### If settings not persisting on VPS:
```bash
# 1. Check/recreate file
ssh root@eciconstruction.biz
rm /var/www/japan-landing/.config-cache.json
touch /var/www/japan-landing/.config-cache.json
chmod 600 /var/www/japan-landing/.config-cache.json

# 2. Restart app
pm2 restart japan-landing
```

### If validation failing:
Add detailed logging to API:
```typescript
// In app/api/admin/settings/route.ts - line 92
try {
  const validatedSettings = settingsSchema.parse(settings)
  console.log('✅ Settings validated:', Object.keys(validatedSettings))
  await saveSettings(validatedSettings as unknown as AdminSettings)
} catch (error) {
  console.error('❌ Validation failed:', error)
  // ... existing error handling
}
```

## 🚀 NEXT STEPS

1. **Tell me what error you see in the browser console**
2. **Share the network response from POST /api/admin/settings**
3. **Tell me if you're on local dev or VPS**
4. **Run the VPS diagnostic commands above and share output**

Once you provide this info, I can pinpoint the exact issue! 🎯

