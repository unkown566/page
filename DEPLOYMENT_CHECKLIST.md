# ✅ DEPLOYMENT CHECKLIST

## Phase 1: Local Setup (5 minutes)
- [ ] Read `🆘_SETTINGS_NOT_SAVING_README.md`
- [ ] Run `./QUICK_SETTINGS_CHECK.sh` locally
- [ ] Verify output shows all ✅ checks
- [ ] Confirm `npm run build` succeeds

## Phase 2: GitHub Push (5 minutes)
- [ ] Set up SSH agent:
  ```bash
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_ed25519
  # Enter passphrase when prompted
  ```
- [ ] Verify all changes committed:
  ```bash
  git status  # Should be clean
  git log --oneline -5  # Should show our commits
  ```
- [ ] Push to GitHub:
  ```bash
  git push origin main -v
  ```
- [ ] Verify on GitHub website (optional)

## Phase 3: VPS Deployment (10 minutes)
- [ ] SSH to VPS:
  ```bash
  ssh root@eciconstruction.biz
  ```

- [ ] Navigate to project:
  ```bash
  cd /var/www/japan-landing
  ```

- [ ] Pull latest code:
  ```bash
  git pull origin main
  ```

- [ ] Build application:
  ```bash
  npm run build 2>&1 | tail -20
  # Should end with: ✓ Compiled successfully
  ```

- [ ] Stop current PM2 app:
  ```bash
  pm2 stop japan-landing
  pm2 delete japan-landing
  ```

- [ ] Start fresh PM2 process:
  ```bash
  pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
  pm2 save
  ```

- [ ] Verify running:
  ```bash
  pm2 list  # Should show japan-landing as online
  ```

## Phase 4: Testing (5 minutes)
- [ ] Open https://eciconstuction.biz/mamacita/settings
- [ ] **Are you logged in?** If not, login first
- [ ] **Change ONE setting** (e.g., toggle a checkbox)
- [ ] **Click "Save Settings"**
- [ ] **Check for errors:**
  - Open DevTools (F12)
  - Console tab - any errors?
  - Network tab - POST request succeeded?
  - Did you see "Settings saved successfully!" toast?

- [ ] **Verify persistence:**
  - Refresh page (F5)
  - Is the setting still changed? (YES ✅ or NO ❌)

## Phase 5: Log Collection (3 minutes)
- [ ] **While still on Settings page**, watch logs:
  ```bash
  # In SEPARATE terminal:
  pm2 logs japan-landing | grep -E "SETTINGS|FILE I/O"
  ```

- [ ] **Trigger save again** by changing a setting
- [ ] **Copy the log output** (should see multiple lines with 📝, ✅, ❌ emojis)
- [ ] **Take screenshot** of browser console (if any errors)
- [ ] **Note the result**: Did it save? (YES/NO)

## Phase 6: Reporting (2 minutes)
- [ ] Share with me:
  1. **Screenshot of browser console** (F12)
  2. **Full PM2 logs output** (from Phase 5)
  3. **Answer: Did setting persist?** (YES/NO)
  4. **Any error messages you see**

## Success Criteria
✅ All checks pass if:
- [ ] Build completes without errors
- [ ] PM2 shows app as "online"
- [ ] Settings page loads without errors
- [ ] Saving produces logs with ✅ indicators
- [ ] Setting change persists after page refresh
- [ ] Toast says "Settings saved successfully!"

## Troubleshooting During Testing

### If page won't load:
```bash
# Check if PM2 started
pm2 list

# Check for errors
pm2 logs japan-landing | tail -50

# Try manual restart
pm2 restart japan-landing
```

### If no logs appear:
```bash
# Check if grep is working
pm2 logs japan-landing | head -20

# If yes, then logs don't contain "SETTINGS" or "FILE I/O"
# This means: 🔴 Logging statements not running
# Possible issue: Edge Runtime detected or API not called
```

### If save produces error:
```bash
# Look for specific error in logs:
pm2 logs japan-landing | grep -i "error\|fail\|denied"

# Common fixes:
# Permission denied → chmod 600 .config-cache.json
# File not found → touch .config-cache.json && chmod 600
# Edge Runtime → Check route.ts has "export const runtime = 'nodejs'"
```

## Rollback Plan (if needed)
```bash
# If something breaks, revert quickly:
git revert HEAD  # Undo latest commit
git push origin main
# Then restart PM2

# Or go back one commit:
git reset --hard HEAD~1
git push origin main --force-with-lease
```

---

## 📝 Example - Successful Save Logs

When everything works, you'll see:
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
[FILE I/O] 🔄 Renaming: .../tmp.abc123 → .config-cache.json
[FILE I/O] ✅ File renamed successfully
[FILE I/O] 🔐 Permissions set to 0600
[ADMIN SETTINGS] ✅ Settings written successfully
[ADMIN SETTINGS] 🧹 Cache cleared
```

---

## ⏱️ Time Estimate
- Phase 1 (Local): 5 min
- Phase 2 (Push): 5 min
- Phase 3 (Deploy): 10 min
- Phase 4 (Test): 5 min
- Phase 5 (Logs): 3 min
- Phase 6 (Report): 2 min
- **Total: ~30 minutes**

---

## 🎯 End Goal
Once this checklist is complete, we'll have:
1. ✅ Latest code deployed to VPS
2. ✅ Comprehensive logging active
3. ✅ Test results showing save behavior
4. ✅ Exact error point identified (if any)
5. ✅ Targeted fix ready to apply

**Result**: Settings issue pinpointed and fixable! 🎉

---

**Start Date**: Nov 14, 2025
**Status**: Ready to deploy
**Checkpoint**: This checklist

Good luck! 🚀
