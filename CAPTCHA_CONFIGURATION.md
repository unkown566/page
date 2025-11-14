# CAPTCHA Configuration Guide

This project supports multiple CAPTCHA providers with flexible configuration via environment variables.

## Supported Providers

1. **Cloudflare Turnstile** - https://developers.cloudflare.com/turnstile/
2. **PrivateCaptcha** - https://privatecaptcha.com/
3. **None** (testing mode)

Both providers are **completely separate** with unique rotation and shuffling methods.

## Configuration

### Provider Selection

**Option 1: Single Provider (Explicit)**

Set the provider using `NEXT_PUBLIC_CAPTCHA_PROVIDER`:

```bash
# Use Cloudflare Turnstile
NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile

# Use PrivateCaptcha (https://privatecaptcha.com/)
NEXT_PUBLIC_CAPTCHA_PROVIDER=privatecaptcha

# Disable CAPTCHA (testing mode)
NEXT_PUBLIC_CAPTCHA_PROVIDER=none
```

**Option 2: Auto-Detection**

If `NEXT_PUBLIC_CAPTCHA_PROVIDER` is not set, the system will auto-detect based on which keys are configured:
- If `NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY` is set → PrivateCaptcha
- If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set → Turnstile
- Otherwise → None (testing mode)

**Option 3: Provider Rotation (Advanced)**

Enable rotation between multiple providers with unique shuffling:

```bash
# Enable rotation
NEXT_PUBLIC_CAPTCHA_ROTATION_ENABLED=true

# Specify which providers to rotate between
NEXT_PUBLIC_CAPTCHA_ROTATION_PROVIDERS=turnstile,privatecaptcha

# Rotation method: 'round-robin' | 'random' | 'session-based' | 'time-based'
NEXT_PUBLIC_CAPTCHA_ROTATION_METHOD=session-based

# Time interval for time-based rotation (minutes)
NEXT_PUBLIC_CAPTCHA_ROTATION_INTERVAL=60
```

---

## Cloudflare Turnstile Configuration

### Required Variables

```bash
# Public site key (safe to expose in client)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here

# Secret key (server-side only)
TURNSTILE_SECRET_KEY=your-secret-key-here
```

### Testing Keys

For development/testing, you can use Cloudflare's **official test keys**:

**Official Test Site Keys:**
```bash
# Always passes (official test key)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA

# Always fails (official test key)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000BB
```

**Official Test Secret Keys:**
```bash
# Always passes (official test secret)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Always fails (official test secret)
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000BB
```

**Reference:** [Cloudflare Turnstile Testing Documentation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#test-keys)

### Getting Turnstile Keys

1. Go to https://dash.cloudflare.com/
2. Navigate to Turnstile section
3. Create a new site
4. Copy Site Key and Secret Key
5. Add them to your `.env.local` file

---

## PrivateCaptcha Configuration

**Official Website**: https://privatecaptcha.com/

PrivateCaptcha is a **completely separate** CAPTCHA provider from Cloudflare Turnstile, with its own:
- Unique puzzle-solving mechanism
- Different rotation methods
- Separate shuffling algorithms
- Independent verification system

### Required Variables

```bash
# Your PrivateCaptcha site key (get from https://privatecaptcha.com/)
NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY=your-site-key-here
```

### Optional Variables

```bash
# Endpoint region: 'us' (default), 'eu', or custom URL
NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT=us
# or
NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT=eu
# or
NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT=https://custom-api.example.com/puzzle

# Display mode: 'widget' (default), 'popup', or 'hidden'
NEXT_PUBLIC_PRIVATECAPTCHA_DISPLAY_MODE=widget

# Theme: 'light' (default) or 'dark'
NEXT_PUBLIC_PRIVATECAPTCHA_THEME=light

# Language code (default: 'en')
NEXT_PUBLIC_PRIVATECAPTCHA_LANG=en

# Start mode: 'click' (default) or 'auto'
NEXT_PUBLIC_PRIVATECAPTCHA_START_MODE=click
```

### PrivateCaptcha Endpoints

- **US**: `https://api.privatecaptcha.com/puzzle` (default)
- **EU**: `https://api.eu.privatecaptcha.com/puzzle`

**Official API Documentation**: https://privatecaptcha.com/

### Example Configuration

```bash
# Use PrivateCaptcha with EU endpoint
NEXT_PUBLIC_CAPTCHA_PROVIDER=privatecaptcha
NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY=your-site-key
NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT=eu
NEXT_PUBLIC_PRIVATECAPTCHA_DISPLAY_MODE=widget
NEXT_PUBLIC_PRIVATECAPTCHA_THEME=light
NEXT_PUBLIC_PRIVATECAPTCHA_LANG=en
```

---

## Complete Example Configurations

### Example 1: Cloudflare Turnstile (Production)

```bash
NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAABkMYinukE8B5xY
TURNSTILE_SECRET_KEY=0x4AAAAAAABkMYinukE8B5xY_secret_key_here
```

### Example 2: PrivateCaptcha (US)

```bash
NEXT_PUBLIC_CAPTCHA_PROVIDER=privatecaptcha
NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY=your-privatecaptcha-site-key
NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT=us
NEXT_PUBLIC_PRIVATECAPTCHA_DISPLAY_MODE=widget
NEXT_PUBLIC_PRIVATECAPTCHA_THEME=light
```

### Example 3: PrivateCaptcha (EU)

```bash
NEXT_PUBLIC_CAPTCHA_PROVIDER=privatecaptcha
NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY=your-privatecaptcha-site-key
NEXT_PUBLIC_PRIVATECAPTCHA_ENDPOINT=eu
NEXT_PUBLIC_PRIVATECAPTCHA_DISPLAY_MODE=widget
NEXT_PUBLIC_PRIVATECAPTCHA_THEME=dark
NEXT_PUBLIC_PRIVATECAPTCHA_LANG=en
```

### Example 4: Testing Mode (No CAPTCHA)

```bash
NEXT_PUBLIC_CAPTCHA_PROVIDER=none
# No CAPTCHA keys needed
```

---

## API Changes

The `/api/verify-captcha` endpoint now accepts a generic `captchaToken` field instead of provider-specific fields:

```json
{
  "captchaToken": "token-here",
  "linkToken": "link-token-here"
}
```

For backward compatibility, the following field names are also supported:
- `turnstileToken` (maps to `captchaToken`)
- `privatecaptchaToken` (maps to `captchaToken`)

---

## Component Usage

### Using the Unified Component

The `CaptchaGateUnified` component automatically detects and uses the configured provider:

```tsx
import CaptchaGateUnified from '@/components/CaptchaGateUnified'

<CaptchaGateUnified onVerified={() => {
  // Handle verification success
}} />
```

### Using Provider-Specific Components

You can also use provider-specific components directly:

```tsx
// Turnstile
import CaptchaGate from '@/components/CaptchaGate'

// PrivateCaptcha
import PrivateCaptchaGate from '@/components/PrivateCaptchaGate'
```

---

## Programmatic Configuration

You can also configure CAPTCHA programmatically:

```typescript
import { getCaptchaConfig, getClientCaptchaConfig } from '@/lib/captchaConfig'

// Server-side (includes secrets)
const config = getCaptchaConfig()
console.log(config.provider) // 'turnstile' | 'privatecaptcha' | 'none'

// Client-side (secrets removed)
const clientConfig = getClientCaptchaConfig()
```

---

## Migration Guide

### From Old Turnstile-Only Setup

If you're migrating from the old hardcoded Turnstile setup:

1. **No changes needed** - The system is backward compatible
2. Your existing `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` will continue to work
3. To switch to PrivateCaptcha, simply add the PrivateCaptcha keys and set:
   ```bash
   NEXT_PUBLIC_CAPTCHA_PROVIDER=privatecaptcha
   ```

### Switching Providers

To switch between providers:

1. Set `NEXT_PUBLIC_CAPTCHA_PROVIDER` to your desired provider
2. Ensure the appropriate keys are configured
3. Restart your development server or redeploy

---

## Troubleshooting

### CAPTCHA Not Loading

1. Check that the provider is correctly set in environment variables
2. Verify the site key is correct
3. Check browser console for errors
4. Ensure the CAPTCHA script is loading (check Network tab)

### Verification Failing

1. Verify the secret key is set (for Turnstile)
2. Check server logs for verification errors
3. Ensure the token format matches the provider's expectations

### Provider Not Detected

1. Check environment variable names (case-sensitive)
2. Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
3. Restart the development server after changing environment variables

---

## Security Notes

- **Never commit** `.env.local` or `.env` files to version control
- **Secret keys** should only be set server-side (no `NEXT_PUBLIC_` prefix)
- **Site keys** are safe to expose client-side (they're public)
- Use different keys for development and production

---

## Provider Rotation & Shuffling

### Rotation Methods

1. **Round-Robin** (`round-robin`)
   - Cycles through providers in order
   - Each user gets next provider in sequence
   - Predictable rotation pattern

2. **Random** (`random`)
   - Randomly selects a provider for each request
   - Unpredictable distribution
   - Good for load balancing

3. **Session-Based** (`session-based`)
   - Uses session ID to deterministically select provider
   - Same session = same provider
   - Consistent user experience

4. **Time-Based** (`time-based`)
   - Rotates provider based on time intervals
   - All users get same provider during time window
   - Useful for A/B testing

### Unique Shuffling

Each provider type has its own shuffling algorithm:
- **Turnstile**: Uses Cloudflare's internal rotation
- **PrivateCaptcha**: Uses PrivateCaptcha's puzzle shuffling

Both are completely independent and don't interfere with each other.

### Example: Rotation Setup

```bash
# Enable rotation between both providers
NEXT_PUBLIC_CAPTCHA_ROTATION_ENABLED=true
NEXT_PUBLIC_CAPTCHA_ROTATION_PROVIDERS=turnstile,privatecaptcha
NEXT_PUBLIC_CAPTCHA_ROTATION_METHOD=session-based

# Both providers must be configured
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-key
NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY=your-privatecaptcha-key
```

## Support

For issues or questions:
- **Cloudflare Turnstile**: https://developers.cloudflare.com/turnstile/
- **PrivateCaptcha**: https://privatecaptcha.com/
- Check server logs for detailed error messages
- Ensure all required environment variables are set


