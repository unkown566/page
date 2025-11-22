// Secure file system utilities with locking and restricted permissions
import 'server-only'

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Secure file permissions: 0600 (read/write owner only)
const SECURE_FILE_MODE = 0o600

// File lock management
const fileLocks = new Map<string, Promise<void>>()

/**
 * Acquire exclusive lock for file operation
 */
async function acquireLock(filePath: string): Promise<() => void> {
  while (fileLocks.has(filePath)) {
    await fileLocks.get(filePath)
  }
  
  let releaseLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve
  })
  
  fileLocks.set(filePath, lockPromise)
  
  return () => {
    fileLocks.delete(filePath)
    releaseLock!()
  }
}

/**
 * Securely read JSON file with exclusive lock
 */
export async function secureReadJSON<T>(filePath: string, defaultValue: T): Promise<T> {
  const release = await acquireLock(filePath)
  
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(data)
    // Ensure it's the expected type
    return Array.isArray(parsed) && Array.isArray(defaultValue) ? parsed as T :
           typeof parsed === 'object' && typeof defaultValue === 'object' ? parsed as T :
           defaultValue
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return defaultValue
    }
    throw error
  } finally {
    release()
  }
}

/**
 * Securely write JSON file with exclusive lock and restricted permissions
 */
export async function secureWriteJSON(filePath: string, data: any): Promise<void> {
  const release = await acquireLock(filePath)
  
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath)
    console.log('[FILE I/O] 📁 Creating directory:', dir)
    await fs.mkdir(dir, { recursive: true, mode: 0o700 })
    
    // Write to temporary file first (atomic operation)
    const tempPath = `${filePath}.tmp.${crypto.randomBytes(8).toString('hex')}`
    console.log('[FILE I/O] ✍️  Writing to temp file:', tempPath)
    console.log('[FILE I/O] 📊 Data size:', JSON.stringify(data).length, 'bytes')
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE
    })
    console.log('[FILE I/O] ✅ Temp file written')
    
    // Atomic rename
    console.log('[FILE I/O] 🔄 Renaming:', tempPath, '→', filePath)
    await fs.rename(tempPath, filePath)
    console.log('[FILE I/O] ✅ File renamed successfully')
    
    // Ensure permissions are correct (in case file existed)
    await fs.chmod(filePath, SECURE_FILE_MODE)
    console.log('[FILE I/O] 🔐 Permissions set to 0600')
    
  } catch (error) {
    console.error('[FILE I/O] ❌ Write error:', error instanceof Error ? error.message : String(error))
    // Clean up temp file if it exists
    try {
      const files = await fs.readdir(path.dirname(filePath))
      for (const file of files) {
        if (file.startsWith(path.basename(filePath) + '.tmp.')) {
          await fs.unlink(path.join(path.dirname(filePath), file)).catch(() => {})
        }
      }
    } catch {}
    throw error
  } finally {
    release()
  }
}

/**
 * Securely update JSON file (read-modify-write with lock)
 */
export async function secureUpdateJSON<T>(
  filePath: string,
  defaultValue: T,
  updater: (data: T) => T
): Promise<T> {
  const release = await acquireLock(filePath)
  
  try {
    // Read current data
    let data: T
    try {
      const fileData = await fs.readFile(filePath, 'utf-8')
      // Handle empty or whitespace-only files
      const trimmed = fileData.trim()
      if (!trimmed) {
        data = defaultValue
      } else {
        const parsed = JSON.parse(trimmed)
        data = parsed as T
      }
    } catch (error: any) {
      // File doesn't exist OR JSON parse error (empty/corrupted file) -> use default
      if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        data = defaultValue
      } else {
        throw error
      }
    }
    
    // Apply update
    const updatedData = updater(data)
    
    // Write atomically
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true, mode: 0o700 })
    
    const tempPath = `${filePath}.tmp.${crypto.randomBytes(8).toString('hex')}`
    await fs.writeFile(tempPath, JSON.stringify(updatedData, null, 2), {
      encoding: 'utf-8',
      mode: SECURE_FILE_MODE
    })
    
    await fs.rename(tempPath, filePath)
    await fs.chmod(filePath, SECURE_FILE_MODE)
    
    return updatedData
    
  } finally {
    release()
  }
}

/**
 * Verify file permissions
 */
export async function verifyFilePermissions(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath)
    const mode = stats.mode & 0o777
    return mode === SECURE_FILE_MODE
  } catch {
    return false
  }
}

