/**
 * Database Migrations
 * 
 * PHASE 7.4: Add missing columns and ensure schema is up to date
 */

import { getDb } from './db'

/**
 * Check if a column exists in a table
 */
function columnExists(tableName: string, columnName: string): boolean {
  const db = getDb()
  try {
    // SQLite pragma_table_info requires table name as string literal, not parameter
    // So we use string interpolation (safe because tableName is from our code)
    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('${tableName}') 
      WHERE name = ?
    `).get(columnName) as { count: number } | undefined
    
    return (result?.count || 0) > 0
  } catch {
    return false
  }
}

/**
 * Run all pending migrations
 * 
 * PHASE 7.4: Adds link_format column if missing
 */
export function runMigrations(): void {
  const db = getDb()
  
  try {
    // Check if links table exists first
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='links'
    `).get() !== undefined
    
    if (!tableExists) {
      // Table doesn't exist - will be created by init.sql
      return
    }
    
    // PHASE 7.4: Add link_format column to links table if missing
    if (!columnExists('links', 'link_format')) {
      console.log('[MIGRATION] Adding link_format column to links table...')
      db.exec(`
        ALTER TABLE links 
        ADD COLUMN link_format TEXT NOT NULL DEFAULT 'C'
      `)
      console.log('[MIGRATION] ✅ link_format column added')
    }
  } catch (error) {
    console.error('[MIGRATION] Error running migrations:', error)
    // Don't throw - allow app to continue even if migration fails
  }
}

/**
 * Initialize database with migrations
 * Call this once when the app starts
 */
export function initializeDatabase(): void {
  runMigrations()
}

