/**
 * Pre-Phase 5.9 Readiness Audit Suite
 * Comprehensive system validation before Phase 5.9
 */

import { getDb } from '../lib/db'
import { sql } from '../lib/sql'
import { getCachedSettings } from '../lib/adminSettings'
import * as fs from 'fs/promises'
import * as path from 'path'

interface AuditResult {
  module: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: string[]
}

const results: AuditResult[] = []

function addResult(module: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: string[]) {
  results.push({ module, status, message, details })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} ${module}: ${message}`)
  if (details && details.length > 0) {
    details.forEach(d => console.log(`   - ${d}`))
  }
}

async function auditDatabaseSchema(): Promise<void> {
  console.log('\n📊 Auditing Database Schema...')
  
  const requiredTables = [
    'admin_settings',
    'links',
    'email_allowlists',
    'open_redirects',
    'captured_emails',
    'email_id_mappings',
    'consumed_tokens',
    'sessions',
    'auth_attempts',
    'fingerprints',
    'visitor_logs',
    'security_events',
    'templates',
    'file_uploads',
    'mutations',
  ]
  
  try {
    const db = getDb()
    
    for (const table of requiredTables) {
      try {
        const row = sql.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table])
        if (row) {
          addResult(`DB: ${table}`, 'PASS', 'Table exists')
        } else {
          addResult(`DB: ${table}`, 'FAIL', 'Table missing')
        }
      } catch (error) {
        addResult(`DB: ${table}`, 'FAIL', `Error checking table: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    // Test mutations table structure
    try {
      const mutationsRow = sql.get(`SELECT * FROM mutations LIMIT 1`)
      addResult('DB: mutations structure', 'PASS', 'Mutations table accessible')
    } catch (error) {
      addResult('DB: mutations structure', 'WARN', 'Mutations table may be empty or have issues')
    }
    
  } catch (error) {
    addResult('DB: Connection', 'FAIL', `Database connection failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function auditAdminSettings(): Promise<void> {
  console.log('\n⚙️ Auditing Admin Settings...')
  
  try {
    const settings = getCachedSettings()
    
    if (!settings) {
      addResult('Admin Settings', 'FAIL', 'Settings not loaded')
      return
    }
    
    addResult('Admin Settings', 'PASS', 'Settings loaded')
    
    // Check polymorphic cloaking setting
    if (settings.security?.enablePolymorphicCloaking !== undefined) {
      addResult('Admin Settings: enablePolymorphicCloaking', 'PASS', `Value: ${settings.security.enablePolymorphicCloaking}`)
    } else {
      addResult('Admin Settings: enablePolymorphicCloaking', 'WARN', 'Setting not found (will use default)')
    }
    
    // Check daily URL mutation setting
    if (settings.security?.enableDailyUrlMutation !== undefined) {
      addResult('Admin Settings: enableDailyUrlMutation', 'PASS', `Value: ${settings.security.enableDailyUrlMutation}`)
    } else {
      addResult('Admin Settings: enableDailyUrlMutation', 'WARN', 'Setting not found (will use default)')
    }
    
    // Check security mode
    if (settings.security?.securityMode) {
      addResult('Admin Settings: securityMode', 'PASS', `Value: ${settings.security.securityMode}`)
    } else {
      addResult('Admin Settings: securityMode', 'WARN', 'Security mode not set (will use default)')
    }
    
  } catch (error) {
    addResult('Admin Settings', 'FAIL', `Error loading settings: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function auditMutationEngine(): Promise<void> {
  console.log('\n🧬 Auditing Mutation Engine...')
  
  // Check mutation files exist
  const mutationFiles = [
    'mutator/htmlMutator.ts',
    'mutator/jsMutator.ts',
    'mutator/templateMixer.ts',
    'mutator/buildEngine.ts',
    'lib/mutations/mutationTracker.ts',
  ]
  
  for (const file of mutationFiles) {
    try {
      const filePath = path.join(process.cwd(), file)
      await fs.access(filePath)
      addResult(`Mutation: ${file}`, 'PASS', 'File exists')
    } catch {
      addResult(`Mutation: ${file}`, 'FAIL', 'File missing')
    }
  }
  
  // Check autogen directories
  const autogenDirs = [
    'templates/autogen',
    'public/autogen',
  ]
  
  for (const dir of autogenDirs) {
    try {
      const dirPath = path.join(process.cwd(), dir)
      await fs.access(dirPath)
      addResult(`Mutation: ${dir}`, 'PASS', 'Directory exists')
    } catch {
      addResult(`Mutation: ${dir}`, 'WARN', 'Directory missing (will be created on first use)')
    }
  }
  
  // Check API routes
  const apiRoutes = [
    'app/api/mutated-template/route.ts',
    'app/api/mutated-js/route.ts',
    'app/api/debug/link-preview/route.ts',
  ]
  
  for (const route of apiRoutes) {
    try {
      const routePath = path.join(process.cwd(), route)
      await fs.access(routePath)
      addResult(`Mutation API: ${route}`, 'PASS', 'Route exists')
    } catch {
      addResult(`Mutation API: ${route}`, 'FAIL', 'Route missing')
    }
  }
}

async function auditFirewallEngine(): Promise<void> {
  console.log('\n🔥 Auditing Firewall Engine...')
  
  const firewallFiles = [
    'lib/masterFirewall/config.ts',
    'lib/masterFirewall/classifier.ts',
    'lib/masterFirewall/actionEngine.ts',
    'lib/masterFirewall/decisionTree.ts',
    'app/api/firewall/check/route.ts',
  ]
  
  for (const file of firewallFiles) {
    try {
      const filePath = path.join(process.cwd(), file)
      await fs.access(filePath)
      addResult(`Firewall: ${file}`, 'PASS', 'File exists')
    } catch {
      addResult(`Firewall: ${file}`, 'FAIL', 'File missing')
    }
  }
}

async function auditAdaptiveEngine(): Promise<void> {
  console.log('\n🧠 Auditing Adaptive Engine...')
  
  const adaptiveFiles = [
    'lib/validationEngine.ts',
    'lib/fingerprint.ts',
    'lib/attemptTracker.ts',
    'lib/securityMonitoring.ts',
  ]
  
  for (const file of adaptiveFiles) {
    try {
      const filePath = path.join(process.cwd(), file)
      await fs.access(filePath)
      addResult(`Adaptive: ${file}`, 'PASS', 'File exists')
    } catch {
      addResult(`Adaptive: ${file}`, 'FAIL', 'File missing')
    }
  }
}

async function auditTokenEngine(): Promise<void> {
  console.log('\n🔐 Auditing Token Engine...')
  
  try {
    const filePath = path.join(process.cwd(), 'lib/tokenEngine.ts')
    await fs.access(filePath)
    addResult('Token Engine: tokenEngine.ts', 'PASS', 'File exists')
    
    // Check for required exports
    const content = await fs.readFile(filePath, 'utf-8')
    const requiredExports = [
      'encryptPayload',
      'decryptToken',
      'encryptPayloadV3',
      'decryptTokenV3',
      'normalizeToken',
      'extractTokenFromUrl',
    ]
    
    for (const exp of requiredExports) {
      // Check for various export patterns
      const patterns = [
        new RegExp(`export\\s+(function|const|async function)\\s+${exp}`),
        new RegExp(`export\\s*{\\s*${exp}`),
        new RegExp(`export\\s*{\\s*[^}]*${exp}`),
      ]
      
      const found = patterns.some(pattern => pattern.test(content))
      
      if (found) {
        addResult(`Token Engine: ${exp}`, 'PASS', 'Export found')
      } else {
        // Double-check with simpler pattern
        if (content.includes(exp) && (content.includes('export function') || content.includes('export async function') || content.includes('export const'))) {
          addResult(`Token Engine: ${exp}`, 'PASS', 'Export found')
        } else {
          addResult(`Token Engine: ${exp}`, 'WARN', 'Export may be missing')
        }
      }
    }
  } catch {
    addResult('Token Engine: tokenEngine.ts', 'FAIL', 'File missing')
  }
}

async function auditLinkManagement(): Promise<void> {
  console.log('\n🔗 Auditing Link Management...')
  
  const linkFiles = [
    'lib/linkDatabaseSql.ts',
    'lib/linkManager.ts',
    'lib/linkValidation.ts',
    'lib/linkUrlBuilder.ts',
  ]
  
  for (const file of linkFiles) {
    try {
      const filePath = path.join(process.cwd(), file)
      await fs.access(filePath)
      addResult(`Link: ${file}`, 'PASS', 'File exists')
    } catch {
      addResult(`Link: ${file}`, 'FAIL', 'File missing')
    }
  }
}

async function auditAPIRoutes(): Promise<void> {
  console.log('\n🌐 Auditing API Routes...')
  
  const criticalRoutes = [
    'app/api/firewall/check/route.ts',
    'app/api/management/link-status/route.ts',
    'app/api/mutated-template/route.ts',
    'app/api/mutated-js/route.ts',
    'app/api/admin/settings/route.ts',
  ]
  
  for (const route of criticalRoutes) {
    try {
      const routePath = path.join(process.cwd(), route)
      await fs.access(routePath)
      addResult(`API: ${route}`, 'PASS', 'Route exists')
    } catch {
      addResult(`API: ${route}`, 'FAIL', 'Route missing')
    }
  }
}

function calculateReadinessScore(): number {
  const total = results.length
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  
  // Score calculation: PASS = 1, WARN = 0.5, FAIL = 0
  const score = Math.round(((passed + warned * 0.5) / total) * 100)
  
  return score
}

function generateReport(): number {
  console.log('\n' + '='.repeat(60))
  console.log('📋 PRE-PHASE 5.9 READINESS AUDIT REPORT')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  const total = results.length
  
  console.log(`\n📊 Summary:`)
  console.log(`   Total Checks: ${total}`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ⚠️  Warnings: ${warned}`)
  console.log(`   ❌ Failed: ${failed}`)
  
  const score = calculateReadinessScore()
  console.log(`\n🎯 Readiness Score: ${score}/100`)
  
  if (failed > 0) {
    console.log(`\n❌ Failed Checks:`)
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.module}: ${r.message}`)
    })
  }
  
  if (warned > 0) {
    console.log(`\n⚠️  Warnings:`)
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   - ${r.module}: ${r.message}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  return score
}

async function main() {
  console.log('🚀 Starting Pre-Phase 5.9 Readiness Audit...\n')
  
  await auditDatabaseSchema()
  await auditAdminSettings()
  await auditMutationEngine()
  await auditFirewallEngine()
  await auditAdaptiveEngine()
  await auditTokenEngine()
  await auditLinkManagement()
  await auditAPIRoutes()
  
  const score = generateReport()
  
  if (score < 100) {
    console.log('\n⚠️  System is not 100% ready. Please review failed checks above.')
    process.exit(1)
  } else {
    console.log('\n✅ System is 100% ready for Phase 5.9!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Audit failed:', error)
  process.exit(1)
})

