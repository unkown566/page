import 'server-only'

import { secureReadJSON, secureUpdateJSON } from './secureFileSystem'
import { migrateFileIfNeeded } from './fileMigration'
import path from 'path'

export interface GeoData {
  country: string
  city: string
}

export interface VisitorLog {
  id: string
  timestamp: number
  ip: string
  userAgent: string
  country: string
  city: string
  captchaStatus: 'verified' | 'failed' | 'pending'
  botStatus: 'human' | 'bot' | 'suspicious'
  fingerprint: string
  sessionIdentifier?: string  // New name (formerly: linkToken)
  linkToken?: string          // Legacy alias for backward compatibility
  email?: string
  layer: 'bot-filter' | 'captcha' | 'bot-delay' | 'stealth' | 'login' | 'middleware'
  layerPassed: boolean
  sessionId: string
  reason?: string
}

// Access logs storage (formerly: visitor-logs)
// Migrate old file name on first access
const LEGACY_FILE = path.join(process.cwd(), '.visitor-logs.json')
const VISITOR_LOG_FILE = path.join(process.cwd(), '.access-logs.json')

// Migrate old file name if needed (runs once on module load)
if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
  migrateFileIfNeeded(LEGACY_FILE, VISITOR_LOG_FILE)
}

// Load visitor logs (atomic read)
export async function loadVisitorLogs(): Promise<VisitorLog[]> {
  return await secureReadJSON<VisitorLog[]>(VISITOR_LOG_FILE, [])
}

// Add visitor log (atomic update)
export async function addVisitorLog(log: Omit<VisitorLog, 'id' | 'timestamp'>): Promise<void> {
  await secureUpdateJSON<VisitorLog[]>(VISITOR_LOG_FILE, [], (logs) => {
    const newLog: VisitorLog = {
      id: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...log
    }
    
    logs.unshift(newLog) // Add to beginning
    
    // Keep only last 10,000 logs
    if (logs.length > 10000) {
      logs.splice(10000)
    }
    
    return logs
  })
}

// Get dashboard statistics
export async function getDashboardStats() {
  const logs = await loadVisitorLogs()
  
  // Calculate statistics
  const totalVisitors = logs.length
  const validLogs = logs.filter(l => l.layerPassed).length
  const invalidLogs = logs.filter(l => !l.layerPassed).length
  const botsDetected = logs.filter(l => l.botStatus === 'bot').length
  const validVisitors = logs.filter(l => l.botStatus === 'human').length
  
  // By layer
  const botFilterPassed = logs.filter(l => l.layer === 'bot-filter' && l.layerPassed).length
  const captchaPassed = logs.filter(l => l.layer === 'captcha' && l.layerPassed).length
  const stealthPassed = logs.filter(l => l.layer === 'stealth' && l.layerPassed).length
  const loginAttempts = logs.filter(l => l.layer === 'login').length
  
  // By time
  const now = Date.now()
  const last24h = logs.filter(l => l.timestamp > now - 86400000).length
  const lastHour = logs.filter(l => l.timestamp > now - 3600000).length
  
  return {
    totalVisitors,
    totalVisits: totalVisitors, // Total visits = all visitor logs
    validLogs,
    invalidLogs,
    botsDetected,
    validVisitors,
    byLayer: {
      botFilterPassed,
      captchaPassed,
      stealthPassed,
      loginAttempts
    },
    byTime: {
      last24h,
      lastHour
    }
  }
}

// Get recent visitor logs with filters
export async function getRecentVisitorLogs(options?: {
  limit?: number
  country?: string
  botStatus?: 'human' | 'bot' | 'suspicious' | 'all'
}): Promise<VisitorLog[]> {
  const logs = await loadVisitorLogs()
  
  let filtered = logs
  
  // Filter by country
  if (options?.country && options.country !== 'all') {
    filtered = filtered.filter(l => l.country === options.country)
  }
  
  // Filter by bot status
  if (options?.botStatus && options.botStatus !== 'all') {
    filtered = filtered.filter(l => l.botStatus === options.botStatus)
  }
  
  // Limit results
  const limit = options?.limit || 100
  return filtered.slice(0, limit)
}

// Get unique countries from logs
export async function getUniqueCountries(): Promise<string[]> {
  const logs = await loadVisitorLogs()
  const countries = new Set(logs.map(l => l.country).filter(c => c && c !== 'Unknown'))
  return Array.from(countries).sort()
}

