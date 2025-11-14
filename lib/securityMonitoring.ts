/**
 * Security Event Monitoring and Logging
 * Tracks security events for analysis and alerting
 */

export type SecurityEventType = 
  | 'bot_detected'
  | 'token_invalid'
  | 'rate_limit'
  | 'anomaly'
  | 'replay_attack'
  | 'honeypot_triggered'
  | 'ip_banned'
  | 'suspicious_behavior'
  | 'stealth_verification_failed'

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  type: SecurityEventType
  ip: string
  fingerprint?: string
  severity: SecurityEventSeverity
  timestamp: number
  details: Record<string, any>
  userAgent?: string
}

// In-memory event log (use proper logging service in production)
const eventLog: SecurityEvent[] = []
const MAX_LOG_SIZE = 1000

/**
 * Log a security event
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now(),
  }
  
  // Add to log
  eventLog.push(fullEvent)
  
  // Keep log size manageable
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.shift()
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = getSeverityEmoji(event.severity)
    console.log(`${emoji} [Security Event] ${event.type}:`, {
      ip: event.ip,
      severity: event.severity,
      details: event.details,
    })
  }
  
  // In production, send to monitoring service
  // await sendToMonitoringService(fullEvent)
  
  // Alert on critical events
  if (event.severity === 'critical') {
    // await sendAlert(fullEvent)
  }
}

/**
 * Get severity emoji for logging
 */
function getSeverityEmoji(severity: SecurityEventSeverity): string {
  switch (severity) {
    case 'low': return '🔵'
    case 'medium': return '🟡'
    case 'high': return '🟠'
    case 'critical': return '🔴'
    default: return '⚪'
  }
}

/**
 * Get recent security events
 */
export function getRecentEvents(
  type?: SecurityEventType,
  limit: number = 100
): SecurityEvent[] {
  let events = eventLog
  
  if (type) {
    events = events.filter(e => e.type === type)
  }
  
  return events.slice(-limit)
}

/**
 * Get event statistics
 */
export function getEventStats(timeWindow: number = 3600000): {
  total: number
  byType: Record<SecurityEventType, number>
  bySeverity: Record<SecurityEventSeverity, number>
} {
  const now = Date.now()
  const recentEvents = eventLog.filter(e => now - e.timestamp < timeWindow)
  
  const byType: Record<SecurityEventType, number> = {
    bot_detected: 0,
    token_invalid: 0,
    rate_limit: 0,
    anomaly: 0,
    replay_attack: 0,
    honeypot_triggered: 0,
    ip_banned: 0,
    suspicious_behavior: 0,
    stealth_verification_failed: 0,
  }
  
  const bySeverity: Record<SecurityEventSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }
  
  recentEvents.forEach(event => {
    byType[event.type] = (byType[event.type] || 0) + 1
    bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
  })
  
  return {
    total: recentEvents.length,
    byType,
    bySeverity,
  }
}

