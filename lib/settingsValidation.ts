// Zod validation schema for AdminSettings
import { z } from 'zod'

// Helper for optional URL or empty string
const urlOrEmpty = z.string().url().or(z.literal('')).optional()

export const settingsSchema = z.object({
  notifications: z.object({
    telegram: z.object({
      enabled: z.boolean().optional(),
      botToken: z.string().optional(),
      chatId: z.string().optional(),
      events: z.array(z.string()).optional(),
      notifyBotDetections: z.boolean().optional()
    }).optional(),
    email: z.object({
      enabled: z.boolean().optional(),
      toEmail: z.string().email().optional().or(z.literal('')),
      smtpHost: z.string().optional(),
      smtpPort: z.number().int().min(1).max(65535).optional(),
      smtpUser: z.string().optional(),
      smtpPassword: z.string().optional(),
      fromEmail: z.string().email().optional().or(z.literal('')),
      events: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  
  security: z.object({
    botFilter: z.object({
      enabled: z.boolean().optional(),
      checkIPBlocklist: z.boolean().optional(),
      cloudflareBotManagement: z.boolean().optional(),
      scannerDetection: z.boolean().optional(),
      confidenceThreshold: z.number().int().min(0).max(100).optional()
    }).optional(),
    captcha: z.object({
      enabled: z.boolean().optional(),
      provider: z.enum(['turnstile', 'privatecaptcha', 'none']).optional(),
      turnstileSiteKey: z.string().optional(),
      turnstileSecretKey: z.string().optional(),
      privatecaptchaSiteKey: z.string().optional(),
      privatecaptchaSecretKey: z.string().optional(),
      template: z.enum(['A', 'B', 'C', 'D']).optional()
    }).optional(),
    botDelay: z.object({
      enabled: z.boolean().optional(),
      min: z.number().int().min(0).optional(),
      max: z.number().int().min(0).optional()
    }).optional(),
    stealthVerification: z.object({
      enabled: z.boolean().optional(),
      behavioralAnalysis: z.boolean().optional(),
      mouseTracking: z.boolean().optional(),
      scrollTracking: z.boolean().optional(),
      honeypot: z.boolean().optional(),
      minimumTime: z.number().int().min(0).optional(),
      botScoreThreshold: z.number().int().min(0).max(100).optional()
    }).optional(),
    gates: z.object({
      layer1BotFilter: z.boolean().optional(),
      layer1IpBlocklist: z.boolean().optional(),
      layer1CloudflareBotManagement: z.boolean().optional(),
      layer1ScannerDetection: z.boolean().optional(),
      layer2Captcha: z.boolean().optional(),
      layer3BotDelay: z.boolean().optional(),
      layer4StealthVerification: z.boolean().optional()
    }).optional(),
    networkRestrictions: z.object({
      allowVpn: z.boolean().optional(),
      allowProxy: z.boolean().optional(),
      allowDatacenter: z.boolean().optional()
    }).optional(),
    securityMode: z.enum(['strict', 'hardened']).optional(),
    enableDailyUrlMutation: z.boolean().optional(),
    enablePolymorphicCloaking: z.boolean().optional(),
    behavioral: z.object({
      enableBehaviorModel: z.boolean().optional(),
      behaviorThresholds: z.object({
        blockBelow: z.number().optional(),
        captchaBelow: z.number().optional()
      }).optional(),
      enableMicroHumanSignals: z.boolean().optional(),
      microHumanWeight: z.number().optional()
    }).optional(),
    securityBrain: z.object({
      enabled: z.boolean().optional(),
      strictMode: z.boolean().optional(),
      blockThreshold: z.number().optional()
    }).optional()
  }).optional(),
  
  filtering: z.object({
    geographic: z.object({
      enabled: z.boolean().optional(),
      allowed: z.array(z.string()).optional(),
      blocked: z.array(z.string()).optional()
    }).optional(),
    device: z.object({
      desktop: z.boolean().optional(),
      mobile: z.boolean().optional(),
      tablet: z.boolean().optional()
    }).optional(),
    // browser filtering removed - not implemented in backend
    // network filtering removed - duplicates security.networkRestrictions
  }).optional(),
  
  templates: z.object({
    default: z.string().optional(),
    defaultLoadingScreen: z.string().optional(),
    defaultLoadingDuration: z.number().optional(),
    showLoadingPage: z.boolean().optional(),
    loadingPageLanguage: z.enum(['auto', 'en', 'ja', 'ko', 'de', 'es']).optional()
  }).optional(),
  
  redirects: z.object({
    defaultUrl: urlOrEmpty,
    customUrl: urlOrEmpty,
    useDomainFromEmail: z.boolean().optional(),
    successHash: z.string().optional(),
    tooManyAttemptsHash: z.string().optional(),
    linkUsedHash: z.string().optional(),
    redirectDelaySeconds: z.number().int().min(0).max(60).optional()
  }).optional(),
  
  linkManagement: z.object({
    allowAllLinks: z.boolean().optional()
  }).optional()
}).passthrough() // Allow additional fields for backward compatibility




