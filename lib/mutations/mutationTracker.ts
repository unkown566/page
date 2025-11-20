/**
 * Mutation Tracker
 * Phase 5.8: Track mutation keys per visitor for polymorphic cloaking
 */

import { sql } from '../sql'
import { randomUUID } from 'crypto'

export interface MutationRecord {
  id: string
  user_agent: string | null
  ip: string | null
  mutation_key: string
  created_at: number
  last_used_at: number
}

/**
 * Generate mutation key from IP and User-Agent
 */
function generateMutationKey(ip: string, userAgent: string): string {
  // Create deterministic hash from IP + UA
  const input = `${ip}|${userAgent}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash = hash & hash
  }
  
  // Convert to base36 string
  const hashStr = Math.abs(hash).toString(36)
  
  // Add random component for uniqueness
  const random = Math.random().toString(36).substring(2, 10)
  
  return `${hashStr}_${random}`
}

/**
 * Generate new random mutation key (for sandboxes/scanners)
 */
function generateRandomMutationKey(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `mut_${timestamp}_${random}`
}

/**
 * Get or create mutation key for visitor
 * Returning humans get same key, sandboxes/scanners get new ones
 */
export async function getOrCreateMutation(
  ip: string,
  userAgent: string,
  isSandbox: boolean = false,
  isScanner: boolean = false
): Promise<string> {
  // For sandboxes/scanners, always generate new mutation key
  if (isSandbox || isScanner) {
    const newKey = generateRandomMutationKey()
    await storeMutationKey(newKey, ip, userAgent)
    return newKey
  }
  
  // For humans, try to find existing mutation
  const existing = sql.get<MutationRecord>(
    `SELECT * FROM mutations 
     WHERE ip = ? AND user_agent = ? 
     ORDER BY last_used_at DESC 
     LIMIT 1`,
    [ip, userAgent]
  )
  
  if (existing) {
    // Update last_used_at
    sql.run(
      `UPDATE mutations SET last_used_at = ? WHERE id = ?`,
      [Math.floor(Date.now() / 1000), existing.id]
    )
    return existing.mutation_key
  }
  
  // Create new mutation for human
  const mutationKey = generateMutationKey(ip, userAgent)
  await storeMutationKey(mutationKey, ip, userAgent)
  return mutationKey
}

/**
 * Store mutation key in database
 */
export async function storeMutationKey(
  mutationKey: string,
  ip: string,
  userAgent: string
): Promise<void> {
  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)
  
  sql.run(
    `INSERT INTO mutations (id, user_agent, ip, mutation_key, created_at, last_used_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(mutation_key) DO UPDATE SET
       last_used_at = excluded.last_used_at`,
    [id, userAgent, ip, mutationKey, now, now]
  )
}

/**
 * Resolve mutation key from request
 */
export async function resolveMutation(
  request: Request,
  isSandbox: boolean = false,
  isScanner: boolean = false
): Promise<string> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return await getOrCreateMutation(ip, userAgent, isSandbox, isScanner)
}

/**
 * Get mutation key by key string
 */
export function getMutationByKey(mutationKey: string): MutationRecord | null {
  const result = sql.get<MutationRecord>(
    `SELECT * FROM mutations WHERE mutation_key = ? LIMIT 1`,
    [mutationKey]
  )
  return result || null
}

/**
 * Clean up old mutations (older than 30 days)
 */
export function cleanupOldMutations(): void {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
  
  sql.run(
    `DELETE FROM mutations WHERE created_at < ?`,
    [thirtyDaysAgo]
  )
}

