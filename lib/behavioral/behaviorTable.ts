/**
 * Behavioral Events Table Operations
 * Phase 5.9: SQLite operations for behavioral event storage and retrieval
 */

import { sql } from '../sql'
import { randomUUID } from 'crypto'

export interface BehavioralEvent {
  id: string
  ip: string
  user_agent: string
  event_type: string
  score: number
  meta: string | null
  created_at: number
}

export interface BehaviorHistory {
  events: BehavioralEvent[]
  totalScore: number
  eventCount: number
  lastEventAt: number | null
}

/**
 * Store a behavioral event
 */
export async function storeBehaviorEvent(
  ip: string,
  userAgent: string,
  eventType: string,
  score: number,
  meta?: Record<string, any>
): Promise<void> {
  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const metaJson = meta ? JSON.stringify(meta) : null

  sql.run(
    `INSERT INTO behavioral_events (id, ip, user_agent, event_type, score, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, ip, userAgent, eventType, score, metaJson, now]
  )
}

/**
 * Get behavioral history for IP + User-Agent combination
 */
export function getBehaviorHistoryByIpUa(
  ip: string,
  userAgent: string,
  limit: number = 100
): BehavioralEvent[] {
  return sql.all<BehavioralEvent>(
    `SELECT * FROM behavioral_events
     WHERE ip = ? AND user_agent = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [ip, userAgent, limit]
  )
}

/**
 * Get the last behavioral event for IP + User-Agent
 */
export function getLastBehaviorEvent(
  ip: string,
  userAgent: string
): BehavioralEvent | null {
  return sql.get<BehavioralEvent>(
    `SELECT * FROM behavioral_events
     WHERE ip = ? AND user_agent = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [ip, userAgent]
  ) || null
}

/**
 * Aggregate behavior score from history
 */
export function aggregateBehaviorScore(
  history: BehavioralEvent[],
  timeWindowSeconds: number = 300 // 5 minutes default
): number {
  if (history.length === 0) return 0

  const now = Math.floor(Date.now() / 1000)
  const cutoff = now - timeWindowSeconds

  // Filter events within time window
  const recentEvents = history.filter(event => event.created_at >= cutoff)

  // Sum scores
  const totalScore = recentEvents.reduce((sum, event) => sum + event.score, 0)

  return totalScore
}

/**
 * Clean up old behavioral events (older than 30 days)
 */
export function cleanupOldBehaviorEvents(): void {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)

  sql.run(
    `DELETE FROM behavioral_events WHERE created_at < ?`,
    [thirtyDaysAgo]
  )
}

/**
 * Get behavior history with aggregation
 */
export function getBehaviorHistory(
  ip: string,
  userAgent: string,
  timeWindowSeconds: number = 300
): BehaviorHistory {
  const events = getBehaviorHistoryByIpUa(ip, userAgent)
  const totalScore = aggregateBehaviorScore(events, timeWindowSeconds)
  const lastEvent = events.length > 0 ? events[0] : null

  return {
    events,
    totalScore,
    eventCount: events.length,
    lastEventAt: lastEvent?.created_at || null,
  }
}





