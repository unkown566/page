#!/usr/bin/env node

/**
 * Generate a test token for local development
 * 
 * Usage: node scripts/test-token.js [email] [documentId] [expiresInMinutes]
 * 
 * Example: node scripts/test-token.js test@example.com doc123 60
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load TOKEN_SECRET from .env.local
function loadEnvVar(key) {
  // Try .env.local first
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (match) {
      return match[1].trim();
    }
  }

  // Try .env as fallback
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (match) {
      return match[1].trim();
    }
  }

  // Return default if not found
  return null;
}

const TOKEN_SECRET = loadEnvVar('TOKEN_SECRET') || 'default-secret-change-in-production';

function createToken(data, expiresInMinutes = 60) {
  const payload = {
    ...data,
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
    timestamp: Date.now(),
    issuedAt: Date.now(),
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url'); // Must match lib/tokens.ts signature format

  return `${encoded}.${signature}`;
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0] || 'test@example.com';
const documentId = args[1] || 'test-document-123';
const expiresInMinutes = parseInt(args[2]) || 60;

// Generate test token
const token = createToken({
  email: email,
  documentId: documentId,
  // Add any other metadata you need
}, expiresInMinutes);

const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const testUrl = `${baseUrl}/?token=${token}&email=${encodeURIComponent(email)}`;
const shortUrl = `${baseUrl}/t/${token}`;

console.log('\n✅ Test Token Generated:\n');
console.log('Email:', email);
console.log('Document ID:', documentId);
console.log('Expires in:', expiresInMinutes, 'minutes');
console.log('\n📋 Token:');
console.log(token);
console.log('\n🔗 Test URLs:');
console.log('Full URL (with email):', testUrl);
console.log('Short URL (/t/):', shortUrl);
console.log('\n💡 Copy either URL above and open it in your browser after starting the dev server.\n');

