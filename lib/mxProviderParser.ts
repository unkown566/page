import fs from 'fs'
import path from 'path'

export interface ProviderPattern {
  name: string
  patterns: string[]
  smtp?: {
    host: string
    ports: number[]
  }
  webmail?: string
}

// SMTP configurations for known providers (not in CSV, but needed)
const SMTP_CONFIGS: Record<string, { host: string; ports: number[] }> = {
  'Biglobe': { host: 'smtp.biglobe.ne.jp', ports: [587, 465, 25] },
  'Sakura Internet': { host: 'smtp.sakura.ne.jp', ports: [587, 465, 25] },
  'office365': { host: 'smtp.office365.com', ports: [587, 465] },
  'Google Workspace': { host: 'smtp.gmail.com', ports: [587, 465] },
  'gmail': { host: 'smtp.gmail.com', ports: [587, 465] },
  'Zoho Mail': { host: 'smtp.zoho.com', ports: [587, 465] },
  'yahoo': { host: 'smtp.mail.yahoo.com', ports: [587, 465] },
  'Yahoo Japan': { host: 'smtp.mail.yahoo.co.jp', ports: [587, 465] },
  'iCloud': { host: 'smtp.mail.me.com', ports: [587, 465] },
  'icloud': { host: 'smtp.mail.me.com', ports: [587, 465] },
  'ProtonMail': { host: 'mail.protonmail.com', ports: [587, 465] },
  'FastMail': { host: 'smtp.fastmail.com', ports: [587, 465] },
  'ConoHa': { host: 'smtp.conoha.ne.jp', ports: [587, 465] },
  'Heteml': { host: 'smtp.heteml.jp', ports: [587, 465] },
  'Kagoya': { host: 'smtp.kagoya.net', ports: [587, 465] },
  'Lolipop': { host: 'smtp.lolipop.jp', ports: [587, 465] },
  'Nifty': { host: 'smtp.nifty.com', ports: [587, 465] },
  'OCN': { host: 'smtp.ocn.ne.jp', ports: [587, 465] },
  'Plala': { host: 'smtp.plala.or.jp', ports: [587, 465] },
  'Rakuten': { host: 'smtp.rakuten.ne.jp', ports: [587, 465] },
  'So-net': { host: 'smtp.so-net.ne.jp', ports: [587, 465] },
  'Value-Domain': { host: 'smtp.value-domain.com', ports: [587, 465] },
  'Xserver': { host: 'smtp.xserver.jp', ports: [587, 465] },
}

// Webmail URLs for known providers
const WEBMAIL_URLS: Record<string, string> = {
  'office365': 'https://login.microsoftonline.com',
  'outlook': 'https://login.microsoftonline.com',
  'Google Workspace': 'https://accounts.google.com',
  'gmail': 'https://accounts.google.com',
  'yahoo': 'https://login.yahoo.com',
  'Yahoo Japan': 'https://login.yahoo.co.jp',
  'Zoho Mail': 'https://mail.zoho.com',
  'iCloud': 'https://www.icloud.com/mail',
  'icloud': 'https://www.icloud.com/mail',
  'ProtonMail': 'https://mail.protonmail.com',
  'FastMail': 'https://www.fastmail.com',
  'Roundcube': 'https://webmail', // Will be combined with domain
  'Horde Webmail': 'https://webmail', // Will be combined with domain
}

let providerPatterns: ProviderPattern[] | null = null

// Parse CSV file
export function parseMXCSV(csvContent: string): ProviderPattern[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const patterns: ProviderPattern[] = []
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const parts = line.split(',')
    if (parts.length < 3) continue
    
    const checked = parts[0]
    const name = parts[1]
    const mxcontain = parts[2] || ''
    
    // Only process checked providers
    if (checked !== '1') continue
    
    // Skip no_smtp and others
    if (name === 'no_smtp' || name === 'others') continue
    
    const patternStrings = mxcontain.split('|').map(p => p.trim()).filter(p => p)
    
    if (patternStrings.length > 0 || name) {
      patterns.push({
        name: name.trim(),
        patterns: patternStrings,
        smtp: SMTP_CONFIGS[name],
        webmail: WEBMAIL_URLS[name],
      })
    }
  }
  
  return patterns
}

// Load provider patterns from CSV
export function loadProviderPatterns(): ProviderPattern[] {
  if (providerPatterns) {
    return providerPatterns
  }
  
  try {
    // Try to load from CSV file
    const csvPath = path.join(process.cwd(), 'mx_20251105.csv')
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      providerPatterns = parseMXCSV(csvContent)
      return providerPatterns
    }
  } catch (error) {
  }
  
  // Fallback to hardcoded patterns
  providerPatterns = [
    {
      name: 'Biglobe',
      patterns: ['biglobe.ne.jp'],
      smtp: SMTP_CONFIGS['Biglobe'],
    },
    {
      name: 'Sakura Internet',
      patterns: ['sakura.ne.jp'],
      smtp: SMTP_CONFIGS['Sakura Internet'],
    },
    {
      name: 'office365',
      patterns: ['.protection.outlook.com', '.office365.com', 'owa.', '.outlook.', '.office365.'],
      smtp: SMTP_CONFIGS['office365'],
      webmail: WEBMAIL_URLS['office365'],
    },
    {
      name: 'Google Workspace',
      patterns: ['aspmx.l.google.com', '.gmail.', '.google.', '.googlemail.com'],
      smtp: SMTP_CONFIGS['Google Workspace'],
      webmail: WEBMAIL_URLS['Google Workspace'],
    },
  ]
  
  return providerPatterns
}

// Detect provider from MX record using CSV patterns
export function detectProviderFromMX(mxRecord: string, patterns: ProviderPattern[]): ProviderPattern | null {
  const mxLower = mxRecord.toLowerCase()
  
  for (const provider of patterns) {
    for (const pattern of provider.patterns) {
      // Handle regex patterns
      if (pattern.startsWith('.')) {
        // Pattern like ".gmail." should match "smtp.gmail.com"
        if (mxLower.includes(pattern.toLowerCase())) {
          return provider
        }
      } else if (pattern.endsWith('.')) {
        // Pattern like "owa." should match "owa.office365.com"
        if (mxLower.startsWith(pattern.toLowerCase())) {
          return provider
        }
      } else if (pattern.includes('*')) {
        // Regex pattern like "webmail.*"
        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i')
        if (regex.test(mxRecord)) {
          return provider
        }
      } else {
        // Exact or partial match
        if (mxLower.includes(pattern.toLowerCase())) {
          return provider
        }
      }
    }
  }
  
  return null
}

// Get SMTP config for provider
export function getSMTPConfigForProvider(provider: ProviderPattern, domain: string): Array<{ host: string; port: number; secure: boolean }> {
  const configs: Array<{ host: string; port: number; secure: boolean }> = []
  
  if (provider.smtp) {
    for (const port of provider.smtp.ports) {
      configs.push({
        host: provider.smtp.host,
        port,
        secure: port === 465,
      })
    }
  } else {
    // Default SMTP configs
    configs.push(
      { host: `smtp.${domain}`, port: 587, secure: false },
      { host: `smtp.${domain}`, port: 465, secure: true },
      { host: `mail.${domain}`, port: 587, secure: false },
    )
  }
  
  return configs
}

// Get webmail URL for provider
export function getWebmailUrlForProvider(provider: ProviderPattern, domain: string): string | null {
  if (provider.webmail) {
    // Handle patterns like "webmail" that need domain
    if (provider.webmail.includes('webmail') && !provider.webmail.startsWith('http')) {
      return `https://webmail.${domain}`
    }
    return provider.webmail
  }
  
  // Default webmail URLs
  return `https://webmail.${domain}`
}











