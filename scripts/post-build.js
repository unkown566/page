#!/usr/bin/env node
/**
 * Post-build script for Next.js standalone deployment
 * Automatically copies static files to standalone directory
 */

const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const staticDir = path.join(projectRoot, '.next', 'static')
const standaloneDir = path.join(projectRoot, '.next', 'standalone')
const standaloneStaticDir = path.join(standaloneDir, '.next', 'static')

console.log('📦 Post-build: Copying static files to standalone...')
console.log(`   From: ${staticDir}`)
console.log(`   To: ${standaloneStaticDir}`)

// Check if static directory exists
if (!fs.existsSync(staticDir)) {
  console.log('⚠️  Static directory not found, skipping...')
  process.exit(0)
}

// Check if standalone directory exists
if (!fs.existsSync(standaloneDir)) {
  console.log('⚠️  Standalone directory not found, skipping...')
  process.exit(0)
}

// Create .next directory in standalone if it doesn't exist
const standaloneNextDir = path.join(standaloneDir, '.next')
if (!fs.existsSync(standaloneNextDir)) {
  fs.mkdirSync(standaloneNextDir, { recursive: true })
}

// Copy static files
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      )
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

try {
  // Remove existing static directory in standalone if it exists
  if (fs.existsSync(standaloneStaticDir)) {
    fs.rmSync(standaloneStaticDir, { recursive: true, force: true })
  }

  // Copy static files
  copyRecursive(staticDir, standaloneStaticDir)
  console.log('✅ Static files copied successfully!')
} catch (error) {
  console.error('❌ Error copying static files:', error.message)
  process.exit(1)
}

// Copy .env file to standalone directory (Next.js standalone mode needs it there)
const envFile = path.join(projectRoot, '.env')
const standaloneEnvFile = path.join(standaloneDir, '.env')
if (fs.existsSync(envFile)) {
  try {
    fs.copyFileSync(envFile, standaloneEnvFile)
    console.log('✅ .env file copied to standalone directory')
  } catch (error) {
    console.warn('⚠️  Warning: Could not copy .env to standalone directory:', error.message)
  }
} else {
  console.warn('⚠️  Warning: .env file not found at', envFile)
}

