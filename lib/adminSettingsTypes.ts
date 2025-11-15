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

export interface SecuritySettings {
  botFilter: BotFilterSettings
  captcha: CaptchaSettings
  botDelay: BotDelaySettings
  stealthVerification: StealthVerificationSettings
  gates: SecurityGatesSettings
  networkRestrictions: NetworkRestrictionsSettings
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

export interface BrowserFiltering {
  chrome: boolean
  firefox: boolean
  safari: boolean
  edge: boolean
  opera: boolean
  other: boolean
}

export interface NetworkFiltering {
  blockVPN: boolean
  blockProxy: boolean
  blockDatacenter: boolean
  blockTor: boolean
}

export interface FilteringSettings {
  geographic: GeographicFiltering
  device: DeviceFiltering
  browser: BrowserFiltering
  network: NetworkFiltering
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

