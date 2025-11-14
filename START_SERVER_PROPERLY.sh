#!/bin/bash

echo "🧹 Cleaning everything..."

# Kill all Next.js servers
pkill -9 -f "next dev"
pkill -9 -f "node.*next"

# Clear all ports
lsof -ti:3000,3001,3002,3003,3004 | xargs kill -9 2>/dev/null

# Clear build cache
rm -rf .next

sleep 2

echo "✅ Everything cleared!"
echo ""
echo "🚀 Starting fresh server..."
echo ""

# Start server
npm run dev

