#!/usr/bin/env tsx
/**
 * Script to remove console.log statements from production code
 * Keeps console.error in development-only blocks
 */

import * as fs from 'fs/promises'
import * as path from 'path'

const DIRECTORIES_TO_CLEAN = ['app', 'lib', 'components']
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

interface CleanupStats {
  filesProcessed: number
  filesModified: number
  consoleStatementsRemoved: number
  developmentOnlyKept: number
}

async function getAllFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      // Skip node_modules and .next
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        await getAllFiles(fullPath, files)
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (FILE_EXTENSIONS.includes(ext)) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

function cleanConsoleStatements(content: string): { cleaned: string; removedCount: number; keptCount: number } {
  let removedCount = 0
  let keptCount = 0
  let lines = content.split('\n')
  let result: string[] = []
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check if this is a console statement
    const isConsoleLog = /^\s*console\.(log|debug|info|warn)\s*\(/.test(line)
    const isConsoleError = /^\s*console\.error\s*\(/.test(line)
    
    if (isConsoleLog) {
      // Check if we're in a development-only block
      let inDevBlock = false
      
      // Look backwards to see if there's a development check
      for (let j = Math.max(0, i - 5); j < i; j++) {
        if (lines[j].includes("process.env.NODE_ENV === 'development'") ||
            lines[j].includes('process.env.NODE_ENV === "development"')) {
          inDevBlock = true
          break
        }
      }
      
      if (inDevBlock) {
        // Keep it but mark as kept
        result.push(line)
        keptCount++
      } else {
        // Remove the console statement
        // Check if it's a multi-line console statement
        let fullStatement = line
        let j = i
        let parenCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length
        
        while (parenCount > 0 && j < lines.length - 1) {
          j++
          fullStatement += '\n' + lines[j]
          parenCount += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length
        }
        
        // Skip all lines that were part of this statement
        i = j
        removedCount++
        
        // Don't add to result - effectively removing it
        i++
        continue
      }
    } else if (isConsoleError) {
      // Keep console.error but only in development blocks
      // Look backwards to see if there's a development check
      let inDevBlock = false
      for (let j = Math.max(0, i - 5); j < i; j++) {
        if (lines[j].includes("process.env.NODE_ENV === 'development'") ||
            lines[j].includes('process.env.NODE_ENV === "development"')) {
          inDevBlock = true
          break
        }
      }
      
      if (inDevBlock) {
        result.push(line)
        keptCount++
      } else {
        // Remove bare console.error too
        let j = i
        let parenCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length
        
        while (parenCount > 0 && j < lines.length - 1) {
          j++
          parenCount += (lines[j].match(/\(/g) || []).length - (lines[j].match(/\)/g) || []).length
        }
        
        i = j
        removedCount++
        i++
        continue
      }
    } else {
      result.push(line)
    }
    
    i++
  }
  
  return {
    cleaned: result.join('\n'),
    removedCount,
    keptCount
  }
}

async function cleanFile(filePath: string): Promise<{ modified: boolean; removed: number; kept: number }> {
  const content = await fs.readFile(filePath, 'utf-8')
  const { cleaned, removedCount, keptCount } = cleanConsoleStatements(content)
  
  if (removedCount > 0) {
    await fs.writeFile(filePath, cleaned, 'utf-8')
    return { modified: true, removed: removedCount, kept: keptCount }
  }
  
  return { modified: false, removed: 0, kept: keptCount }
}

async function main() {
  console.log('🧹 Starting console.log cleanup...\n')
  
  const stats: CleanupStats = {
    filesProcessed: 0,
    filesModified: 0,
    consoleStatementsRemoved: 0,
    developmentOnlyKept: 0
  }
  
  for (const dir of DIRECTORIES_TO_CLEAN) {
    const dirPath = path.join(process.cwd(), dir)
    
    try {
      await fs.access(dirPath)
    } catch {
      console.log(`⏭️  Skipping ${dir} (not found)`)
      continue
    }
    
    console.log(`📂 Processing ${dir}/...`)
    const files = await getAllFiles(dirPath)
    
    for (const file of files) {
      stats.filesProcessed++
      const result = await cleanFile(file)
      
      if (result.modified) {
        stats.filesModified++
        stats.consoleStatementsRemoved += result.removed
        stats.developmentOnlyKept += result.kept
        
        const relativePath = path.relative(process.cwd(), file)
        console.log(`  ✅ ${relativePath} (removed ${result.removed}, kept ${result.kept})`)
      }
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✨ Cleanup Complete!\n')
  console.log(`📊 Statistics:`)
  console.log(`   Files processed: ${stats.filesProcessed}`)
  console.log(`   Files modified: ${stats.filesModified}`)
  console.log(`   Console statements removed: ${stats.consoleStatementsRemoved}`)
  console.log(`   Development-only statements kept: ${stats.developmentOnlyKept}`)
  console.log('='.repeat(60))
}

main().catch(console.error)

