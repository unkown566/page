/**
 * Admin Settings Type Definitions
 * This file contains only TypeScript types/interfaces
 * Safe to import in client components
 */

export interface TelegramSettings {
  enabled: boolean
  botToken: string
  chatId: string
  events: string[]
  notifyBotDetections?: boolean // Notify when bots are detected and blocked
}

export interface EmailSMTP {
  host: string
  port: number
  username: string
  password: string
  sendTo: string
}

export interface EmailSettings {
  enabled: boolean
  toEmail?: string // Email address to receive visit notifications
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  events: string[]
}

export interface NotificationSettings {
  telegram: TelegramSettings
  email: EmailSettings
}

export interface BotFilterSettings {
  enabled: boolean
  checkIPBlocklist: boolean
  cloudflareBotManagement: boolean
  scannerDetection: boolean
  confidenceThreshold?: number // Bot detection confidence threshold (0-100, default: 70)
}

export interface CaptchaSettings {
  enabled: boolean
  provider: 'turnstile' | 'privatecaptcha' | 'none'
  turnstileSiteKey: string
  turnstileSecretKey: string
  privatecaptchaSiteKey: string
  privatecaptchaSecretKey: string
  template?: 'A' | 'B' | 'C' | 'D' // PATCH 3: CAPTCHA UX template selection (deprecated)
  background?: 'default' | 'bg1' | 'bg2' | 'bg3' | 'bg4' | 'random' // CAPTCHA background image
}

export interface BotDelaySettings {
  enabled: boolean
  min: number
  max: number
}

export interface StealthVerificationSettings {
  enabled: boolean
  behavioralAnalysis: boolean
  mouseTracking: boolean
  scrollTracking: boolean
  honeypot: boolean
  minimumTime: number
  botScoreThreshold: number
}

export interface SecurityGatesSettings {
  layer1BotFilter: boolean
  layer1IpBlocklist: boolean
  layer1CloudflareBotManagement: boolean
  layer1ScannerDetection: boolean
  layer2Captcha: boolean
  layer3BotDelay: boolean
  layer4StealthVerification: boolean
}

export interface NetworkRestrictionsSettings {
  allowVpn: boolean
  allowProxy: boolean
  allowDatacenter: boolean
}

export interface BehavioralSettings {
  enableBehaviorModel: boolean
  behaviorThresholds: {
    blockBelow: number
    captchaBelow: number
  }
  enableMicroHumanSignals?: boolean // Phase 5.11: Micro human verification
  microHumanWeight?: number // Phase 5.11: Weight for micro signals (default: 0.3)
}

export interface SecurityBrainSettings {
  enabled: boolean
  strictMode: boolean  // If true, requires higher confidence for ALLOW
  blockThreshold: number  // Risk score below which to consider blocking (default: -10)
}

export interface SecuritySettings {
  botFilter: BotFilterSettings
  captcha: CaptchaSettings
  botDelay: BotDelaySettings
  stealthVerification: StealthVerificationSettings
  gates: SecurityGatesSettings
  networkRestrictions: NetworkRestrictionsSettings
  securityMode?: 'strict' | 'hardened' // Link security mode: strict (default) or hardened (red-team mode)
  enableDailyUrlMutation?: boolean // Daily-changing cloaked URL path prefixes (default: true)
  enablePolymorphicCloaking?: boolean // Phase 5.8: Polymorphic HTML/JS mutation (default: true)
  behavioral?: BehavioralSettings // Phase 5.9: Behavioral security engine
  securityBrain?: SecurityBrainSettings // Phase 5.10: Unified Security Brain
}

export interface GeographicFiltering {
  enabled: boolean
  allowed: string[]
  blocked: string[]
}

export interface DeviceFiltering {
  desktop: boolean
  mobile: boolean
  tablet: boolean
}

// BrowserFiltering removed - not implemented in backend
// NetworkFiltering removed - duplicates security.networkRestrictions

export interface FilteringSettings {
  geographic: GeographicFiltering
  device: DeviceFiltering
  // browser removed - not implemented
  // network removed - duplicates security.networkRestrictions
}

export interface TemplateSettings {
  default: string
  defaultLoadingScreen?: string  // Default loading screen ID (e.g., 'meeting', 'voice', etc.)
  defaultLoadingDuration?: number  // Default loading duration in seconds (1-10, default: 3)
  showLoadingPage?: boolean  // Show loading page animation to visitors (default: true)
  loadingPageLanguage?: string  // Language for loading page ('auto', 'en', 'ja', etc.)
}

export interface RedirectSettings {
  defaultUrl: string // Default fallback URL (e.g., https://www.google.com)
  customUrl?: string // Optional custom redirect URL (e.g., https://freshnation.net)
  useDomainFromEmail: boolean // Extract domain from email (admin@company.com → company.com)
  redirectDelaySeconds: number // Delay before redirect (default: 10)
  // Hash values are now hardcoded in code:
  // Success → #Success
  // TooManyAttempts → #TooManyAttempts
  // LinkUsed → #ReviewCompleted
}

export interface LinkManagementSettings {
  allowAllLinks?: boolean  // Master toggle: allow all links regardless of expiration
}

export interface AdminSettings {
  notifications: NotificationSettings
  security: SecuritySettings
  filtering: FilteringSettings
  templates: TemplateSettings
  redirects: RedirectSettings
  linkManagement?: LinkManagementSettings  // Link management controls
}

