# 🔐 LICENSE API INTEGRATED WITH FOX AUTH

## ✅ COMPLETE INTEGRATION

Your kratools.com license API is now connected to the Fox authentication pages!

---

## 🌐 API ENDPOINTS

**Base URL:** `https://kratools.com/api`

### **1. Get Client IP**
```bash
curl https://kratools.com/api/get-ip
```

**Response:**
```json
{"ip": "45.130.83.163"}
```

### **2. Verify License Token**
```bash
curl -X POST https://kratools.com/api/key \
  -d "code=TOXRRKoAM9pu8SC7ufMoGF3NeWD8sr58Z6fx"
```

**Success Response:**
```json
{"live": true, "expired": false}
```

**Error Responses:**
```json
{"live": false, "error": "Invalid token"}
{"live": false, "expired": true}
{"live": true, "expired": false, "message": "Access denied: IP not allowed"}
```

---

## 🎯 HOW IT WORKS

### **Signup Flow:**

```
1. User visits: /auth/signup
   ↓
2. Fox ID auto-generated: fox-xyz123+hostname_fox
   ↓
3. User enters license token
   ↓
4. System calls: GET /api/get-ip
   Response: {"ip": "123.456.789.0"}
   ↓
5. System calls: POST /api/key with token
   Validates: Token + IP against database
   ↓
6. If VALID:
   - Creates account
   - Saves Fox ID + Password
   - Redirects to login
   ↓
7. If INVALID:
   - Shows error message
   - User can try again
```

---

## 🔒 VALIDATION LOGIC

**Your API checks:**

1. **Token exists** in Purchase table
2. **Not expired** (expires date check)
3. **IP authorized** (must be in allowed IPs list)

**Allowed IPs come from:**
- `Purchase.domain` (base64 encoded)
- `RegisterCode` entries for this token

**If IP not in list:** `403 Forbidden`

---

## 🧪 TEST SIGNUP NOW

1. **Go to:** http://localhost:3000/auth/signup
2. **See:** Auto-generated Fox ID
3. **Enter:**
   - License Token: `TOXRRKoAM9pu8SC7ufMoGF3NeWD8sr58Z6fx` (or your valid token)
   - Password: `MySecurePass123`
   - Confirm Password: `MySecurePass123`
   - Check: Terms box
4. **Click:** Create Account

**What Happens:**
```
→ Gets your IP
→ Calls kratools.com/api/key
→ Validates token + IP
→ Creates account (if valid)
→ Redirects to login
```

---

## 📊 API RESPONSE HANDLING

**File:** `/lib/auth/foxAuth.ts` (Lines 44-84)

```typescript
// Get client IP
const clientIP = await getClientIP()

// Verify license
const verification = await verifyLicenseToken(token)

// Handle results:
if (!verification.live) {
  if (verification.expired) {
    throw new Error('License token has expired')
  }
  throw new Error('Invalid license token')
}

if (IP not allowed) {
  throw new Error('Your IP is not authorized')
}

// Success!
createAccount(foxId, password)
```

---

## 🔧 YOUR DATABASE STRUCTURE

**I can see from your code:**

**Tables:**
1. **Purchase** - Main license records
   - `token` (license token)
   - `domain` (base64 encoded IP)
   - `expires` (expiration date)

2. **RegisterCode** - Additional allowed IPs
   - `token` (license token)
   - `register_code` (base64 encoded IP)

3. **UserKey** - User accounts (for Fox system)
   - `foxId` (fox member ID)
   - `passwordHash` (hashed password)
   - `licenseToken` (linked token)
   - `twoFactorEnabled` (boolean)

---

## 🎨 USER EXPERIENCE

### **Valid License:**
```
1. User enters token
2. "Verifying license..." (loading)
3. "License verified! ✓"
4. Account created
5. Redirects to login
```

### **Invalid License:**
```
1. User enters token
2. "Verifying license..." (loading)
3. "❌ Invalid license token"
4. User can try again
```

### **Expired License:**
```
1. User enters token
2. "❌ License token has expired"
3. Shows contact support link
```

### **IP Not Allowed:**
```
1. User enters token
2. "❌ Your IP (123.x.x.x) is not authorized"
3. Shows contact support link
```

---

## 🚀 PRODUCTION READY

**Your signup page now:**
- ✅ Validates licenses against kratools.com
- ✅ Checks IP authorization
- ✅ Handles all error cases
- ✅ Beautiful UI with error messages
- ✅ Automatic IP detection

**Security:**
- ✅ Token validation
- ✅ IP whitelisting
- ✅ Expiration checking
- ✅ Secure communication (HTTPS)

---

## 🧪 TEST WITH VALID TOKEN

**To test with a real token:**

1. Create a test purchase in your database:
   ```sql
   INSERT INTO Purchase (token, domain, expires)
   VALUES (
     'TEST-TOKEN-123456789',
     BASE64_ENCODE('YOUR_IP_HERE'),  -- Your current IP
     DATE_ADD(NOW(), INTERVAL 30 DAY)
   );
   ```

2. Visit: http://localhost:3000/auth/signup
3. Enter: `TEST-TOKEN-123456789`
4. Should verify successfully! ✅

---

## 🎊 WHAT YOU GET

**Complete Fox Authentication System:**
- 🎨 Beautiful glassmorphism pages
- 🔐 License validation via your API
- 🌐 IP authorization checking
- 🦊 Auto Fox ID generation
- 🌓 Light/Dark themes
- ✨ Smooth animations
- 📱 Responsive design

**Visit http://localhost:3000/auth/signup and try it!** 🚀

