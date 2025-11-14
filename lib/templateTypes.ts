export type SupportedLanguage = 'en' | 'ja' | 'ko' | 'de' | 'es'

export type TemplateType = 
  | 'email-login'      // Current: Email login pages
  | 'document'         // Future: Document access pages
  | 'voicenote'        // Future: Voice note pages
  | 'meeting'          // Future: Meeting/video call pages
  | 'zoom'             // Future: Zoom call pages
  | 'custom'           // Future: Custom types

export interface TemplateTranslations {
  en: TemplateContent
  ja: TemplateContent
  ko: TemplateContent
  de: TemplateContent
  es: TemplateContent
}

export interface TemplateContent {
  title: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  submitButton: string
  forgotPassword?: string
  rememberMe?: string
  createAccount?: string
  termsOfService?: string
  privacyPolicy?: string
  errorMessages: {
    invalidEmail: string
    invalidPassword: string
    accountLocked: string
    serverError: string
  }
  notices?: {
    twoFactorAuth?: string
    maintenanceNotice?: string
    loginNote?: string
    mailServices?: string
  }
}

export interface Template {
  id: string
  name: string
  provider: 'biglobe' | 'sakura' | 'docomo' | 'nifty' | 'sfexpress' | 'outlook' | 'owaserver' | 'custom'
  type: TemplateType  // NEW: Template type
  enabled: boolean
  isDefault: boolean
  
  // Appearance
  theme: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    accentColor: string
  }
  
  // Background
  background: {
    type: 'color' | 'image' | 'gradient'
    value: string  // Color hex, image URL, or gradient CSS
    opacity?: number
  }
  
  // Logo
  logo: {
    url?: string
    text?: string
    width?: number
    height?: number
  }
  
  // Layout
  layout: {
    containerWidth: string
    formPosition: 'center' | 'left' | 'right'
    showHeader: boolean
    showFooter: boolean
  }
  
  // Content
  translations: TemplateTranslations
  defaultLanguage: SupportedLanguage
  autoDetectLanguage: boolean
  
  // Features
  features: {
    showLogo: boolean
    showNotices: boolean
    showCaptcha: boolean
    showRememberMe: boolean
    showForgotPassword: boolean
    showCreateAccount: boolean
    showSoftKeyboard: boolean
  }
  
  // Advanced
  customCSS?: string
  customHTML?: string
  obfuscationLevel: 'low' | 'medium' | 'high'
  
  // Metadata
  createdAt: number
  updatedAt: number
  createdBy: string
}

