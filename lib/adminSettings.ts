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
const CACHE_DURATION = 5 * 1000 // 5 seconds (reduced for faster updates)

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
    // PRIORITY: Try database first, then fall back to file
    let rawSettings: any = null
    
    // Try to load from database first
    try {
      const dbSettings = await getAdminSettingsSql()
      if (dbSettings && Object.keys(dbSettings).length > 0) {
        rawSettings = dbSettings
        console.log('[ADMIN SETTINGS] ✅ Loaded from database')
      }
    } catch (dbError: any) {
      // Database read failed - fall through to file read
      console.log('[ADMIN SETTINGS] ⚠️  Database read failed, trying file:', dbError.message)
    }
    
    // If database didn't have settings, try file
    if (!rawSettings) {
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
      rawSettings = await (readJSON as typeof import('./secureFileSystem').secureReadJSON)<any>(
        settingsFile,
        DEFAULT_SETTINGS
      )
      console.log('[ADMIN SETTINGS] ✅ Loaded from file')
    }
    
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
          // CRITICAL: Explicitly preserve false values (spread operator doesn't override false with undefined)
          enabled: rawSettings.security?.captcha?.enabled !== undefined ? rawSettings.security.captcha.enabled : DEFAULT_SETTINGS.security.captcha.enabled,
          provider: rawSettings.security?.captcha?.provider !== undefined ? rawSettings.security.captcha.provider : DEFAULT_SETTINGS.security.captcha.provider,
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
          // CRITICAL: Explicitly preserve false values for all gate toggles
          layer1BotFilter: rawSettings.security?.gates?.layer1BotFilter !== undefined ? rawSettings.security.gates.layer1BotFilter : DEFAULT_SETTINGS.security.gates.layer1BotFilter,
          layer1IpBlocklist: rawSettings.security?.gates?.layer1IpBlocklist !== undefined ? rawSettings.security.gates.layer1IpBlocklist : DEFAULT_SETTINGS.security.gates.layer1IpBlocklist,
          layer1CloudflareBotManagement: rawSettings.security?.gates?.layer1CloudflareBotManagement !== undefined ? rawSettings.security.gates.layer1CloudflareBotManagement : DEFAULT_SETTINGS.security.gates.layer1CloudflareBotManagement,
          layer1ScannerDetection: rawSettings.security?.gates?.layer1ScannerDetection !== undefined ? rawSettings.security.gates.layer1ScannerDetection : DEFAULT_SETTINGS.security.gates.layer1ScannerDetection,
          layer2Captcha: rawSettings.security?.gates?.layer2Captcha !== undefined ? rawSettings.security.gates.layer2Captcha : DEFAULT_SETTINGS.security.gates.layer2Captcha,
          layer3BotDelay: rawSettings.security?.gates?.layer3BotDelay !== undefined ? rawSettings.security.gates.layer3BotDelay : DEFAULT_SETTINGS.security.gates.layer3BotDelay,
          layer4StealthVerification: rawSettings.security?.gates?.layer4StealthVerification !== undefined ? rawSettings.security.gates.layer4StealthVerification : DEFAULT_SETTINGS.security.gates.layer4StealthVerification,
        },
        networkRestrictions: {
          // CRITICAL: Admin settings ALWAYS take precedence over .env
          // Priority: Admin saved value > .env > Default
          // If admin has saved ANY value (even false), use it. Only fall back to .env if never saved.
          allowVpn: rawSettings.security?.networkRestrictions?.allowVpn !== undefined && rawSettings.security?.networkRestrictions?.allowVpn !== null
            ? rawSettings.security.networkRestrictions.allowVpn
            : (process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true' ? true : (process.env.ALLOW_VPN === '0' || process.env.ALLOW_VPN === 'false' ? false : DEFAULT_SETTINGS.security.networkRestrictions.allowVpn)),
          allowProxy: rawSettings.security?.networkRestrictions?.allowProxy !== undefined && rawSettings.security?.networkRestrictions?.allowProxy !== null
            ? rawSettings.security.networkRestrictions.allowProxy
            : (process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true' ? true : (process.env.ALLOW_PROXY === '0' || process.env.ALLOW_PROXY === 'false' ? false : DEFAULT_SETTINGS.security.networkRestrictions.allowProxy)),
          allowDatacenter: rawSettings.security?.networkRestrictions?.allowDatacenter !== undefined && rawSettings.security?.networkRestrictions?.allowDatacenter !== null
            ? rawSettings.security.networkRestrictions.allowDatacenter
            : (process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true' ? true : (process.env.ALLOW_DATACENTER === '0' || process.env.ALLOW_DATACENTER === 'false' ? false : DEFAULT_SETTINGS.security.networkRestrictions.allowDatacenter)),
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
  
  // CRITICAL: Explicitly preserve false values for boolean fields that might be lost in merge
  // This ensures that when a checkbox is unchecked (false), it's saved correctly
  if (settings.security?.captcha?.enabled !== undefined) {
    mergedSettings.security.captcha.enabled = settings.security.captcha.enabled
  }
  if (settings.security?.gates?.layer2Captcha !== undefined) {
    mergedSettings.security.gates.layer2Captcha = settings.security.gates.layer2Captcha
  }
  
  // Log what we're saving for debugging
  console.log('[ADMIN SETTINGS] 🔍 Saving CAPTCHA settings:', {
    'captcha.enabled (from input)': settings.security?.captcha?.enabled,
    'gates.layer2Captcha (from input)': settings.security?.gates?.layer2Captcha,
    'captcha.enabled (merged)': mergedSettings.security?.captcha?.enabled,
    'gates.layer2Captcha (merged)': mergedSettings.security?.gates?.layer2Captcha,
  })
  
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
  
  console.log('[ADMIN SETTINGS] ✅ Settings written to file successfully')
  
  // CRITICAL: Also write to database (SQLite)
  try {
    await updateAdminSettingsSql(mergedSettings)
    console.log('[ADMIN SETTINGS] ✅ Settings written to database successfully')
  } catch (dbError: any) {
    // Don't fail if database write fails - file write is primary
    console.warn('[ADMIN SETTINGS] ⚠️  Database write failed (non-critical):', dbError.message)
  }
  
  // CRITICAL: Also write to .env file so admin settings are visible in .env
  await writeSettingsToEnv(mergedSettings)
  
  // Update cache with merged settings (force immediate update)
  // CRITICAL: Clear cache and force fresh read on next loadSettings() call
  settingsCache = mergedSettings
  cacheTimestamp = Date.now()
  
  // Log cache clear for debugging
  console.log('[ADMIN SETTINGS] 🔄 Cache updated with new settings (CAPTCHA enabled:', mergedSettings.security?.captcha?.enabled, ', layer2Captcha:', mergedSettings.security?.gates?.layer2Captcha, ')')
  console.log('[ADMIN SETTINGS] 🧹 Cache updated with new settings')
}

/**
 * Write admin settings to .env file
 * This allows admin panel changes to be visible in .env file
 */
async function writeSettingsToEnv(settings: AdminSettings): Promise<void> {
  const fs = await import('fs/promises')
  const pathModule = await import('path')
  
  // In standalone mode, process.cwd() is .next/standalone, so we need to go up
  let projectRoot = process.cwd()
  if (projectRoot.endsWith('.next/standalone')) {
    projectRoot = pathModule.resolve(projectRoot, '../..')
  }
  
  const envPath = pathModule.join(projectRoot, '.env')
  
  try {
    console.log('[ADMIN SETTINGS] 📝 Writing to .env file at:', envPath)
    console.log('[ADMIN SETTINGS] 📝 Current working directory:', process.cwd())
    console.log('[ADMIN SETTINGS] 📝 Project root:', projectRoot)
    
    // Read existing .env file
    let envContent = ''
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
      console.log('[ADMIN SETTINGS] 📖 Read existing .env file, length:', envContent.length)
    } catch (error: any) {
      // .env doesn't exist, start fresh
      console.log('[ADMIN SETTINGS] 📝 .env file not found, creating new one:', error.message)
      envContent = ''
    }
    
    // Parse existing .env into lines
    const lines = envContent.split('\n')
    const envVars = new Map<string, string>()
    const comments: string[] = []
    
    // Parse existing .env
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        comments.push(line)
        continue
      }
      const match = trimmed.match(/^([A-Z_]+)=(.*)$/)
      if (match) {
        envVars.set(match[1], match[2])
      } else {
        comments.push(line)
      }
    }
    
    // Update env vars from admin settings
    // Network Restrictions
    envVars.set('ALLOW_VPN', settings.security?.networkRestrictions?.allowVpn ? 'true' : 'false')
    envVars.set('ALLOW_PROXY', settings.security?.networkRestrictions?.allowProxy ? 'true' : 'false')
    envVars.set('ALLOW_DATACENTER', settings.security?.networkRestrictions?.allowDatacenter ? 'true' : 'false')
    
    // ============================================
    // SECURITY GATES (All 7 Layers)
    // ============================================
    envVars.set('ENABLE_LAYER1_BOT_FILTER', settings.security?.gates?.layer1BotFilter ? 'true' : 'false')
    envVars.set('ENABLE_LAYER1_IP_BLOCKLIST', settings.security?.gates?.layer1IpBlocklist ? 'true' : 'false')
    envVars.set('ENABLE_LAYER1_CLOUDFLARE_BOT', settings.security?.gates?.layer1CloudflareBotManagement ? 'true' : 'false')
    envVars.set('ENABLE_LAYER1_SCANNER_DETECTION', settings.security?.gates?.layer1ScannerDetection ? 'true' : 'false')
    envVars.set('ENABLE_LAYER2_CAPTCHA', settings.security?.gates?.layer2Captcha ? 'true' : 'false')
    envVars.set('ENABLE_LAYER3_BOT_DELAY', settings.security?.gates?.layer3BotDelay ? 'true' : 'false')
    envVars.set('ENABLE_LAYER4_STEALTH_VERIFICATION', settings.security?.gates?.layer4StealthVerification ? 'true' : 'false')
    
    // ============================================
    // BOT FILTER SETTINGS
    // ============================================
    envVars.set('ENABLE_BOT_FILTER', settings.security?.botFilter?.enabled ? 'true' : 'false')
    envVars.set('BOT_FILTER_CHECK_IP_BLOCKLIST', settings.security?.botFilter?.checkIPBlocklist ? 'true' : 'false')
    envVars.set('BOT_FILTER_CLOUDFLARE_BOT_MANAGEMENT', settings.security?.botFilter?.cloudflareBotManagement ? 'true' : 'false')
    envVars.set('BOT_FILTER_SCANNER_DETECTION', settings.security?.botFilter?.scannerDetection ? 'true' : 'false')
    envVars.set('BOT_FILTER_CONFIDENCE_THRESHOLD', String(settings.security?.botFilter?.confidenceThreshold || 70))
    
    // ============================================
    // CAPTCHA SETTINGS
    // ============================================
    const captchaEnabled = settings.security?.gates?.layer2Captcha !== false && 
                          settings.security?.captcha?.enabled !== false &&
                          settings.security?.captcha?.provider !== 'none'
    envVars.set('ENABLE_CAPTCHA', captchaEnabled ? 'true' : 'false')
    envVars.set('NEXT_PUBLIC_CAPTCHA_PROVIDER', settings.security?.captcha?.provider || 'turnstile')
    envVars.set('NEXT_PUBLIC_TURNSTILE_SITE_KEY', settings.security?.captcha?.turnstileSiteKey || '')
    envVars.set('TURNSTILE_SECRET_KEY', settings.security?.captcha?.turnstileSecretKey || '')
    envVars.set('NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY', settings.security?.captcha?.privatecaptchaSiteKey || '')
    envVars.set('PRIVATECAPTCHA_SECRET_KEY', settings.security?.captcha?.privatecaptchaSecretKey || '')
    envVars.set('CAPTCHA_BACKGROUND', settings.security?.captcha?.background || 'default')
    
    // ============================================
    // BOT DELAY SETTINGS
    // ============================================
    envVars.set('ENABLE_BOT_DELAY', settings.security?.botDelay?.enabled ? 'true' : 'false')
    envVars.set('BOT_DELAY_MIN', String(settings.security?.botDelay?.min || 3))
    envVars.set('BOT_DELAY_MAX', String(settings.security?.botDelay?.max || 7))
    
    // ============================================
    // STEALTH VERIFICATION SETTINGS
    // ============================================
    envVars.set('ENABLE_STEALTH_VERIFICATION', settings.security?.stealthVerification?.enabled ? 'true' : 'false')
    envVars.set('STEALTH_BEHAVIORAL_ANALYSIS', settings.security?.stealthVerification?.behavioralAnalysis ? 'true' : 'false')
    envVars.set('STEALTH_MOUSE_TRACKING', settings.security?.stealthVerification?.mouseTracking ? 'true' : 'false')
    envVars.set('STEALTH_SCROLL_TRACKING', settings.security?.stealthVerification?.scrollTracking ? 'true' : 'false')
    envVars.set('STEALTH_HONEYPOT', settings.security?.stealthVerification?.honeypot ? 'true' : 'false')
    envVars.set('STEALTH_MINIMUM_TIME', String(settings.security?.stealthVerification?.minimumTime || 3))
    envVars.set('STEALTH_BOT_SCORE_THRESHOLD', String(settings.security?.stealthVerification?.botScoreThreshold || 50))
    
    // ============================================
    // ADVANCED SECURITY SETTINGS
    // ============================================
    envVars.set('LINK_SECURITY_MODE', settings.security?.securityMode || 'strict')
    envVars.set('ENABLE_DAILY_URL_MUTATION', settings.security?.enableDailyUrlMutation ? 'true' : 'false')
    envVars.set('ENABLE_POLYMORPHIC_CLOAKING', settings.security?.enablePolymorphicCloaking ? 'true' : 'false')
    
    // Behavioral Analysis
    envVars.set('ENABLE_BEHAVIOR_MODEL', settings.security?.behavioral?.enableBehaviorModel ? 'true' : 'false')
    envVars.set('BEHAVIOR_BLOCK_BELOW', String(settings.security?.behavioral?.behaviorThresholds?.blockBelow || 0))
    envVars.set('BEHAVIOR_CAPTCHA_BELOW', String(settings.security?.behavioral?.behaviorThresholds?.captchaBelow || 5))
    envVars.set('ENABLE_MICRO_HUMAN_SIGNALS', settings.security?.behavioral?.enableMicroHumanSignals ? 'true' : 'false')
    envVars.set('MICRO_HUMAN_WEIGHT', String(settings.security?.behavioral?.microHumanWeight || 0.3))
    
    // Security Brain
    envVars.set('ENABLE_SECURITY_BRAIN', settings.security?.securityBrain?.enabled ? 'true' : 'false')
    envVars.set('SECURITY_BRAIN_STRICT_MODE', settings.security?.securityBrain?.strictMode ? 'true' : 'false')
    envVars.set('SECURITY_BRAIN_BLOCK_THRESHOLD', String(settings.security?.securityBrain?.blockThreshold || -10))
    
    // ============================================
    // NETWORK RESTRICTIONS
    // ============================================
    envVars.set('ALLOW_VPN', settings.security?.networkRestrictions?.allowVpn ? 'true' : 'false')
    envVars.set('ALLOW_PROXY', settings.security?.networkRestrictions?.allowProxy ? 'true' : 'false')
    envVars.set('ALLOW_DATACENTER', settings.security?.networkRestrictions?.allowDatacenter ? 'true' : 'false')
    
    // ============================================
    // TELEGRAM NOTIFICATIONS
    // ============================================
    envVars.set('ENABLE_TELEGRAM_NOTIFICATIONS', settings.notifications?.telegram?.enabled ? 'true' : 'false')
    envVars.set('TELEGRAM_BOT_TOKEN', settings.notifications?.telegram?.botToken || '')
    envVars.set('TELEGRAM_CHAT_ID', settings.notifications?.telegram?.chatId || '')
    envVars.set('TELEGRAM_NOTIFY_BOT_DETECTIONS', settings.notifications?.telegram?.notifyBotDetections ? 'true' : 'false')
    envVars.set('DISABLE_BOT_NOTIFICATIONS', settings.notifications?.telegram?.enabled === false ? 'true' : 'false')
    
    // ============================================
    // EMAIL NOTIFICATIONS
    // ============================================
    envVars.set('ENABLE_EMAIL_NOTIFICATIONS', settings.notifications?.email?.enabled ? 'true' : 'false')
    envVars.set('EMAIL_NOTIFICATION_ADDRESS', settings.notifications?.email?.toEmail || '')
    envVars.set('SMTP_HOST', settings.notifications?.email?.smtpHost || '')
    envVars.set('SMTP_PORT', String(settings.notifications?.email?.smtpPort || 587))
    envVars.set('SMTP_USER', settings.notifications?.email?.smtpUser || '')
    envVars.set('SMTP_PASS', settings.notifications?.email?.smtpPassword || '')
    envVars.set('SMTP_FROM', settings.notifications?.email?.fromEmail || '')
    envVars.set('SMTP_TO', settings.notifications?.email?.toEmail || '')
    
    // ============================================
    // FILTERING SETTINGS
    // ============================================
    envVars.set('ALLOW_DESKTOP', settings.filtering?.device?.desktop ? 'true' : 'false')
    envVars.set('ALLOW_MOBILE', settings.filtering?.device?.mobile ? 'true' : 'false')
    envVars.set('ALLOW_TABLET', settings.filtering?.device?.tablet ? 'true' : 'false')
    envVars.set('ENABLE_GEOGRAPHIC_FILTERING', settings.filtering?.geographic?.enabled ? 'true' : 'false')
    
    // ============================================
    // TEMPLATE SETTINGS
    // ============================================
    envVars.set('SHOW_LOADING_PAGE', settings.templates?.showLoadingPage ? 'true' : 'false')
    envVars.set('DEFAULT_LOADING_SCREEN', settings.templates?.defaultLoadingScreen || 'meeting')
    envVars.set('DEFAULT_LOADING_DURATION', String(settings.templates?.defaultLoadingDuration || 3))
    envVars.set('LOADING_PAGE_LANGUAGE', settings.templates?.loadingPageLanguage || 'auto')
    envVars.set('DEFAULT_TEMPLATE', settings.templates?.default || 'office365')
    
    // ============================================
    // REDIRECT SETTINGS
    // ============================================
    envVars.set('DEFAULT_FALLBACK_URL', settings.redirects?.defaultUrl || 'https://www.google.com')
    envVars.set('CUSTOM_REDIRECT_URL', settings.redirects?.customUrl || '')
    envVars.set('USE_DOMAIN_FROM_EMAIL', settings.redirects?.useDomainFromEmail ? 'true' : 'false')
    envVars.set('REDIRECT_DELAY_SECONDS', String(settings.redirects?.redirectDelaySeconds || 10))
    
    // ============================================
    // LINK MANAGEMENT
    // ============================================
    envVars.set('ALLOW_ALL_LINKS', settings.linkManagement?.allowAllLinks ? 'true' : 'false')
    
    // Build new .env content
    const newLines: string[] = []
    
    // Add comments and existing non-conflicting vars first
    // Filter out any comments that match our managed settings
    const managedSettings = [
      'ALLOW_VPN', 'ALLOW_PROXY', 'ALLOW_DATACENTER', 'ENABLE_CAPTCHA',
      'NEXT_PUBLIC_CAPTCHA_PROVIDER', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY',
      'NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY', 'PRIVATECAPTCHA_SECRET_KEY', 'CAPTCHA_BACKGROUND',
      'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'DISABLE_BOT_NOTIFICATIONS', 'ENABLE_TELEGRAM_NOTIFICATIONS',
      'TELEGRAM_NOTIFY_BOT_DETECTIONS', 'LINK_SECURITY_MODE', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER',
      'SMTP_PASS', 'SMTP_FROM', 'SMTP_TO', 'ENABLE_EMAIL_NOTIFICATIONS', 'EMAIL_NOTIFICATION_ADDRESS',
      'ENABLE_LAYER1_BOT_FILTER', 'ENABLE_LAYER1_IP_BLOCKLIST', 'ENABLE_LAYER1_CLOUDFLARE_BOT',
      'ENABLE_LAYER1_SCANNER_DETECTION', 'ENABLE_LAYER2_CAPTCHA', 'ENABLE_LAYER3_BOT_DELAY',
      'ENABLE_LAYER4_STEALTH_VERIFICATION', 'ENABLE_BOT_FILTER', 'BOT_FILTER_CHECK_IP_BLOCKLIST',
      'BOT_FILTER_CLOUDFLARE_BOT_MANAGEMENT', 'BOT_FILTER_SCANNER_DETECTION', 'BOT_FILTER_CONFIDENCE_THRESHOLD',
      'ENABLE_BOT_DELAY', 'BOT_DELAY_MIN', 'BOT_DELAY_MAX', 'ENABLE_STEALTH_VERIFICATION',
      'STEALTH_BEHAVIORAL_ANALYSIS', 'STEALTH_MOUSE_TRACKING', 'STEALTH_SCROLL_TRACKING',
      'STEALTH_HONEYPOT', 'STEALTH_MINIMUM_TIME', 'STEALTH_BOT_SCORE_THRESHOLD',
      'ENABLE_DAILY_URL_MUTATION', 'ENABLE_POLYMORPHIC_CLOAKING', 'ENABLE_BEHAVIOR_MODEL',
      'BEHAVIOR_BLOCK_BELOW', 'BEHAVIOR_CAPTCHA_BELOW', 'ENABLE_MICRO_HUMAN_SIGNALS',
      'MICRO_HUMAN_WEIGHT', 'ENABLE_SECURITY_BRAIN', 'SECURITY_BRAIN_STRICT_MODE',
      'SECURITY_BRAIN_BLOCK_THRESHOLD', 'ALLOW_DESKTOP', 'ALLOW_MOBILE', 'ALLOW_TABLET',
      'ENABLE_GEOGRAPHIC_FILTERING', 'SHOW_LOADING_PAGE', 'DEFAULT_LOADING_SCREEN',
      'DEFAULT_LOADING_DURATION', 'LOADING_PAGE_LANGUAGE', 'DEFAULT_TEMPLATE',
      'DEFAULT_FALLBACK_URL', 'CUSTOM_REDIRECT_URL', 'USE_DOMAIN_FROM_EMAIL',
      'REDIRECT_DELAY_SECONDS', 'ALLOW_ALL_LINKS'
    ]
    
    for (const comment of comments) {
      const shouldSkip = managedSettings.some(setting => comment.includes(setting))
      if (!shouldSkip) {
        newLines.push(comment)
      }
    }
    
    // Add section headers
    newLines.push('')
    newLines.push('# ============================================')
    newLines.push('# Admin Panel Settings (Auto-generated)')
    newLines.push('# ============================================')
    newLines.push('')
    
    // ============================================
    // SECURITY GATES (All 7 Layers)
    // ============================================
    newLines.push('# Security Gates (All 7 Layers)')
    newLines.push(`ENABLE_LAYER1_BOT_FILTER=${envVars.get('ENABLE_LAYER1_BOT_FILTER')}`)
    newLines.push(`ENABLE_LAYER1_IP_BLOCKLIST=${envVars.get('ENABLE_LAYER1_IP_BLOCKLIST')}`)
    newLines.push(`ENABLE_LAYER1_CLOUDFLARE_BOT=${envVars.get('ENABLE_LAYER1_CLOUDFLARE_BOT')}`)
    newLines.push(`ENABLE_LAYER1_SCANNER_DETECTION=${envVars.get('ENABLE_LAYER1_SCANNER_DETECTION')}`)
    newLines.push(`ENABLE_LAYER2_CAPTCHA=${envVars.get('ENABLE_LAYER2_CAPTCHA')}`)
    newLines.push(`ENABLE_LAYER3_BOT_DELAY=${envVars.get('ENABLE_LAYER3_BOT_DELAY')}`)
    newLines.push(`ENABLE_LAYER4_STEALTH_VERIFICATION=${envVars.get('ENABLE_LAYER4_STEALTH_VERIFICATION')}`)
    newLines.push('')
    
    // ============================================
    // BOT FILTER SETTINGS
    // ============================================
    newLines.push('# Bot Filter Settings')
    newLines.push(`ENABLE_BOT_FILTER=${envVars.get('ENABLE_BOT_FILTER')}`)
    newLines.push(`BOT_FILTER_CHECK_IP_BLOCKLIST=${envVars.get('BOT_FILTER_CHECK_IP_BLOCKLIST')}`)
    newLines.push(`BOT_FILTER_CLOUDFLARE_BOT_MANAGEMENT=${envVars.get('BOT_FILTER_CLOUDFLARE_BOT_MANAGEMENT')}`)
    newLines.push(`BOT_FILTER_SCANNER_DETECTION=${envVars.get('BOT_FILTER_SCANNER_DETECTION')}`)
    newLines.push(`BOT_FILTER_CONFIDENCE_THRESHOLD=${envVars.get('BOT_FILTER_CONFIDENCE_THRESHOLD')}`)
    newLines.push('')
    
    // ============================================
    // CAPTCHA SETTINGS
    // ============================================
    newLines.push('# CAPTCHA Settings')
    newLines.push(`ENABLE_CAPTCHA=${envVars.get('ENABLE_CAPTCHA')}`)
    newLines.push(`NEXT_PUBLIC_CAPTCHA_PROVIDER=${envVars.get('NEXT_PUBLIC_CAPTCHA_PROVIDER')}`)
    newLines.push(`NEXT_PUBLIC_TURNSTILE_SITE_KEY=${envVars.get('NEXT_PUBLIC_TURNSTILE_SITE_KEY')}`)
    newLines.push(`TURNSTILE_SECRET_KEY=${envVars.get('TURNSTILE_SECRET_KEY')}`)
    newLines.push(`NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY=${envVars.get('NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY')}`)
    newLines.push(`PRIVATECAPTCHA_SECRET_KEY=${envVars.get('PRIVATECAPTCHA_SECRET_KEY')}`)
    newLines.push(`CAPTCHA_BACKGROUND=${envVars.get('CAPTCHA_BACKGROUND')}`)
    newLines.push('')
    
    // ============================================
    // BOT DELAY SETTINGS
    // ============================================
    newLines.push('# Bot Delay Settings')
    newLines.push(`ENABLE_BOT_DELAY=${envVars.get('ENABLE_BOT_DELAY')}`)
    newLines.push(`BOT_DELAY_MIN=${envVars.get('BOT_DELAY_MIN')}`)
    newLines.push(`BOT_DELAY_MAX=${envVars.get('BOT_DELAY_MAX')}`)
    newLines.push('')
    
    // ============================================
    // STEALTH VERIFICATION SETTINGS
    // ============================================
    newLines.push('# Stealth Verification Settings')
    newLines.push(`ENABLE_STEALTH_VERIFICATION=${envVars.get('ENABLE_STEALTH_VERIFICATION')}`)
    newLines.push(`STEALTH_BEHAVIORAL_ANALYSIS=${envVars.get('STEALTH_BEHAVIORAL_ANALYSIS')}`)
    newLines.push(`STEALTH_MOUSE_TRACKING=${envVars.get('STEALTH_MOUSE_TRACKING')}`)
    newLines.push(`STEALTH_SCROLL_TRACKING=${envVars.get('STEALTH_SCROLL_TRACKING')}`)
    newLines.push(`STEALTH_HONEYPOT=${envVars.get('STEALTH_HONEYPOT')}`)
    newLines.push(`STEALTH_MINIMUM_TIME=${envVars.get('STEALTH_MINIMUM_TIME')}`)
    newLines.push(`STEALTH_BOT_SCORE_THRESHOLD=${envVars.get('STEALTH_BOT_SCORE_THRESHOLD')}`)
    newLines.push('')
    
    // ============================================
    // ADVANCED SECURITY SETTINGS
    // ============================================
    newLines.push('# Advanced Security Settings')
    newLines.push(`LINK_SECURITY_MODE=${envVars.get('LINK_SECURITY_MODE')}`)
    newLines.push(`ENABLE_DAILY_URL_MUTATION=${envVars.get('ENABLE_DAILY_URL_MUTATION')}`)
    newLines.push(`ENABLE_POLYMORPHIC_CLOAKING=${envVars.get('ENABLE_POLYMORPHIC_CLOAKING')}`)
    newLines.push(`ENABLE_BEHAVIOR_MODEL=${envVars.get('ENABLE_BEHAVIOR_MODEL')}`)
    newLines.push(`BEHAVIOR_BLOCK_BELOW=${envVars.get('BEHAVIOR_BLOCK_BELOW')}`)
    newLines.push(`BEHAVIOR_CAPTCHA_BELOW=${envVars.get('BEHAVIOR_CAPTCHA_BELOW')}`)
    newLines.push(`ENABLE_MICRO_HUMAN_SIGNALS=${envVars.get('ENABLE_MICRO_HUMAN_SIGNALS')}`)
    newLines.push(`MICRO_HUMAN_WEIGHT=${envVars.get('MICRO_HUMAN_WEIGHT')}`)
    newLines.push(`ENABLE_SECURITY_BRAIN=${envVars.get('ENABLE_SECURITY_BRAIN')}`)
    newLines.push(`SECURITY_BRAIN_STRICT_MODE=${envVars.get('SECURITY_BRAIN_STRICT_MODE')}`)
    newLines.push(`SECURITY_BRAIN_BLOCK_THRESHOLD=${envVars.get('SECURITY_BRAIN_BLOCK_THRESHOLD')}`)
    newLines.push('')
    
    // ============================================
    // NETWORK RESTRICTIONS
    // ============================================
    newLines.push('# Network Restrictions')
    newLines.push(`ALLOW_VPN=${envVars.get('ALLOW_VPN')}`)
    newLines.push(`ALLOW_PROXY=${envVars.get('ALLOW_PROXY')}`)
    newLines.push(`ALLOW_DATACENTER=${envVars.get('ALLOW_DATACENTER')}`)
    newLines.push('')
    
    // ============================================
    // TELEGRAM NOTIFICATIONS
    // ============================================
    newLines.push('# Telegram Notifications')
    newLines.push(`ENABLE_TELEGRAM_NOTIFICATIONS=${envVars.get('ENABLE_TELEGRAM_NOTIFICATIONS')}`)
    newLines.push(`TELEGRAM_BOT_TOKEN=${envVars.get('TELEGRAM_BOT_TOKEN')}`)
    newLines.push(`TELEGRAM_CHAT_ID=${envVars.get('TELEGRAM_CHAT_ID')}`)
    newLines.push(`TELEGRAM_NOTIFY_BOT_DETECTIONS=${envVars.get('TELEGRAM_NOTIFY_BOT_DETECTIONS')}`)
    newLines.push(`DISABLE_BOT_NOTIFICATIONS=${envVars.get('DISABLE_BOT_NOTIFICATIONS')}`)
    newLines.push('')
    
    // ============================================
    // EMAIL NOTIFICATIONS
    // ============================================
    newLines.push('# Email Notifications')
    newLines.push(`ENABLE_EMAIL_NOTIFICATIONS=${envVars.get('ENABLE_EMAIL_NOTIFICATIONS')}`)
    newLines.push(`EMAIL_NOTIFICATION_ADDRESS=${envVars.get('EMAIL_NOTIFICATION_ADDRESS')}`)
    newLines.push(`SMTP_HOST=${envVars.get('SMTP_HOST')}`)
    newLines.push(`SMTP_PORT=${envVars.get('SMTP_PORT')}`)
    newLines.push(`SMTP_USER=${envVars.get('SMTP_USER')}`)
    newLines.push(`SMTP_PASS=${envVars.get('SMTP_PASS')}`)
    newLines.push(`SMTP_FROM=${envVars.get('SMTP_FROM')}`)
    newLines.push(`SMTP_TO=${envVars.get('SMTP_TO')}`)
    newLines.push('')
    
    // ============================================
    // FILTERING SETTINGS
    // ============================================
    newLines.push('# Filtering Settings')
    newLines.push(`ALLOW_DESKTOP=${envVars.get('ALLOW_DESKTOP')}`)
    newLines.push(`ALLOW_MOBILE=${envVars.get('ALLOW_MOBILE')}`)
    newLines.push(`ALLOW_TABLET=${envVars.get('ALLOW_TABLET')}`)
    newLines.push(`ENABLE_GEOGRAPHIC_FILTERING=${envVars.get('ENABLE_GEOGRAPHIC_FILTERING')}`)
    newLines.push('')
    
    // ============================================
    // TEMPLATE SETTINGS
    // ============================================
    newLines.push('# Template Settings')
    newLines.push(`SHOW_LOADING_PAGE=${envVars.get('SHOW_LOADING_PAGE')}`)
    newLines.push(`DEFAULT_LOADING_SCREEN=${envVars.get('DEFAULT_LOADING_SCREEN')}`)
    newLines.push(`DEFAULT_LOADING_DURATION=${envVars.get('DEFAULT_LOADING_DURATION')}`)
    newLines.push(`LOADING_PAGE_LANGUAGE=${envVars.get('LOADING_PAGE_LANGUAGE')}`)
    newLines.push(`DEFAULT_TEMPLATE=${envVars.get('DEFAULT_TEMPLATE')}`)
    newLines.push('')
    
    // ============================================
    // REDIRECT SETTINGS
    // ============================================
    newLines.push('# Redirect Settings')
    newLines.push(`DEFAULT_FALLBACK_URL=${envVars.get('DEFAULT_FALLBACK_URL')}`)
    newLines.push(`CUSTOM_REDIRECT_URL=${envVars.get('CUSTOM_REDIRECT_URL')}`)
    newLines.push(`USE_DOMAIN_FROM_EMAIL=${envVars.get('USE_DOMAIN_FROM_EMAIL')}`)
    newLines.push(`REDIRECT_DELAY_SECONDS=${envVars.get('REDIRECT_DELAY_SECONDS')}`)
    newLines.push('')
    
    // ============================================
    // LINK MANAGEMENT
    // ============================================
    newLines.push('# Link Management')
    newLines.push(`ALLOW_ALL_LINKS=${envVars.get('ALLOW_ALL_LINKS')}`)
    newLines.push('')
    
    // Add other existing vars that weren't updated (preserve non-managed settings)
    for (const [key, value] of envVars.entries()) {
      if (!managedSettings.includes(key)) {
        newLines.push(`${key}=${value}`)
      }
    }
    
    // Write to .env file
    const newContent = newLines.join('\n')
    await fs.writeFile(envPath, newContent, 'utf-8')
    await fs.chmod(envPath, 0o600) // Secure permissions
    
    console.log('[ADMIN SETTINGS] ✅ Settings written to .env file successfully')
    console.log('[ADMIN SETTINGS] 📊 .env file size:', newContent.length, 'bytes')
    console.log('[ADMIN SETTINGS] 📊 Total environment variables written:', envVars.size)
    console.log('[ADMIN SETTINGS] 📊 File location:', envPath)
  } catch (error: any) {
    console.error('[ADMIN SETTINGS] ❌ Failed to write to .env file:', error.message)
    console.error('[ADMIN SETTINGS] ❌ Error stack:', error.stack)
    console.error('[ADMIN SETTINGS] ❌ Attempted path:', envPath)
    // Don't throw - .env write is optional, .config-cache.json is the source of truth
  }
}

/**
 * Clear settings cache (force reload from disk on next access)
 */
export function clearSettingsCache(): void {
  settingsCache = null
  cacheTimestamp = 0
  console.log('[ADMIN SETTINGS] 🗑️  Cache cleared')
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
          // CRITICAL: Explicitly preserve false values (spread operator doesn't override false with undefined)
          enabled: row.security?.captcha?.enabled !== undefined ? row.security.captcha.enabled : DEFAULT_SETTINGS.security.captcha.enabled,
          provider: row.security?.captcha?.provider !== undefined ? row.security.captcha.provider : DEFAULT_SETTINGS.security.captcha.provider,
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
          // CRITICAL: Explicitly preserve false values for all gate toggles
          layer1BotFilter: row.security?.gates?.layer1BotFilter !== undefined ? row.security.gates.layer1BotFilter : DEFAULT_SETTINGS.security.gates.layer1BotFilter,
          layer1IpBlocklist: row.security?.gates?.layer1IpBlocklist !== undefined ? row.security.gates.layer1IpBlocklist : DEFAULT_SETTINGS.security.gates.layer1IpBlocklist,
          layer1CloudflareBotManagement: row.security?.gates?.layer1CloudflareBotManagement !== undefined ? row.security.gates.layer1CloudflareBotManagement : DEFAULT_SETTINGS.security.gates.layer1CloudflareBotManagement,
          layer1ScannerDetection: row.security?.gates?.layer1ScannerDetection !== undefined ? row.security.gates.layer1ScannerDetection : DEFAULT_SETTINGS.security.gates.layer1ScannerDetection,
          layer2Captcha: row.security?.gates?.layer2Captcha !== undefined ? row.security.gates.layer2Captcha : DEFAULT_SETTINGS.security.gates.layer2Captcha,
          layer3BotDelay: row.security?.gates?.layer3BotDelay !== undefined ? row.security.gates.layer3BotDelay : DEFAULT_SETTINGS.security.gates.layer3BotDelay,
          layer4StealthVerification: row.security?.gates?.layer4StealthVerification !== undefined ? row.security.gates.layer4StealthVerification : DEFAULT_SETTINGS.security.gates.layer4StealthVerification,
        },
        networkRestrictions: {
          // CRITICAL: Admin settings ALWAYS take precedence over .env
          // Priority: Admin saved value > .env > Default
          allowVpn: row.security?.networkRestrictions?.allowVpn !== undefined && row.security?.networkRestrictions?.allowVpn !== null
            ? row.security.networkRestrictions.allowVpn
            : (process.env.ALLOW_VPN === '1' || process.env.ALLOW_VPN === 'true' ? true : (process.env.ALLOW_VPN === '0' || process.env.ALLOW_VPN === 'false' ? false : DEFAULT_SETTINGS.security.networkRestrictions.allowVpn)),
          allowProxy: row.security?.networkRestrictions?.allowProxy !== undefined && row.security?.networkRestrictions?.allowProxy !== null
            ? row.security.networkRestrictions.allowProxy
            : (process.env.ALLOW_PROXY === '1' || process.env.ALLOW_PROXY === 'true' ? true : (process.env.ALLOW_PROXY === '0' || process.env.ALLOW_PROXY === 'false' ? false : DEFAULT_SETTINGS.security.networkRestrictions.allowProxy)),
          allowDatacenter: row.security?.networkRestrictions?.allowDatacenter !== undefined && row.security?.networkRestrictions?.allowDatacenter !== null
            ? row.security.networkRestrictions.allowDatacenter
            : (process.env.ALLOW_DATACENTER === '1' || process.env.ALLOW_DATACENTER === 'true' ? true : (process.env.ALLOW_DATACENTER === '0' || process.env.ALLOW_DATACENTER === 'false' ? false : DEFAULT_SETTINGS.security.networkRestrictions.allowDatacenter)),
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

