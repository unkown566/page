# 🗑️ DATA CLEARING GUIDE

## 📊 HOW TO CLEAR ALL DATA

Your system stores data in multiple places. Here's how to clear everything:

---

## 1️⃣ CLEAR LINK DATA (Type A, B, C)

### **Option A: Through Admin Panel** (Recommended)

1. Go to **Admin Panel** → **Links**
2. Select links you want to delete
3. Click **Delete** button
4. Confirm deletion

**This clears:**
- ✅ Link tokens
- ✅ Email lists (Type B)
- ✅ Link statistics
- ✅ Pending/captured emails

---

### **Option B: Clear Database File**

**File:** `.sessions.json`

**Method 1: Delete entire file**
```bash
rm .sessions.json
```

**Method 2: Reset to empty state**
```bash
echo '{}' > .sessions.json
```

**After clearing:** Restart your dev server
```bash
npm run dev
```

**This clears:**
- ✅ ALL links (Type A, B, C)
- ✅ ALL email lists
- ✅ ALL link statistics
- ✅ ALL visitor logs
- ✅ ALL fingerprints
- ✅ ALL session data

---

## 2️⃣ CLEAR FINGERPRINT DATA

### **Stored in:** `.sessions.json` under `fingerprints` key

**Method 1: Delete entire database**
```bash
rm .sessions.json
```

**Method 2: Clear only fingerprints (programmatic)**

Create a script `clear-fingerprints.js`:
```javascript
const fs = require('fs')

// Read current data
const data = JSON.parse(fs.readFileSync('.sessions.json', 'utf-8'))

// Clear fingerprints
data.fingerprints = {}

// Save back
fs.writeFileSync('.sessions.json', JSON.stringify(data, null, 2))

console.log('✅ Fingerprints cleared!')
```

Run:
```bash
node clear-fingerprints.js
```

---

## 3️⃣ CLEAR EMAIL-ID MAPPINGS (Type A)

### **Stored in:** `.sessions.json` under `emailIdMappings` key

**Clear Method:**

Create script `clear-email-mappings.js`:
```javascript
const fs = require('fs')

const data = JSON.parse(fs.readFileSync('.sessions.json', 'utf-8'))
data.emailIdMappings = {}

fs.writeFileSync('.sessions.json', JSON.stringify(data, null, 2))
console.log('✅ Email-ID mappings cleared!')
```

Run:
```bash
node clear-email-mappings.js
```

---

## 4️⃣ CLEAR VISITOR LOGS

### **Stored in:** `.sessions.json` under `visitors` key

**Clear Method:**

Create script `clear-visitors.js`:
```javascript
const fs = require('fs')

const data = JSON.parse(fs.readFileSync('.sessions.json', 'utf-8'))
data.visitors = []

fs.writeFileSync('.sessions.json', JSON.stringify(data, null, 2))
console.log('✅ Visitor logs cleared!')
```

---

## 5️⃣ CLEAR BROWSER DATA (Client-Side)

### **Clear SessionStorage:**

Open browser console (F12) and run:
```javascript
sessionStorage.clear()
console.log('✅ SessionStorage cleared!')
```

**This clears:**
- ✅ CAPTCHA verification state
- ✅ Link used state
- ✅ Email authorized state
- ✅ Timestamp data

---

### **Clear LocalStorage:**

```javascript
localStorage.clear()
console.log('✅ LocalStorage cleared!')
```

---

### **Clear ALL Browser Data for localhost:**

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Right-click on `http://localhost:3000`
4. Select **Clear**

**This clears:**
- ✅ Cookies
- ✅ SessionStorage
- ✅ LocalStorage
- ✅ IndexedDB
- ✅ Cache

---

## 6️⃣ COMPLETE SYSTEM RESET

### **Nuclear Option - Clear Everything:**

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Delete database
rm .sessions.json

# 3. Clear node modules cache (optional)
rm -rf .next

# 4. Restart dev server
npm run dev
```

**This clears:**
- ✅ ALL database data
- ✅ ALL links
- ✅ ALL emails
- ✅ ALL fingerprints
- ✅ ALL visitor logs
- ✅ Build cache

---

## 🔧 SELECTIVE CLEARING

### **Clear Only Type B Email Lists:**

```javascript
// clear-type-b-emails.js
const fs = require('fs')

const data = JSON.parse(fs.readFileSync('.sessions.json', 'utf-8'))

// Find all Type B links and clear their email lists
if (data.links) {
  Object.keys(data.links).forEach(key => {
    const link = data.links[key]
    if (link.type === 'generic' && link.allowedEmails) {
      link.allowedEmails = []
      link.pendingEmails = []
      link.capturedEmails = []
      link.totalEmails = 0
      link.pendingCount = 0
      link.capturedCount = 0
      console.log(`✅ Cleared email list for: ${link.name}`)
    }
  })
}

fs.writeFileSync('.sessions.json', JSON.stringify(data, null, 2))
console.log('✅ All Type B email lists cleared!')
```

---

### **Clear Only Captured Emails (Keep Pending):**

```javascript
// reset-captured-emails.js
const fs = require('fs')

const data = JSON.parse(fs.readFileSync('.sessions.json', 'utf-8'))

if (data.links) {
  Object.keys(data.links).forEach(key => {
    const link = data.links[key]
    if (link.type === 'generic') {
      // Reset captured to pending
      link.capturedEmails = []
      link.capturedCount = 0
      link.pendingEmails = link.allowedEmails || []
      link.pendingCount = link.allowedEmails?.length || 0
      console.log(`✅ Reset: ${link.name}`)
    }
  })
}

fs.writeFileSync('.sessions.json', JSON.stringify(data, null, 2))
console.log('✅ All captured emails reset to pending!')
```

---

## 📋 QUICK REFERENCE

| What to Clear | Command | Impact |
|---------------|---------|--------|
| **Everything** | `rm .sessions.json` | Nuclear reset |
| **Browser only** | `sessionStorage.clear()` | Client-side only |
| **Links only** | Edit `.sessions.json` | Keep settings |
| **Fingerprints** | Use script above | Keep links |
| **Build cache** | `rm -rf .next` | Fresh compile |

---

## ⚠️ IMPORTANT NOTES

### **Development vs Production:**

**Development (localhost):**
- Database: `.sessions.json` (file-based)
- Safe to delete anytime
- Automatically recreated on restart

**Production:**
- Should use proper database (PostgreSQL, MongoDB, etc.)
- Need migration scripts for clearing
- Backup before clearing!

---

### **Testing Workflow:**

**Recommended testing flow:**
```bash
# 1. Test Type A
npm run dev
# ... test ...

# 2. Clear for Type B test
rm .sessions.json
# Clear browser: sessionStorage.clear()

# 3. Test Type B
# ... test ...

# 4. Clear for production deploy
rm .sessions.json
rm -rf .next
npm run build
```

---

## 🎯 WHAT TO CLEAR FOR YOUR USE CASES

### **Scenario 1: Testing Same Email Again**
```javascript
// Browser console
sessionStorage.clear()
```

### **Scenario 2: Testing New Type B Email List**
```bash
# Just delete and regenerate the Type B link
# Or edit .sessions.json to remove old link
```

### **Scenario 3: Fresh Start for Production**
```bash
rm .sessions.json
rm -rf .next
npm run build
```

### **Scenario 4: Keep Settings, Clear Data**
```javascript
// Edit .sessions.json manually:
{
  "settings": { ... }, // Keep this
  "links": {},         // Clear this
  "fingerprints": {},  // Clear this
  "visitors": [],      // Clear this
  "emailIdMappings": {}  // Clear this
}
```

---

## 🔐 SECURITY CONSIDERATIONS

**Before Clearing:**
- 📸 Take backup: `cp .sessions.json .sessions.backup.json`
- 📊 Export visitor logs (if needed for analytics)
- 💾 Download CSV data (if you want to keep it)

**After Clearing:**
- 🔄 Restart dev server
- 🧹 Clear browser cache
- ✅ Verify links are regenerated correctly

---

## 🚀 AUTOMATED CLEARING SCRIPT

Create `clear-all-data.sh`:

```bash
#!/bin/bash

echo "🗑️  Clearing all data..."

# Backup first
if [ -f .sessions.json ]; then
  cp .sessions.json .sessions.backup.$(date +%Y%m%d_%H%M%S).json
  echo "✅ Backup created"
fi

# Clear database
rm -f .sessions.json
echo "✅ Database cleared"

# Clear build cache
rm -rf .next
echo "✅ Build cache cleared"

# Clear logs (if any)
rm -f *.log
echo "✅ Logs cleared"

echo ""
echo "🎉 All data cleared!"
echo "📝 Run: npm run dev"
echo "🌐 Browser: sessionStorage.clear()"
```

Make executable:
```bash
chmod +x clear-all-data.sh
```

Run:
```bash
./clear-all-data.sh
```

---

## 📞 SUPPORT COMMANDS

### **Check Database Size:**
```bash
ls -lh .sessions.json
```

### **View Database Structure:**
```bash
cat .sessions.json | jq 'keys'
```

### **Count Links:**
```bash
cat .sessions.json | jq '.links | length'
```

### **Count Type B Emails:**
```bash
cat .sessions.json | jq '.links[] | select(.type == "generic") | .allowedEmails | length'
```

**You now have complete control over your data!** 🎯

