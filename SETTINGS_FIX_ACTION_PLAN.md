# 🎯 SETTINGS NOT SAVING - ACTION PLAN

## What We Found
✅ Settings system is **properly structured**:
- File storage: `.config-cache.json` (exists and has content)
- API endpoints: GET and POST `/api/admin/settings`
- Client UI: `/mamacita/settings` page
- Validation: Zod schema with all fields optional
- File I/O: Atomic writes with file locking

❓ **Settings not persisting** (cause unknown - need your feedback)

## What We Added
Added comprehensive **debug logging** to trace the exact point of failure:

### 1. Settings API (`app/api/admin/settings/route.ts`)
```
✓ Logs received settings structure
✓ Logs validation success/failure
✓ Logs file save completion
```

### 2. File I/O (`lib/secureFileSystem.ts`)
```
✓ Logs directory creation
✓ Logs temp file write
✓ Logs atomic rename operation
✓ Logs permission changes
✓ Logs any write errors
```

### 3. Settings Module (`lib/adminSettings.ts`)
```
✓ Logs Edge Runtime detection
✓ Logs file path being used
✓ Logs cache invalidation
```

## 🚀 NEXT STEPS

### STEP 1: Build & Deploy
```bash
# Build
npm run build

# Rebuild on VPS and restart
ssh root@eciconstruction.biz
cd /var/www/japan-landing
pm2 stop japan-landing
git pull origin main
npm run build
pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
pm2 save
```

### STEP 2: Test & Observe Logs
1. Go to: `https://eciconstuction.biz/mamacita/settings`
2. Change **one setting** (e.g., toggle a checkbox)
3. Click **"Save Settings"**
4. Watch the **PM2 logs** on VPS:
```bash
ssh root@eciconstruction.biz
pm2 logs japan-landing | grep -E "SETTINGS|FILE I/O"
```

### STEP 3: Share Logs
Send me:
1. **Browser console output** (screenshot or text)
2. **Network tab response** from POST `/api/admin/settings`
3. **PM2 logs output** (from step 2)
4. **File existence check**:
```bash
ssh root@eciconstruction.biz
ls -la /var/www/japan-landing/.config-cache.json
stat /var/www/japan-landing/.config-cache.json
```

## 🔍 Expected Logs (Successful Save)

You should see logs like:
```
[SETTINGS API] 📥 Received settings for validation: {...}
[SETTINGS API] ✅ Settings validated successfully
[ADMIN SETTINGS] 💾 saveSettings() called
[ADMIN SETTINGS] Is Edge Runtime? false
[ADMIN SETTINGS] 📂 Loading file system utilities...
[ADMIN SETTINGS] 📝 Settings file path: /var/www/japan-landing/.config-cache.json
[ADMIN SETTINGS] 🔄 Writing settings to disk...
[FILE I/O] 📁 Creating directory: /var/www/japan-landing
[FILE I/O] ✍️  Writing to temp file: /var/www/japan-landing/.config-cache.json.tmp.abc123
[FILE I/O] 📊 Data size: 2567 bytes
[FILE I/O] ✅ Temp file written
[FILE I/O] 🔄 Renaming: /var/www/japan-landing/.config-cache.json.tmp.abc123 → /var/www/japan-landing/.config-cache.json
[FILE I/O] ✅ File renamed successfully
[FILE I/O] 🔐 Permissions set to 0600
[ADMIN SETTINGS] ✅ Settings written successfully
[ADMIN SETTINGS] 🧹 Cache cleared
[SETTINGS API] 💾 Settings saved to disk
```

## ⚠️ Common Issues & Fixes

### Issue: "Rate limit exceeded"
- **Cause**: Submitting form too many times
- **Fix**: Wait 1 minute, try again

### Issue: "Invalid CSRF token"
- **Cause**: CSRF token not loaded or expired
- **Fix**: Refresh page before saving

### Issue: "Edge Runtime detected"
- **Cause**: API running on Edge Runtime (no file access)
- **Fix**: Ensure route has `export const runtime = 'nodejs'`

### Issue: File not found / Permission denied
- **Cause**: `.config-cache.json` doesn't exist or wrong permissions
- **Fix**:
```bash
ssh root@eciconstruction.biz
rm -f /var/www/japan-landing/.config-cache.json
touch /var/www/japan-landing/.config-cache.json
chmod 600 /var/www/japan-landing/.config-cache.json
chown www-data:www-data /var/www/japan-landing/.config-cache.json  # if needed
pm2 restart japan-landing
```

## 📋 Checklist

Before troubleshooting, verify:
- [ ] You are logged in to `/mamacita/login`
- [ ] Browser DevTools is open (F12)
- [ ] PM2 logs are being tailed (`pm2 logs japan-landing`)
- [ ] You can see the Console tab in DevTools
- [ ] You can see the Network tab in DevTools
- [ ] You have read/write access to the settings file
- [ ] Settings file has correct permissions (0600)

## 🆘 Still Stuck?

Once you provide the logs and error messages, we can:
1. **Identify the exact failure point**
2. **Apply targeted fix**
3. **Verify it works**

Just follow the "STEP 2: Test & Observe Logs" section above!

---

**File**: `/Users/user/Japan Landing page for visit/SETTINGS_FIX_ACTION_PLAN.md`
**Last Updated**: Nov 14, 2025
**Status**: Ready for testing

