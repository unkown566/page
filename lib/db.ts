import 'server-only'

/**
 * SQLite Database Connection Handler
 * 
 * Phase 1: Connection setup only. No migrations run automatically.
 * 
 * Usage:
 *   import { getDb } from '@/lib/db'
 *   const db = await getDb()
 *   const rows = await db.all('SELECT * FROM links WHERE id = ?', [linkId])
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Database file path (in project root)
const DB_PATH = path.join(process.cwd(), 'data', 'fox_secure.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Singleton database instance
let dbInstance: Database.Database | null = null

/**
 * Get or create the SQLite database connection
 * 
 * @returns Database instance
 * @throws Error if database cannot be opened
 */
export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance
  }

  try {
    dbInstance = new Database(DB_PATH, {
      // Enable WAL mode for better concurrency
      // This allows multiple readers while one writer is active
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    })

    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON')

    // Enable WAL mode for better concurrency
    dbInstance.pragma('journal_mode = WAL')

    // Set busy timeout to 5 seconds (handles concurrent access)
    dbInstance.pragma('busy_timeout = 5000')

    // PHASE 7.4: Run migrations on first connection
    runMigrations(dbInstance)

    return dbInstance
  } catch (error) {
    throw new Error(`Failed to open database at ${DB_PATH}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Close the database connection
 * 
 * Call this during graceful shutdown (e.g., in Next.js API route cleanup)
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

/**
 * Check if database file exists
 * 
 * @returns true if database file exists, false otherwise
 */
export function dbExists(): boolean {
  return fs.existsSync(DB_PATH)
}

/**
 * Get database file path
 * 
 * @returns Absolute path to database file
 */
export function getDbPath(): string {
  return DB_PATH
}

/**
 * Check if a column exists in a table
 */
function columnExists(db: Database.Database, table: string, column: string): boolean {
  try {
    // SQLite pragma_table_info requires table name as string literal
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM pragma_table_info('${table}')
      WHERE name = ?
    `).get(column) as { count: number } | undefined
    
    return (row?.count || 0) > 0
  } catch {
    return false
  }
}

/**
 * Run database migrations
 * PHASE 7.4: Adds missing columns
 */
function runMigrations(db: Database.Database): void {
  try {
    // Check if links table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='links'
    `).get() !== undefined
    
    if (!tableExists) {
      // Table doesn't exist - will be created by init.sql
      return
    }
    
    // PHASE 7.4: Add link_format column if missing
    if (!columnExists(db, 'links', 'link_format')) {
      console.log('[DB MIGRATION] Adding link_format column to links table...')
      db.exec(`
        ALTER TABLE links
        ADD COLUMN link_format TEXT DEFAULT 'A'
      `)
      console.log('[DB MIGRATION] ✅ link_format column added')
    }
    
    // FIX: Create captcha_sessions table if missing
    const captchaSessionsExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='captcha_sessions'
    `).get() !== undefined
    
    if (!captchaSessionsExists) {
      console.log('[DB MIGRATION] Creating captcha_sessions table...')
      db.exec(`
        CREATE TABLE IF NOT EXISTS captcha_sessions (
          sessionId TEXT PRIMARY KEY,
          ip TEXT NOT NULL,
          userAgent TEXT NOT NULL,
          verifiedAt INTEGER NOT NULL,
          expiresAt INTEGER NOT NULL,
          created_at REAL DEFAULT (julianday('now'))
        )
      `)
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_captcha_sessions_expires ON captcha_sessions(expiresAt)
      `)
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_captcha_sessions_ip ON captcha_sessions(ip)
      `)
      console.log('[DB MIGRATION] ✅ captcha_sessions table created')
    }
  } catch (error) {
    console.error('[DB MIGRATION] Error:', error)
    // Don't throw - allow app to continue even if migration fails
  }
}

/**
 * Execute a transaction
 * 
 * Wraps multiple operations in BEGIN IMMEDIATE ... COMMIT
 * 
 * @param callback Function that receives the database instance and performs operations
 * @returns Return value of callback
 * @throws Error if transaction fails (automatically rolls back)
 */
export async function transaction<T>(callback: (db: Database.Database) => T): Promise<T> {
  const db = getDb()
  
  try {
    db.exec('BEGIN IMMEDIATE')
    const result = callback(db)
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}



