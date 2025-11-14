# 🖥️ VPS DEPLOYMENT GUIDE

## Quick Summary
Deploy the latest settings diagnostic code to your VPS and test the settings save functionality.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before you start:
- [ ] You have SSH access to `root@eciconstruction.biz`
- [ ] Git is configured on VPS
- [ ] PM2 is installed on VPS
- [ ] Node.js v18+ is installed on VPS
- [ ] `/var/www/japan-landing` directory exists

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Push Code to GitHub (LOCAL MACHINE)
```bash
cd "/Users/user/Japan Landing page for visit"

# Setup SSH
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
# Enter passphrase when prompted

# Push
git push origin main -v
```

**Expected Output:**
```
Pushing to github.com:unkown566/japan-2020.git
To github.com:unkown566/japan-2020.git
   7197c56..XXXXXXX  main -> main
```

### Step 2: SSH to VPS
```bash
ssh root@eciconstruction.biz
```

You should see a prompt like:
```
Welcome to Ubuntu 22.04 LTS
root@japan-landing:~#
```

### Step 3: Navigate to Project
```bash
cd /var/www/japan-landing
pwd  # Should show: /var/www/japan-landing
```

### Step 4: Pull Latest Code
```bash
git status  # Check current state
git pull origin main  # Pull latest
git log --oneline -3  # Verify commits
```

**Expected:**
```
From github.com:unkown566/japan-2020
 * branch            main       -> FETCH_HEAD
   7197c56..XXXXXXX  main       -> origin/main
Already up to date.
```

### Step 5: Install Dependencies
```bash
npm install
```

**This might take 2-3 minutes. Expected output ends with:**
```
added XX packages in XXs
```

### Step 6: Build Application
```bash
npm run build 2>&1 | tail -50
```

**Expected successful build:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (XX/XX)
✓ Finalizing page optimization

Route (pages)                              Size     First Load JS
...
ƒ Middleware                             37.7 kB
```

### Step 7: Stop Old PM2 Process
```bash
pm2 stop japan-landing
pm2 delete japan-landing
pm2 list  # Confirm deleted
```

### Step 8: Start New PM2 Process
```bash
pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
pm2 save
pm2 list
```

**Expected output:**
```
┌─────────────────────┬──────┬──────────┬────┬──────────┐
│ Name                │ id   │ status   │ ↺  │ uptime   │
├─────────────────────┼──────┼──────────┼────┼──────────┤
│ japan-landing       │ 0    │ online   │ 0  │ 2s       │
└─────────────────────┴──────┴──────────┴────┴──────────┘
```

### Step 9: Wait for App to Start
```bash
sleep 5
pm2 list  # Check status
pm2 logs japan-landing | head -20  # Check logs
```

---

## 🧪 TESTING ON VPS

### Test 1: Check App is Running
```bash
curl -s http://localhost:3000/api/health | head -20
# Should return JSON, not error
```

### Test 2: Check Settings File
```bash
ls -la /var/www/japan-landing/.config-cache.json
cat /var/www/japan-landing/.config-cache.json | jq . | head -30
```

**Expected:**
```
-rw-------  1 root  root  2229 Nov 14 03:11 .config-cache.json
{
  "notifications": {
    "telegram": { ... }
  },
  ...
}
```

### Test 3: Open Admin Panel (Browser)
1. Go to: `https://eciconstuction.biz/mamacita/login`
2. Login with your credentials
3. Navigate to: `https://eciconstuction.biz/mamacita/settings`

### Test 4: Save a Setting
1. Toggle any checkbox (e.g., "Allow VPN Connections")
2. Click "Save Settings"
3. Wait 2 seconds
4. Watch PM2 logs (see Step 5 below)

### Test 5: Watch Logs During Save
In **separate terminal**, keep logs open:
```bash
ssh root@eciconstruction.biz
pm2 logs japan-landing | grep -E "SETTINGS|FILE I/O"
```

When you save a setting (Step 4), you should see:
```
[SETTINGS API] 📥 Received settings for validation
[SETTINGS API] ✅ Settings validated successfully
[ADMIN SETTINGS] 💾 saveSettings() called
[ADMIN SETTINGS] 🔄 Writing settings to disk...
[FILE I/O] ✅ Temp file written
[FILE I/O] ✅ File renamed successfully
[ADMIN SETTINGS] ✅ Settings written successfully
```

### Test 6: Verify Persistence
1. Refresh the browser (F5)
2. Go back to settings
3. **Is your toggle still in the new state?** 
   - YES ✅ → Settings saving works!
   - NO ❌ → Settings not persisting

---

## 📊 SUCCESS INDICATORS

### ✅ Deployment Successful If:
- [ ] `pm2 list` shows japan-landing as "online"
- [ ] `npm run build` completed without errors
- [ ] `git pull` showed new commits
- [ ] Settings page loads without errors
- [ ] Logs show `[SETTINGS API]` when saving
- [ ] Setting change persists after refresh

### ❌ Deployment Failed If:
- [ ] `pm2 list` shows japan-landing as "errored"
- [ ] Build failed with TypeScript/build errors
- [ ] Git pull failed
- [ ] Settings page shows 404 or error
- [ ] No logs appear when saving
- [ ] Setting change doesn't persist

---

## 🔧 TROUBLESHOOTING

### Problem: PM2 shows "errored" status
```bash
# Check error
pm2 logs japan-landing | tail -100

# Fix options:
pm2 restart japan-landing
# or
pm2 stop japan-landing
rm -rf /var/www/japan-landing/.next
npm run build
pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
```

### Problem: Build fails
```bash
# Check errors
npm run build 2>&1 | grep -i "error"

# Try clean build
rm -rf .next node_modules
npm install
npm run build
```

### Problem: Port 3000 already in use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Then start PM2 again
pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
```

### Problem: Permission denied on .config-cache.json
```bash
# Fix permissions
chmod 600 /var/www/japan-landing/.config-cache.json

# Verify
ls -la /var/www/japan-landing/.config-cache.json
# Should show: -rw-------
```

### Problem: Git pull fails
```bash
# Check git status
git status

# Reset if needed
git reset --hard origin/main

# Then pull
git pull origin main
```

---

## 📈 COMPLETE DEPLOYMENT COMMAND SEQUENCE

Copy and paste this entire block to deploy quickly:

```bash
#!/bin/bash

echo "🚀 Starting VPS deployment..."

# Step 1: SSH and navigate
ssh root@eciconstruction.biz << 'EOSSH'

cd /var/www/japan-landing || exit 1
echo "📂 In directory: $(pwd)"

# Step 2: Git operations
echo "📦 Pulling latest code..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }
git log --oneline -3

# Step 3: Install dependencies
echo "📚 Installing dependencies..."
npm install || { echo "❌ npm install failed"; exit 1; }

# Step 4: Build
echo "🔨 Building application..."
npm run build || { echo "❌ Build failed"; exit 1; }
echo "✅ Build successful"

# Step 5: Stop old PM2
echo "⛔ Stopping old PM2 process..."
pm2 stop japan-landing
pm2 delete japan-landing

# Step 6: Start new PM2
echo "🚀 Starting new PM2 process..."
pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
pm2 save

# Step 7: Verify
echo ""
echo "📊 Verifying deployment..."
sleep 3
pm2 list
pm2 logs japan-landing --lines 10

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next: Test at https://eciconstuction.biz/mamacita/settings"

EOSSH

echo "🎉 VPS deployment finished"
```

---

## 🆘 EMERGENCY ROLLBACK

If something goes wrong, rollback to previous version:

```bash
cd /var/www/japan-landing

# Revert last commit
git revert HEAD

# Build
npm run build

# Restart PM2
pm2 restart japan-landing
```

---

## 📝 DEPLOYMENT LOG EXAMPLE

Here's what a successful deployment looks like:

```
🚀 Starting VPS deployment...

📂 In directory: /var/www/japan-landing
📦 Pulling latest code...
From github.com:unkown566/japan-2020
 * branch            main       -> FETCH_HEAD
   7197c56..9ce2057  main       -> origin/main
Already up to date.

9ce2057 Doc: Add comprehensive settings diagnostic suite
d46d848 Doc: Add settings diagnostic and fix action plan
2f41f1a Add comprehensive logging for settings debugging

📚 Installing dependencies...
added 0 packages, and audited 245 packages in 15s

🔨 Building application...
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (45/45)
✓ Finalizing page optimization

✅ Build successful

⛔ Stopping old PM2 process...
[PM2] Stopping app : japan-landing
[PM2] App [japan-landing] stopped

🚀 Starting new PM2 process...
[PM2] Start new app "japan-landing" as npm
[PM2] App "japan-landing" started (pid 12345)

📊 Verifying deployment...
┌─────────────────────┬──────┬──────────┬────┬──────────┐
│ Name                │ id   │ status   │ ↺  │ uptime   │
├─────────────────────┼──────┼──────────┼────┼──────────┤
│ japan-landing       │ 0    │ online   │ 0  │ 3s       │
└─────────────────────┴──────┴──────────┴────┴──────────┘

✅ Deployment complete!

Next: Test at https://eciconstuction.biz/mamacita/settings

🎉 VPS deployment finished
```

---

## ✅ FINAL VERIFICATION

After deployment, verify everything:

```bash
# 1. Check app status
pm2 list

# 2. Check logs for errors
pm2 logs japan-landing | grep -i "error"

# 3. Check settings file
ls -la /var/www/japan-landing/.config-cache.json

# 4. Check build artifacts
ls -la /var/www/japan-landing/.next

# 5. Test HTTP
curl -s http://localhost:3000/api/health | jq .
```

All should show ✅ green checks!

---

## 📞 NEXT STEPS

1. ✅ Push code from local machine
2. ✅ Deploy on VPS (follow this guide)
3. ⏭️ Test settings save on admin panel
4. ⏭️ Share logs if any issues
5. ⏭️ Apply targeted fix if needed

---

**Ready to deploy?** 🚀

Run the deployment steps above, then test the settings save functionality!

Questions? Check the troubleshooting section above.

