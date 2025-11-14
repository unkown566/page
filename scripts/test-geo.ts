/**
 * Test geolocation with various IP addresses
 * Tests localhost handling and real IP geolocation
 */

import { getGeoData } from '../lib/geoLocation'

async function testGeo() {
  console.log('🧪 Testing Geolocation\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const testIPs = [
    { ip: '127.0.0.1', description: 'IPv4 localhost' },
    { ip: '::1', description: 'IPv6 localhost' },
    { ip: '::ffff:127.0.0.1', description: 'IPv6-mapped IPv4 localhost' },
    { ip: '192.168.1.1', description: 'Private network IP' },
    { ip: '10.0.0.1', description: 'Private network IP' },
    { ip: '8.8.8.8', description: 'Google DNS (USA)' },
    { ip: '1.1.1.1', description: 'Cloudflare DNS (USA)' },
    { ip: '45.76.176.1', description: 'Japan test IP' },
    { ip: '94.23.166.1', description: 'France test IP' },
  ]
  
  for (const { ip, description } of testIPs) {
    console.log(`🌍 Testing: ${ip} (${description})`)
    try {
      const geo = await getGeoData(ip)
      console.log(`   ✅ Country: ${geo.country}`)
      console.log(`   ✅ City: ${geo.city}`)
      if (geo.countryCode) {
        console.log(`   ✅ Country Code: ${geo.countryCode}`)
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    console.log()
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n✅ Geolocation test complete!')
  console.log('\nExpected results:')
  console.log('  - Localhost IPs → "Local / Development"')
  console.log('  - Private IPs → "Local / Development"')
  console.log('  - Public IPs → Real country/city from ipapi.co')
}

testGeo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })




