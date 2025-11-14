#!/usr/bin/env tsx

/**
 * Generate a signed token link for email access (TypeScript version)
 * 
 * Usage:
 *   tsx scripts/generate-token.ts <email> [documentId] [expiresInMinutes]
 * 
 * Example:
 *   tsx scripts/generate-token.ts user@example.com doc123 30
 */

import crypto from 'crypto'
import { createToken } from '../lib/tokens'

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: tsx scripts/generate-token.ts <email> [documentId] [expiresInMinutes]')
    console.error('Example: tsx scripts/generate-token.ts user@example.com doc123 30')
    process.exit(1)
  }

  const email = args[0]
  const documentId = args[1] || undefined
  const expiresInMinutes = parseInt(args[2]) || 30

  if (!email || !email.includes('@')) {
    console.error('Error: Invalid email address')
    process.exit(1)
  }

  const token = createToken(email, documentId, expiresInMinutes)
  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const link = `${baseUrl}/?token=${token}&email=${encodeURIComponent(email)}`

  console.log('\n✅ Token Generated Successfully\n')
  console.log('Email:', email)
  if (documentId) {
    console.log('Document ID:', documentId)
  }
  console.log('Expires in:', expiresInMinutes, 'minutes')
  console.log('\n📋 Token:')
  console.log(token)
  console.log('\n🔗 Full Link:')
  console.log(link)
  console.log('\n📧 Email Format:')
  console.log('---')
  console.log(`Subject: Access Your Secure Documents`)
  console.log(`\nClick the link below to access your secure documents:`)
  console.log(link)
  console.log('\nThis link will expire in', expiresInMinutes, 'minutes.')
  console.log('---\n')
}

main()






