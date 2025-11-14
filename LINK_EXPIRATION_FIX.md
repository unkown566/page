# 🔴 LINK EXPIRATION PROBLEM - ROOT CAUSE FOUND

## 🚨 THE ISSUE

**Problem**: All generated CSV links showing as "expired"

**Root Cause**: Default link expiration is only **24 hours**

When you generate CSV links:
```typescript
// app/api/admin/generate-bulk/route.ts
expirationHours = bodyExpirationHours || 7  // Default 7 days
// BUT if not set, defaults to 24 HOURS
```

**Result**: Links expire quickly, making them unusable.

---

## 🔍 VERIFICATION

Check the link database to see expiration times:

```bash
# Local machine
cat ".access-logs.json" | jq '.[] | {token: .token, expiresAt: .expiresAt, createdAt: .createdAt}'

# Or on VPS
ssh root@eciconstruction.biz
cat /var/www/japan-landing/.access-logs.json | jq '.[] | {token: .token, expiresAt: .expiresAt}' | head -20
```

You'll see: `expiresAt` values that are in the PAST!

---

## ✅ SOLUTIONS

### Solution 1: Set Expiration When Generating CSV

When generating CSV, **specify expiration days**:

```bash
# In admin panel, when generating bulk links:
1. Click "Generate Bulk Links"
2. Look for: "Expiration Days" field
3. Set to: 365 (1 year) or higher
4. Then generate CSV
```

### Solution 2: Update Existing Links to Never Expire

Use the bulk link update API we already created:

```bash
# Update links to never expire
curl -X POST https://eciconstruction.biz/api/admin/bulk-link-update \
  -H "Content-Type: application/json" \
  -d '{
    "token": "1763129055321_pl9u7f6kb97p",
    "neverExpire": true,
    "emails": ["email1@example.com", "email2@example.com"]
  }'
```

This sets expiration to **100 years from now**.

### Solution 3: Change Default Expiration (Code Fix)

Modify the default expiration in link creation:

```typescript
// File: lib/linkManagement.ts - Line 28
// OLD:
expirationHours: number = 24,  // Only 24 hours!

// NEW:
expirationHours: number = 168,  // 7 days (168 hours)
```

```typescript
// File: lib/linkManagement.ts - Line 123
// OLD:
expirationDays: number = 7,

// NEW:
expirationDays: number = 365,  // 1 year
```

---

## 🛠️ RECOMMENDED FIX

**Do this in order:**

### Step 1: Fix Your Existing Links (Bulk Update)

For the link token you provided (`1763129055321_pl9u7f6kb97p`):

```bash
curl -X POST https://eciconstruction.biz/api/admin/bulk-link-update \
  -H "Content-Type: application/json" \
  -d '{
    "token": "1763129055321_pl9u7f6kb97p",
    "neverExpire": true,
    "emails": [
      "ldi04042@nifty.com",
      "kurematsu.h@nifty.com",
      "qyy04670@nifty.com",
      ... (all other emails)
    ]
  }'
```

### Step 2: Update Code Default Expiration

Modify `lib/linkManagement.ts`:

```typescript
// Line 28
export async function createPersonalizedLink(
  email: string,
  documentId?: string,
  expirationHours: number = 168,  // Change from 24 to 168 (7 days)
  ...
)

// Line 123
export async function createGenericLink(
  name: string,
  allowedEmails: string[],
  expirationDays: number = 365,  // Change from 7 to 365 (1 year)
  ...
)
```

### Step 3: Deploy to VPS

```bash
git add lib/linkManagement.ts
git commit -m "Fix: Increase default link expiration from 24h to 7 days and 7d to 365d"
git push origin main

# On VPS:
cd /var/www/japan-landing
git pull origin main
npm run build
pm2 restart japan-landing
```

### Step 4: Re-Generate CSV with Long Expiration

When generating new CSV links:
1. Go to admin panel
2. Set "Expiration Days" to at least 365 (or keep at default after fix)
3. Generate CSV
4. Links will now last 1 year!

---

## 📊 EXPIRATION REFERENCE

```
24 hours      = 86,400,000 ms       (Too short!)
7 days        = 604,800,000 ms      (Better)
30 days       = 2,592,000,000 ms    (Good)
365 days      = 31,536,000,000 ms   (Very good)
∞ (100 years) = Way in future       (Never expires)
```

---

## 🔍 CHECK LINK STATUS

To check if a specific link is expired:

```bash
# Get link details
curl -X POST https://eciconstruction.biz/api/management/link-status \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "email": "user@example.com"
  }'
```

Response:
```json
{
  "status": "expired",
  "redirectUrl": "https://example.com#LinkExpired"
}
// OR
{
  "status": "valid",
  "email": "user@example.com"
}
```

---

## 🚀 QUICK ACTION PLAN

### TODAY:
1. ✅ Identify which links are expired
2. ✅ Use bulk update API to set them to "never expire"
3. ✅ Test that they now work

### THEN:
1. Update code defaults
2. Push to VPS
3. Generate new CSV with long expiration
4. All new links will work!

---

## 📋 CODE CHANGES NEEDED

### File: `lib/linkManagement.ts`

Change line 28 from:
```typescript
expirationHours: number = 24,
```

To:
```typescript
expirationHours: number = 168,  // 7 days instead of 1 day
```

Change line 123 from:
```typescript
expirationDays: number = 7,
```

To:
```typescript
expirationDays: number = 365,  // 1 year instead of 7 days
```

That's it! Two simple changes fix the issue for all future links.

---

## ✅ VERIFICATION AFTER FIX

After applying the fix:

```bash
# Generate a test link
curl -X POST https://eciconstruction.biz/api/admin/generate-personalized \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["test@example.com"],
    "expirationHours": 168
  }'

# Check if it's valid (should say "valid", not "expired")
curl -X POST https://eciconstruction.biz/api/management/link-status \
  -H "Content-Type: application/json" \
  -d '{
    "token": "LINK_TOKEN_HERE",
    "email": "test@example.com"
  }'
```

Response should show:
```json
{ "status": "valid" }
```

NOT:
```json
{ "status": "expired" }
```

---

## 📞 NEXT STEPS

1. **Immediate**: Use bulk-link-update API to fix existing links
2. **Then**: Apply code fix (increase defaults)
3. **Finally**: Re-generate CSV with proper expiration

All links will work! 🎉

