# 🔐 Environment Variables Configuration Guide

## Current Configuration Review

Your `.env` file contains **9 environment variables**. Here's the security assessment:

---

## ✅ CORRECTLY CONFIGURED

### 1. **TOKEN_SECRET** ✅
- **Purpose:** Encrypts tokens and sensitive data
- **Status:** Configured
- **Action:** Verify it's strong (32+ characters, random)

### 2. **TELEGRAM_BOT_TOKEN** ✅
- **Purpose:** Bot notifications for captures
- **Status:** Configured
- **Action:** Verify token is valid and active

### 3. **TELEGRAM_CHAT_ID** ✅
- **Purpose:** Where to send notifications
- **Status:** Configured
- **Action:** Verify correct chat ID

### 4. **NEXT_PUBLIC_TURNSTILE_SITE_KEY** ✅
- **Purpose:** Cloudflare Turnstile (public key)
- **Status:** Configured
- **Note:** Safe to expose (starts with NEXT_PUBLIC_)

### 5. **TURNSTILE_SECRET_KEY** ✅
- **Purpose:** Cloudflare Turnstile verification (private)
- **Status:** Configured
- **Action:** Keep this secret!

### 6-8. **Network Restrictions** ✅
- ALLOW_VPN
- ALLOW_PROXY
- ALLOW_DATACENTER
- **Status:** Configured
- **Recommendation:** Set to `false` for production (stricter security)

---

## 🔴 CRITICAL SECURITY ISSUE

### 9. **DISABLE_ADMIN_AUTH** ⚠️ DANGER!

**Current Status:** Configured (value unknown)

**⚠️ MUST BE SET TO `false` IN PRODUCTION!**

If this is set to `true`, anyone can access your admin panel without authentication!

**Action Required:**
```bash
DISABLE_ADMIN_AUTH=false
```

---

## 📋 RECOMMENDED PRODUCTION SETTINGS

Create a `.env.production` file with these values:

```env
# ============================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================================

# CRITICAL SECURITY
TOKEN_SECRET=<generate-strong-32-char-secret>
DISABLE_ADMIN_AUTH=false

# TELEGRAM NOTIFICATIONS
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>

# CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-public-key>
TURNSTILE_SECRET_KEY=<your-secret-key>

# NETWORK RESTRICTIONS (recommended for production)
ALLOW_VPN=false
ALLOW_PROXY=false
ALLOW_DATACENTER=false
```

---

## 🔧 How to Generate Strong Secrets

### TOKEN_SECRET (32+ characters)
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online (use with caution)
# https://randomkeygen.com/
```

---

## 🚀 DEPLOYMENT PLATFORM SETUP

### Vercel
```bash
# Set environment variables in Vercel dashboard
vercel env add TOKEN_SECRET
vercel env add TELEGRAM_BOT_TOKEN
# ... etc
```

### Netlify
```bash
# Set in Netlify UI: Site settings → Environment variables
```

### Heroku
```bash
heroku config:set TOKEN_SECRET=your_secret
heroku config:set DISABLE_ADMIN_AUTH=false
```

### Docker / VPS
```bash
# Create .env.production file on server
# Or pass via docker-compose:
docker-compose up -d --env-file .env.production
```

---

## 🔍 ENVIRONMENT VARIABLES CHECKLIST

### Pre-Deployment
- [ ] `TOKEN_SECRET` is strong and random (32+ chars)
- [ ] `DISABLE_ADMIN_AUTH=false` (CRITICAL!)
- [ ] Telegram bot token is valid and active
- [ ] Telegram chat ID is correct
- [ ] Turnstile keys are valid
- [ ] Network restrictions set appropriately
- [ ] No test/development values remain
- [ ] `.env` file is in `.gitignore` ✅ (Already done)

### Production Testing
- [ ] Admin panel requires authentication
- [ ] Telegram notifications working
- [ ] Captcha verification working
- [ ] Network restrictions enforcing correctly
- [ ] Token generation/validation working
- [ ] No sensitive data in logs

---

## 🆘 MISSING OPTIONAL VARIABLES

These are not required but recommended for production:

### **Email Notifications** (if implemented)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

### **Database** (instead of JSON files)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
```

### **License API** (if using Fox Auth)
```env
LICENSE_API_URL=https://your-license-api.com
LICENSE_API_KEY=your_api_key
```

### **Custom Domain**
```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## 🔒 SECURITY BEST PRACTICES

### DO ✅
- Use strong, random secrets (32+ characters)
- Rotate secrets periodically
- Keep `.env` in `.gitignore`
- Use different values for dev/staging/production
- Use environment variable management tools
- Enable admin authentication in production
- Monitor for unauthorized access

### DON'T ❌
- Commit `.env` files to git
- Share secrets in plain text
- Use weak or predictable secrets
- Disable admin authentication in production
- Use same secrets across environments
- Store secrets in code comments
- Log environment variables

---

## 🧪 TESTING YOUR CONFIGURATION

### Test Locally (Development)
```bash
npm run dev
# Visit http://localhost:3000
# Test admin login
# Test link generation
# Verify Telegram notifications
```

### Test Production Build
```bash
npm run build
npm start
# Same tests as development
```

### Test Environment Variables
```bash
# Create a test script
cat > test-env.js << 'EOF'
console.log('Environment Check:')
console.log('TOKEN_SECRET:', process.env.TOKEN_SECRET ? '✅ Set' : '❌ Missing')
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing')
console.log('DISABLE_ADMIN_AUTH:', process.env.DISABLE_ADMIN_AUTH)
EOF

node test-env.js
rm test-env.js
```

---

## 🚨 CRITICAL WARNING

### BEFORE DEPLOYMENT:

**1. Check DISABLE_ADMIN_AUTH**
```bash
grep DISABLE_ADMIN_AUTH .env
# Should show: DISABLE_ADMIN_AUTH=false
```

**2. Verify TOKEN_SECRET is strong**
```bash
# Check length (should be 32+ characters)
grep TOKEN_SECRET .env | cut -d= -f2 | wc -c
```

**3. Test admin authentication**
- Visit `/admin`
- Should require password
- Should NOT allow access without auth

---

## 📊 CURRENT STATUS

| Variable | Status | Security Level | Action Required |
|----------|--------|----------------|-----------------|
| TOKEN_SECRET | ✅ Set | 🟡 Unknown | Verify strength |
| DISABLE_ADMIN_AUTH | ⚠️ Set | 🔴 CRITICAL | **Verify = false** |
| TELEGRAM_BOT_TOKEN | ✅ Set | 🟢 Good | Verify valid |
| TELEGRAM_CHAT_ID | ✅ Set | 🟢 Good | Verify correct |
| TURNSTILE_SITE_KEY | ✅ Set | 🟢 Good | None |
| TURNSTILE_SECRET_KEY | ✅ Set | 🟢 Good | Keep secure |
| ALLOW_VPN | ✅ Set | 🟡 Review | Consider false |
| ALLOW_PROXY | ✅ Set | 🟡 Review | Consider false |
| ALLOW_DATACENTER | ✅ Set | 🟡 Review | Consider false |

---

## 🎯 NEXT STEPS

1. **IMMEDIATE:** Verify `DISABLE_ADMIN_AUTH=false`
2. **IMPORTANT:** Check TOKEN_SECRET strength
3. **RECOMMENDED:** Set network restrictions to `false`
4. **OPTIONAL:** Add email/database configuration
5. **TESTING:** Test all features in staging
6. **DEPLOYMENT:** Set variables on your platform
7. **MONITORING:** Watch for unauthorized access

---

## 💡 QUICK FIXES

### Fix Weak TOKEN_SECRET
```bash
# Generate new strong secret
NEW_SECRET=$(openssl rand -base64 32)

# Backup current .env
cp .env .env.backup

# Update TOKEN_SECRET
sed -i.bak "s/^TOKEN_SECRET=.*/TOKEN_SECRET=$NEW_SECRET/" .env
```

### Ensure Admin Auth is Enabled
```bash
# Check current value
grep DISABLE_ADMIN_AUTH .env

# If true or not set, fix it:
sed -i.bak 's/^DISABLE_ADMIN_AUTH=.*/DISABLE_ADMIN_AUTH=false/' .env

# Or add if missing:
echo "DISABLE_ADMIN_AUTH=false" >> .env
```

### Tighten Network Restrictions
```bash
cat >> .env << EOF
ALLOW_VPN=false
ALLOW_PROXY=false
ALLOW_DATACENTER=false
EOF
```

---

**Last Updated:** 2025-11-14  
**Status:** Ready for production configuration ✅

---

## 📞 HELP

If you're unsure about any setting:
1. Keep it secure (default to `false` for ALLOW_* settings)
2. Use strong, random secrets
3. Test in staging first
4. Monitor logs after deployment

**Remember:** It's better to be too restrictive than too permissive. You can always loosen restrictions later if needed.

