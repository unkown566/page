# 🔧 Quick Fix: Admin Settings Loading Issue

## Problem
Settings page shows loading spinner indefinitely because API returns 401 (Unauthorized).

## ✅ Solution - 3 Simple Steps:

### Step 1: Clear Browser Data
**In Safari:**
- Safari menu → Clear History → All History
- OR just clear cookies for localhost

**In Chrome:**
- DevTools (if you can open it) → Application → Cookies → Delete all localhost cookies
- OR just use Incognito mode

### Step 2: Go to Login Page
**URL:** http://localhost:3000/admin/login

### Step 3: Enter Password
**Password:** `admin123`

---

## 🎯 Alternative: Use This Direct Link

**Try this URL directly after clearing cookies:**
http://localhost:3000/admin/login?redirect=/admin/settings

---

## 🔍 Why This Happens

The admin panel requires a valid session cookie (`admin-session`).

Your current state:
- ✅ You're on the admin dashboard
- ❌ But your session cookie is invalid/expired
- ❌ API calls return 401 Unauthorized
- ❌ Settings page can't load data

---

## 💡 Quick Test

**Open a new Incognito/Private window:**
1. Go to: http://localhost:3000/admin/login
2. Enter password: `admin123`
3. Click Login
4. Go to Settings

This will work with a fresh session!

---

## 🔒 Session Details

**Cookie name:** `admin-session`
**Password:** `admin123` (from `ADMIN_PASSWORD` in .env)
**Validity:** 24 hours
**Storage:** HttpOnly cookie (can't see in JavaScript)

---

## ⚠️ If Still Not Working

1. **Restart the dev server** (Ctrl+C then `npm run dev`)
2. **Wait for** "✓ Ready on http://localhost:3000"
3. **Clear all browser cookies**
4. **Try login in Incognito mode**

---

**The password IS in your .env file. Your IDE just can't show it because .env is in .gitignore for security!**

The server CAN read it and it's set to: `admin123`

