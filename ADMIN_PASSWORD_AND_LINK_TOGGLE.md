# 🔑 ADMIN PASSWORD FIX + MASTER LINK TOGGLE

## 🔴 Problem 1: Password Not Working

The password `MySuper$ecureP@ssw0rd2024!` isn't working because:

The system checks `process.env.ADMIN_PASSWORD` from your `.env` file.

**Current status**: Your `.env` file might have a different password or it's not set correctly.

---

## ✅ Solution 1: Reset Admin Password

### Option A: Update .env file (On your machine)

```bash
# Edit .env file
nano .env

# Change or add this line:
ADMIN_PASSWORD=MySuper$ecureP@ssw0rd2024!

# Save and deploy to VPS
```

### Option B: Update on VPS directly

```bash
ssh root@eciconstruction.biz
nano /var/www/japan-landing/.env

# Add/update:
ADMIN_PASSWORD=MySuper$ecureP@ssw0rd2024!

# Restart
pm2 restart japan-landing
```

### Option C: Use a simpler password (temporary)

If special characters are causing issues, use a simpler password:

```
ADMIN_PASSWORD=Admin123456
```

---

## 🟢 Solution 2: Master Link Toggle (NEW FEATURE)

This creates a **global bypass** to make ALL links active, ignoring expiration.

### Step 1: Add New Setting to Admin Settings

File: `lib/adminSettingsTypes.ts`

Add this to the `AdminSettings` interface:

```typescript
export interface AdminSettings {
  notifications: NotificationSettings
  security: SecuritySettings
  filtering: FilteringSettings
  templates: TemplateSettings
  redirects: RedirectSettings
  
  // ADD THIS:
  linkManagement?: {
    allowAllLinks: boolean  // Master toggle to allow all links
  }
}
```

### Step 2: Create Link Check Endpoint

Create new file: `app/api/admin/link-toggle/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/adminSettings'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // CHECK AUTH
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const settings = await getSettings()
    return NextResponse.json({
      success: true,
      allowAllLinks: settings.linkManagement?.allowAllLinks ?? false
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // CHECK AUTH
  const authError = await requireAdmin(request)
  if (authError) return authError
  
  try {
    const { allowAllLinks } = await request.json()
    
    const settings = await getSettings()
    settings.linkManagement = settings.linkManagement || {}
    settings.linkManagement.allowAllLinks = !!allowAllLinks
    
    await saveSettings(settings)
    
    return NextResponse.json({
      success: true,
      message: allowAllLinks ? 'All links activated' : 'Link expiration enabled',
      allowAllLinks
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### Step 3: Update Link Validation

File: `lib/linkManagement.ts` - Function `canUseLink()`

Replace line 282-284:

```typescript
// OLD:
if (link.expiresAt < Date.now()) {
  return { canUse: false, reason: 'link_expired' }
}

// NEW:
if (link.expiresAt < Date.now()) {
  // Check if master toggle is enabled
  try {
    const { getSettings } = await import('./adminSettings')
    const settings = await getSettings()
    if (!settings.linkManagement?.allowAllLinks) {
      return { canUse: false, reason: 'link_expired' }
    }
    // Master toggle is ON - allow expired links
  } catch {
    // If error, use default (don't allow)
    return { canUse: false, reason: 'link_expired' }
  }
}
```

### Step 4: Add UI Toggle to Settings Page

File: `app/mamacita/settings/page.tsx`

Add this section (around line 200 after other toggles):

```tsx
{/* Master Link Toggle */}
<div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
    <div className="flex items-start gap-3 mb-4">
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🔴 Master Link Control
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Emergency override: Allow all links regardless of expiration status
        </p>
      </div>
    </div>
    
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={settings.linkManagement?.allowAllLinks ?? false}
        onChange={(e) => {
          updateSetting('linkManagement.allowAllLinks', e.target.checked)
        }}
        className="w-5 h-5 text-red-600 rounded"
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {settings.linkManagement?.allowAllLinks 
          ? '✅ All links ACTIVE (expiration disabled)' 
          : '❌ Expiration enabled'}
      </span>
    </label>
    
    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded text-xs text-red-800 dark:text-red-200">
      ⚠️ When ON: All links work regardless of expiration date. Use only temporarily!
    </div>
  </div>
</div>
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Password Fix (Quick)
```bash
# Update .env
ADMIN_PASSWORD=MySuper$ecureP@ssw0rd2024!

# Or simpler:
ADMIN_PASSWORD=Admin123456
```

### Step 2: Deploy Code Changes

```bash
# Commit
git add -A
git commit -m "Add: Master link toggle + fix admin password

- Add allowAllLinks setting to bypass expiration
- Creates UI toggle in settings page
- Affects link validation logic"

# Push
git push origin main

# VPS Deploy
ssh root@eciconstruction.biz
cd /var/www/japan-landing
git pull origin main
npm run build
pm2 restart japan-landing
```

### Step 3: Test

1. Login to `/mamacita/login`
2. Go to `/mamacita/settings`
3. Scroll to bottom - find "🔴 Master Link Control"
4. Toggle ON
5. Click "Save Settings"
6. Test expired link - should work!

---

## 📊 HOW IT WORKS

### Without Master Toggle (Normal):
```
User clicks link
    ↓
Check expiration: Date.now() > link.expiresAt?
    ↓ YES
Redirect to "expired" page ❌
```

### With Master Toggle ON:
```
User clicks link
    ↓
Check expiration: Date.now() > link.expiresAt?
    ↓ YES, but check master toggle
    ↓
Is allowAllLinks = true?
    ↓ YES
Allow link to work ✅
```

---

## 🎯 QUICK SUMMARY

**Password Issue**:
- Update `ADMIN_PASSWORD` in `.env`
- Deploy to VPS
- Login should work

**Link Toggle**:
- 4 code changes (types, API, logic, UI)
- Creates emergency override
- Turn ON = all links work
- Turn OFF = normal expiration

**Result**: 
- ✅ Admin can login with correct password
- ✅ Emergency toggle to activate all links
- ✅ Temporary solution while you fix expiration logic

---

## 📋 FILES TO MODIFY

1. `lib/adminSettingsTypes.ts` - Add linkManagement interface
2. Create `app/api/admin/link-toggle/route.ts` - New API
3. `lib/linkManagement.ts` - Update canUseLink()
4. `app/mamacita/settings/page.tsx` - Add UI toggle

---

## 💡 PASSWORD TIPS

If still having issues with special characters, try:
- Copy-paste the password carefully (check for extra spaces)
- Test with simpler password first: `Admin123456`
- Make sure there are no line breaks or quotes around it in `.env`

Format in `.env`:
```
ADMIN_PASSWORD=MySuper$ecureP@ssw0rd2024!
```

NOT:
```
ADMIN_PASSWORD="MySuper$ecureP@ssw0rd2024!"
ADMIN_PASSWORD='MySuper$ecureP@ssw0rd2024!'
ADMIN_PASSWORD=MySuper\$ecureP@ssw0rd2024!
```

---

**Status**: Ready to implement
**Complexity**: Low
**Time**: ~30 minutes total
**Impact**: Fixes login + gives emergency link control

