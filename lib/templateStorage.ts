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
  
  // Log paths for debugging
  console.log('[TEMPLATE STORAGE] Loading templates...')
  console.log('[TEMPLATE STORAGE] process.cwd():', process.cwd())
  console.log('[TEMPLATE STORAGE] TEMPLATES_DIR:', TEMPLATES_DIR)
  console.log('[TEMPLATE STORAGE] TEMPLATES_FILE:', TEMPLATES_FILE)
  
  try {
    // Check if file exists
    try {
      await fs.access(TEMPLATES_FILE)
      console.log('[TEMPLATE STORAGE] Templates file exists')
    } catch {
      console.log('[TEMPLATE STORAGE] Templates file does not exist, will create defaults')
    }
    
    const data = await fs.readFile(TEMPLATES_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    
    console.log('[TEMPLATE STORAGE] Loaded templates file, parsed count:', Array.isArray(parsed) ? parsed.length : 'not an array')
    
    // If file exists but is empty or invalid, initialize with defaults
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log('[TEMPLATE STORAGE] Templates file is empty or invalid, initializing defaults...')
      const defaults = await getDefaultTemplates()
      await saveTemplates(defaults)
      console.log('[TEMPLATE STORAGE] Initialized', defaults.length, 'default templates')
      return defaults
    }
    
    console.log('[TEMPLATE STORAGE] Successfully loaded', parsed.length, 'templates')
    return parsed
  } catch (error: any) {
    // Return default templates if file doesn't exist or is corrupted
    console.log('[TEMPLATE STORAGE] Templates file not found or corrupted, initializing defaults...')
    console.log('[TEMPLATE STORAGE] Error:', error?.message || error)
    const defaults = await getDefaultTemplates()
    await saveTemplates(defaults)
    console.log('[TEMPLATE STORAGE] Initialized', defaults.length, 'default templates after error')
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

// ============================================
// PHASE 3: SQLite Migration Functions
// ============================================
// These functions use SQLite instead of JSON files
// They are NOT exported yet - will be integrated in later phase
// ============================================

/**
 * Get template by ID from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param templateId Template ID to retrieve
 * @returns Template object or null if not found
 */
async function getTemplateByIdSql(templateId: string): Promise<Template | null> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    // Read from templates table
    // sql.get automatically parses JSON columns (theme, background, logo, layout, translations, features)
    const row = sql.get<{
      id: string
      name: string
      provider: string
      type: string
      theme: any
      background: any
      logo: any
      layout: any
      translations: any
      default_language: string
      auto_detect_language: number
      features: any
      obfuscation_level: string
      enabled: number
      is_default: number
      created_at: number
      updated_at: number
      created_by: string | null
    }>('SELECT * FROM templates WHERE id = ?', [templateId])
    
    if (!row) {
      return null
    }
    
    // Map database row to Template interface
    const template: Template = {
      id: row.id,
      name: row.name,
      provider: row.provider as Template['provider'],
      type: row.type as Template['type'],
      enabled: row.enabled === 1,
      isDefault: row.is_default === 1,
      theme: row.theme,
      background: row.background,
      logo: row.logo,
      layout: row.layout,
      translations: row.translations,
      defaultLanguage: row.default_language as Template['defaultLanguage'],
      autoDetectLanguage: row.auto_detect_language === 1,
      features: row.features,
      obfuscationLevel: row.obfuscation_level as Template['obfuscationLevel'],
      createdAt: row.created_at * 1000, // Convert seconds to milliseconds
      updatedAt: row.updated_at * 1000, // Convert seconds to milliseconds
      createdBy: row.created_by || 'system',
    }
    
    return template
  } catch (error) {
    console.error('[TEMPLATE STORAGE SQL] Failed to read template from SQLite:', error)
    return null
  }
}

/**
 * Get all templates from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @returns Array of all templates
 */
async function getAllTemplatesSql(): Promise<Template[]> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    // Read all templates from database
    // sql.all automatically parses JSON columns
    const rows = sql.all<{
      id: string
      name: string
      provider: string
      type: string
      theme: any
      background: any
      logo: any
      layout: any
      translations: any
      default_language: string
      auto_detect_language: number
      features: any
      obfuscation_level: string
      enabled: number
      is_default: number
      created_at: number
      updated_at: number
      created_by: string | null
    }>('SELECT * FROM templates ORDER BY created_at DESC')
    
    // Map database rows to Template interface
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      provider: row.provider as Template['provider'],
      type: row.type as Template['type'],
      enabled: row.enabled === 1,
      isDefault: row.is_default === 1,
      theme: row.theme,
      background: row.background,
      logo: row.logo,
      layout: row.layout,
      translations: row.translations,
      defaultLanguage: row.default_language as Template['defaultLanguage'],
      autoDetectLanguage: row.auto_detect_language === 1,
      features: row.features,
      obfuscationLevel: row.obfuscation_level as Template['obfuscationLevel'],
      createdAt: row.created_at * 1000, // Convert seconds to milliseconds
      updatedAt: row.updated_at * 1000, // Convert seconds to milliseconds
      createdBy: row.created_by || 'system',
    }))
  } catch (error) {
    console.error('[TEMPLATE STORAGE SQL] Failed to read templates from SQLite:', error)
    return []
  }
}

/**
 * Create a new template in SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param template Template object (without id, createdAt, updatedAt - these are auto-generated)
 * @returns Created template with generated id and timestamps
 */
async function createTemplateSql(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    const templateId = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // sql.run with named parameters automatically stringifies JSON columns
    sql.run(
      `INSERT INTO templates 
       (id, name, provider, type, theme, background, logo, layout, translations, 
        default_language, auto_detect_language, features, obfuscation_level, 
        enabled, is_default, created_at, updated_at, created_by)
       VALUES ($id, $name, $provider, $type, $theme, $background, $logo, $layout, $translations,
               $default_language, $auto_detect_language, $features, $obfuscation_level,
               $enabled, $is_default, $created_at, $updated_at, $created_by)`,
      {
        id: templateId,
        name: template.name,
        provider: template.provider,
        type: template.type,
        theme: template.theme,
        background: template.background,
        logo: template.logo,
        layout: template.layout,
        translations: template.translations,
        default_language: template.defaultLanguage,
        auto_detect_language: template.autoDetectLanguage ? 1 : 0,
        features: template.features,
        obfuscation_level: template.obfuscationLevel,
        enabled: template.enabled ? 1 : 0,
        is_default: template.isDefault ? 1 : 0,
        created_at: now,
        updated_at: now,
        created_by: template.createdBy || 'system',
      }
    )
    
    // Return the created template
    return {
      ...template,
      id: templateId,
      createdAt: now * 1000, // Convert back to milliseconds for consistency
      updatedAt: now * 1000,
    }
  } catch (error) {
    console.error('[TEMPLATE STORAGE SQL] Failed to create template in SQLite:', error)
    throw new Error(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Update an existing template in SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param templateId Template ID to update
 * @param payload Partial template object with fields to update
 * @returns Updated template or null if not found
 */
async function updateTemplateSql(templateId: string, payload: Partial<Template>): Promise<Template | null> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    // First, get the existing template
    const existing = await getTemplateByIdSql(templateId)
    if (!existing) {
      return null
    }
    
    // Merge updates with existing template
    const updated: Template = {
      ...existing,
      ...payload,
      id: templateId, // Ensure ID doesn't change
      updatedAt: Date.now(),
    }
    
    const now = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    
    // sql.run with named parameters automatically stringifies JSON columns
    sql.run(
      `UPDATE templates SET
       name = $name,
       provider = $provider,
       type = $type,
       theme = $theme,
       background = $background,
       logo = $logo,
       layout = $layout,
       translations = $translations,
       default_language = $default_language,
       auto_detect_language = $auto_detect_language,
       features = $features,
       obfuscation_level = $obfuscation_level,
       enabled = $enabled,
       is_default = $is_default,
       updated_at = $updated_at,
       created_by = $created_by
       WHERE id = $id`,
      {
        id: templateId,
        name: updated.name,
        provider: updated.provider,
        type: updated.type,
        theme: updated.theme,
        background: updated.background,
        logo: updated.logo,
        layout: updated.layout,
        translations: updated.translations,
        default_language: updated.defaultLanguage,
        auto_detect_language: updated.autoDetectLanguage ? 1 : 0,
        features: updated.features,
        obfuscation_level: updated.obfuscationLevel,
        enabled: updated.enabled ? 1 : 0,
        is_default: updated.isDefault ? 1 : 0,
        updated_at: now,
        created_by: updated.createdBy || 'system',
      }
    )
    
    // Return updated template with millisecond timestamps
    return {
      ...updated,
      updatedAt: now * 1000,
    }
  } catch (error) {
    console.error('[TEMPLATE STORAGE SQL] Failed to update template in SQLite:', error)
    throw new Error(`Failed to update template: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Delete a template from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param templateId Template ID to delete
 * @returns true if deleted, false if not found
 */
async function deleteTemplateSql(templateId: string): Promise<boolean> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    // Check if template exists first
    const existing = await getTemplateByIdSql(templateId)
    if (!existing) {
      return false
    }
    
    // Delete the template
    const result = sql.run('DELETE FROM templates WHERE id = ?', [templateId])
    
    // Return true if a row was deleted
    return result.changes > 0
  } catch (error) {
    console.error('[TEMPLATE STORAGE SQL] Failed to delete template from SQLite:', error)
    throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`)
  }
}

