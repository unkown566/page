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

// ============================================
// PHASE 3: SQLite Migration Functions
// ============================================
// These functions use SQLite instead of JSON files
// They are NOT exported yet - will be integrated in later phase
// ============================================

/**
 * Log a visit to SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param payload Visitor log data (without id and timestamp - these are auto-generated)
 * @returns Generated visitor log ID
 */
async function logVisitSql(payload: Omit<VisitorLog, 'id' | 'timestamp'>): Promise<string> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    
    // Insert into visitor_logs table
    sql.run(
      `INSERT INTO visitor_logs 
       (id, timestamp, ip, user_agent, country, city, captcha_status, bot_status, 
        fingerprint, link_id, email, layer, layer_passed, session_id, reason)
       VALUES ($id, $timestamp, $ip, $user_agent, $country, $city, $captcha_status, $bot_status,
               $fingerprint, $link_id, $email, $layer, $layer_passed, $session_id, $reason)`,
      {
        id,
        timestamp,
        ip: payload.ip,
        user_agent: payload.userAgent,
        country: payload.country || null,
        city: payload.city || null,
        captcha_status: payload.captchaStatus,
        bot_status: payload.botStatus,
        fingerprint: payload.fingerprint || null,
        link_id: payload.sessionIdentifier || payload.linkToken || null,
        email: payload.email || null,
        layer: payload.layer,
        layer_passed: payload.layerPassed ? 1 : 0,
        session_id: payload.sessionId || null,
        reason: payload.reason || null,
      }
    )
    
    return id
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to log visit to SQLite:', error)
    throw new Error(`Failed to log visit: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get visit by ID from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param id Visitor log ID
 * @returns Visitor log or null if not found
 */
async function getVisitByIdSql(id: string): Promise<VisitorLog | null> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const row = sql.get<{
      id: string
      timestamp: number
      ip: string
      user_agent: string
      country: string | null
      city: string | null
      captcha_status: string
      bot_status: string
      fingerprint: string | null
      link_id: string | null
      email: string | null
      layer: string
      layer_passed: number
      session_id: string | null
      reason: string | null
    }>('SELECT * FROM visitor_logs WHERE id = ?', [id])
    
    if (!row) {
      return null
    }
    
    // Map database row to VisitorLog interface
    const log: VisitorLog = {
      id: row.id,
      timestamp: row.timestamp * 1000, // Convert seconds to milliseconds
      ip: row.ip,
      userAgent: row.user_agent,
      country: row.country || '',
      city: row.city || '',
      captchaStatus: row.captcha_status as VisitorLog['captchaStatus'],
      botStatus: row.bot_status as VisitorLog['botStatus'],
      fingerprint: row.fingerprint || '',
      sessionIdentifier: row.link_id || undefined,
      linkToken: row.link_id || undefined, // Legacy alias
      email: row.email || undefined,
      layer: row.layer as VisitorLog['layer'],
      layerPassed: row.layer_passed === 1,
      sessionId: row.session_id || '',
      reason: row.reason || undefined,
    }
    
    return log
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to get visit from SQLite:', error)
    return null
  }
}

/**
 * Get visits by email from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param email Email address to search for
 * @returns Array of visitor logs for that email
 */
async function getVisitsByEmailSql(email: string): Promise<VisitorLog[]> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const rows = sql.all<{
      id: string
      timestamp: number
      ip: string
      user_agent: string
      country: string | null
      city: string | null
      captcha_status: string
      bot_status: string
      fingerprint: string | null
      link_id: string | null
      email: string | null
      layer: string
      layer_passed: number
      session_id: string | null
      reason: string | null
    }>('SELECT * FROM visitor_logs WHERE email = ? ORDER BY timestamp DESC', [email])
    
    // Map database rows to VisitorLog interface
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp * 1000, // Convert seconds to milliseconds
      ip: row.ip,
      userAgent: row.user_agent,
      country: row.country || '',
      city: row.city || '',
      captchaStatus: row.captcha_status as VisitorLog['captchaStatus'],
      botStatus: row.bot_status as VisitorLog['botStatus'],
      fingerprint: row.fingerprint || '',
      sessionIdentifier: row.link_id || undefined,
      linkToken: row.link_id || undefined, // Legacy alias
      email: row.email || undefined,
      layer: row.layer as VisitorLog['layer'],
      layerPassed: row.layer_passed === 1,
      sessionId: row.session_id || '',
      reason: row.reason || undefined,
    }))
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to get visits by email from SQLite:', error)
    return []
  }
}

/**
 * Get recent visits from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param limit Maximum number of visits to return
 * @returns Array of recent visitor logs
 */
async function getRecentVisitsSql(limit: number = 100): Promise<VisitorLog[]> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const rows = sql.all<{
      id: string
      timestamp: number
      ip: string
      user_agent: string
      country: string | null
      city: string | null
      captcha_status: string
      bot_status: string
      fingerprint: string | null
      link_id: string | null
      email: string | null
      layer: string
      layer_passed: number
      session_id: string | null
      reason: string | null
    }>('SELECT * FROM visitor_logs ORDER BY timestamp DESC LIMIT ?', [limit])
    
    // Map database rows to VisitorLog interface
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp * 1000, // Convert seconds to milliseconds
      ip: row.ip,
      userAgent: row.user_agent,
      country: row.country || '',
      city: row.city || '',
      captchaStatus: row.captcha_status as VisitorLog['captchaStatus'],
      botStatus: row.bot_status as VisitorLog['botStatus'],
      fingerprint: row.fingerprint || '',
      sessionIdentifier: row.link_id || undefined,
      linkToken: row.link_id || undefined, // Legacy alias
      email: row.email || undefined,
      layer: row.layer as VisitorLog['layer'],
      layerPassed: row.layer_passed === 1,
      sessionId: row.session_id || '',
      reason: row.reason || undefined,
    }))
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to get recent visits from SQLite:', error)
    return []
  }
}

/**
 * Delete a visit from SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @param id Visitor log ID to delete
 * @returns true if deleted, false if not found
 */
async function deleteVisitSql(id: string): Promise<boolean> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    // Check if visit exists first
    const existing = await getVisitByIdSql(id)
    if (!existing) {
      return false
    }
    
    // Delete the visit
    const result = sql.run('DELETE FROM visitor_logs WHERE id = ?', [id])
    
    // Return true if a row was deleted
    return result.changes > 0
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to delete visit from SQLite:', error)
    throw new Error(`Failed to delete visit: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Count total visits in SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @returns Total number of visits
 */
async function countVisitsSql(): Promise<number> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const result = sql.get<{ count: number }>('SELECT COUNT(*) as count FROM visitor_logs')
    
    return result?.count || 0
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to count visits from SQLite:', error)
    return 0
  }
}

/**
 * Count bot visits in SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @returns Number of bot visits
 */
async function countBotVisitsSql(): Promise<number> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const result = sql.get<{ count: number }>('SELECT COUNT(*) as count FROM visitor_logs WHERE bot_status = ?', ['bot'])
    
    return result?.count || 0
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to count bot visits from SQLite:', error)
    return 0
  }
}

/**
 * Count valid visits (with email) in SQLite database
 * Phase 3: SQLite version (not yet integrated)
 * 
 * @returns Number of visits with email
 */
async function countValidVisitsSql(): Promise<number> {
  try {
    // Dynamically import sql to avoid breaking Edge Runtime
    const { sql } = await import('./sql')
    
    const result = sql.get<{ count: number }>('SELECT COUNT(*) as count FROM visitor_logs WHERE email IS NOT NULL')
    
    return result?.count || 0
  } catch (error) {
    console.error('[VISITOR TRACKER SQL] Failed to count valid visits from SQLite:', error)
    return 0
  }
}

