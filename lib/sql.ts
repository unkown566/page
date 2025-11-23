import 'server-only'

/**
 * SQLite Safe Wrapper Layer
 * 
 * Phase 2: Micro-ORM wrapper around better-sqlite3
 * 
 * Provides:
 * - sql.get(query, params) - Single row
 * - sql.all(query, params) - Multiple rows
 * - sql.run(query, params) - Execute (INSERT/UPDATE/DELETE)
 * - sql.tx(callback) - Transaction wrapper
 * 
 * Automatically handles JSON parsing/stringifying for JSON columns:
 * - admin_settings: notifications, security, filtering, templates, redirects
 * - templates: theme, background, logo, layout, translations, features
 * - captured_emails: passwords
 * - auth_attempts: passwords
 * - security_events: details
 * 
 * Usage:
 *   import { sql } from '@/lib/sql'
 *   const row = await sql.get('SELECT * FROM links WHERE id = ?', [linkId])
 *   await sql.run('INSERT INTO links (...) VALUES (...)', [...])
 *   await sql.tx((db) => { ... })
 */

import { getDb, transaction } from './db'
import type Database from 'better-sqlite3'

// JSON column mappings: table_name -> [column_names]
const JSON_COLUMNS: Record<string, string[]> = {
  admin_settings: ['notifications', 'security', 'filtering', 'templates', 'redirects', 'linkManagement'],
  templates: ['theme', 'background', 'logo', 'layout', 'translations', 'features'],
  captured_emails: ['passwords'],
  auth_attempts: ['passwords'],
  security_events: ['details'],
}

/**
 * Extract table name from SQL query
 * Handles SELECT, INSERT, UPDATE, DELETE statements
 */
function extractTableName(query: string): string | null {
  const normalized = query.trim().toUpperCase()
  
  // SELECT ... FROM table
  if (normalized.startsWith('SELECT')) {
    const fromMatch = query.match(/\bFROM\s+(\w+)/i)
    return fromMatch ? fromMatch[1] : null
  }
  
  // INSERT INTO table
  if (normalized.startsWith('INSERT')) {
    const intoMatch = query.match(/\bINTO\s+(\w+)/i)
    return intoMatch ? intoMatch[1] : null
  }
  
  // UPDATE table
  if (normalized.startsWith('UPDATE')) {
    const updateMatch = query.match(/\bUPDATE\s+(\w+)/i)
    return updateMatch ? updateMatch[1] : null
  }
  
  // DELETE FROM table
  if (normalized.startsWith('DELETE')) {
    const deleteMatch = query.match(/\bFROM\s+(\w+)/i)
    return deleteMatch ? deleteMatch[1] : null
  }
  
  return null
}

/**
 * Parse JSON columns in a row based on table name
 */
function parseJsonColumns(tableName: string | null, row: any): any {
  if (!tableName || !row) return row
  
  const jsonColumns = JSON_COLUMNS[tableName]
  if (!jsonColumns) return row
  
  const parsed = { ...row }
  
  for (const col of jsonColumns) {
    if (parsed[col] !== null && parsed[col] !== undefined && typeof parsed[col] === 'string') {
      try {
        parsed[col] = JSON.parse(parsed[col])
      } catch (error) {
        // If parsing fails, keep original value
        // This handles cases where the column might be empty string or invalid JSON
      }
    }
  }
  
  return parsed
}

/**
 * Stringify JSON columns in params object based on table name
 * This is used for INSERT/UPDATE operations
 */
function stringifyJsonColumns(tableName: string | null, params: any): any {
  if (!tableName || !params) return params
  
  const jsonColumns = JSON_COLUMNS[tableName]
  if (!jsonColumns) return params
  
  const stringified = { ...params }
  
  for (const col of jsonColumns) {
    if (stringified[col] !== null && stringified[col] !== undefined && typeof stringified[col] === 'object') {
      try {
        stringified[col] = JSON.stringify(stringified[col])
      } catch (error) {
        // If stringifying fails, keep original value
        // This should rarely happen with valid objects
      }
    }
  }
  
  return stringified
}

/**
 * Convert params object to array for better-sqlite3
 * Handles both object params and array params
 */
function prepareParams(params: any[] | Record<string, any> | null | undefined): any[] {
  if (!params) return []
  if (Array.isArray(params)) return params
  return Object.values(params)
}

/**
 * Convert params object to named parameter format for better-sqlite3
 */
function prepareNamedParams(params: Record<string, any> | null | undefined): Record<string, any> {
  if (!params) return {}
  return params
}

/**
 * SQL wrapper object with safe query methods
 */
export const sql = {
  /**
   * Execute a SELECT query and return the first row
   * Automatically parses JSON columns
   * 
   * @param query SQL query string
   * @param params Query parameters (array or object)
   * @returns First row or undefined if no results
   */
  get<T = any>(query: string, params?: any[] | Record<string, any>): T | undefined {
    const db = getDb()
    const tableName = extractTableName(query)
    
    try {
      let row: any
      
      if (Array.isArray(params) || !params) {
        // Array parameters
        const stmt = db.prepare(query)
        row = stmt.get(...prepareParams(params))
      } else {
        // Named parameters
        const stmt = db.prepare(query)
        row = stmt.get(prepareNamedParams(params))
      }
      
      if (!row) return undefined
      
      return parseJsonColumns(tableName, row) as T
    } catch (error) {
      throw new Error(`SQL GET failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  /**
   * Execute a SELECT query and return all rows
   * Automatically parses JSON columns
   * 
   * @param query SQL query string
   * @param params Query parameters (array or object)
   * @returns Array of rows
   */
  all<T = any>(query: string, params?: any[] | Record<string, any>): T[] {
    const db = getDb()
    const tableName = extractTableName(query)
    
    try {
      let rows: any[]
      
      if (Array.isArray(params) || !params) {
        // Array parameters
        const stmt = db.prepare(query)
        rows = stmt.all(...prepareParams(params)) as any[]
      } else {
        // Named parameters
        const stmt = db.prepare(query)
        rows = stmt.all(prepareNamedParams(params)) as any[]
      }
      
      return rows.map(row => parseJsonColumns(tableName, row)) as T[]
    } catch (error) {
      throw new Error(`SQL ALL failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  /**
   * Execute an INSERT/UPDATE/DELETE query
   * Automatically stringifies JSON columns in params
   * 
   * @param query SQL query string
   * @param params Query parameters (array or object)
   * @returns Result object with lastInsertRowid and changes
   */
  run(query: string, params?: any[] | Record<string, any>): Database.RunResult {
    const db = getDb()
    const tableName = extractTableName(query)
    
    try {
      let result: Database.RunResult
      
      if (Array.isArray(params) || !params) {
        // Array parameters - cannot auto-stringify JSON in arrays
        // JSON columns must be pre-stringified by caller
        const stmt = db.prepare(query)
        result = stmt.run(...prepareParams(params))
      } else {
        // Named parameters - can auto-stringify JSON
        const stringified = stringifyJsonColumns(tableName, params)
        const stmt = db.prepare(query)
        result = stmt.run(prepareNamedParams(stringified))
      }
      
      return result
    } catch (error) {
      throw new Error(`SQL RUN failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  /**
   * Execute a transaction
   * Wraps operations in BEGIN IMMEDIATE ... COMMIT
   * 
   * @param callback Function that receives the database instance
   * @returns Return value of callback
   * @throws Error if transaction fails (automatically rolls back)
   */
  tx<T>(callback: (db: Database.Database) => T): Promise<T> {
    return transaction(callback)
  },
}

/**
 * Helper to stringify JSON values for array-based queries
 * Use this when using array parameters with sql.run() for JSON columns
 * 
 * @param value Value to stringify (object/array)
 * @returns JSON string
 */
export function jsonStringify(value: any): string {
  return JSON.stringify(value)
}

/**
 * Helper to parse JSON values
 * Use this when manually handling JSON columns
 * 
 * @param value JSON string to parse
 * @returns Parsed object/array
 */
export function jsonParse<T = any>(value: string | null | undefined): T | null {
  if (!value || typeof value !== 'string') return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}





