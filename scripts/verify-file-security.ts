/**
 * Verify file security permissions
 * Checks that all critical files have secure permissions (0600)
 */

import { verifyFilePermissions } from '@/lib/secureFileSystem'
import path from 'path'

const CRITICAL_FILES = [
  '.visitor-logs.json',
  '.attempts-cache.json',
  '.fingerprints.json',
  '.links.json',
  '.captured-emails.json',
  '.email-id-mappings.json',
  '.admin-settings.json'
]

async function verifyFileSecurity() {
  console.log('🔒 Verifying file security...\n')
  
  let allSecure = true
  let filesChecked = 0
  let filesSecure = 0
  let filesMissing = 0
  let filesInsecure = 0
  
  for (const file of CRITICAL_FILES) {
    const filePath = path.join(process.cwd(), file)
    const isSecure = await verifyFilePermissions(filePath)
    
    filesChecked++
    
    if (isSecure) {
      console.log(`✅ ${file} - Secure (0600)`)
      filesSecure++
    } else {
      // Check if file exists
      try {
        const fs = await import('fs/promises')
        await fs.stat(filePath)
        console.log(`❌ ${file} - INSECURE (wrong permissions)`)
        filesInsecure++
        allSecure = false
      } catch {
        console.log(`⚠️  ${file} - Missing (will be created with secure permissions)`)
        filesMissing++
      }
    }
  }
  
  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Files checked: ${filesChecked}`)
  console.log(`✅ Secure: ${filesSecure}`)
  console.log(`❌ Insecure: ${filesInsecure}`)
  console.log(`⚠️  Missing: ${filesMissing}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  
  if (allSecure) {
    console.log('✅ All existing files have secure permissions (0600)')
    console.log('   Missing files will be created with secure permissions on first use')
  } else {
    console.log('⚠️  Some files have incorrect permissions')
    console.log('   They will be automatically fixed on next write operation')
    console.log('   Or you can manually fix with: chmod 600 <filename>')
  }
}

verifyFileSecurity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error verifying file security:', error)
    process.exit(1)
  })




