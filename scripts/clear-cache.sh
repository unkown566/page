#!/bin/bash

# Clear Next.js and browser cache
# Run this script to clear all caches

echo "🧹 Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

echo "🧹 Clearing build artifacts..."
rm -rf out
rm -rf dist

echo "✅ Cache cleared! Run 'npm run build:secure' to rebuild."

