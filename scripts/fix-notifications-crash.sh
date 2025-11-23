#!/bin/bash

# Fix notifications API crash by ensuring latest code is deployed

set -e

echo "🔧 Fixing notifications API crash..."

cd /root/page

# 1. Pull latest fixes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Verify the notifications route exists and uses correct code
echo "🔍 Verifying notifications route..."
if grep -q "getAllCapturedEmails" app/api/admin/notifications/route.ts 2>/dev/null; then
    echo "✅ Notifications route found"
else
    echo "❌ Notifications route not found or incorrect"
    exit 1
fi

# 3. Verify getAllCapturedEmails uses captured_at
echo "🔍 Verifying database queries..."
if grep -q "captured_at DESC" lib/linkDatabase.ts 2>/dev/null; then
    echo "✅ Database queries use correct column names"
else
    echo "❌ Database queries still use wrong column names"
    exit 1
fi

# 4. Clear Next.js cache (CRITICAL)
echo "🧹 Clearing Next.js cache..."
rm -rf .next

# 5. Rebuild
echo "🔨 Rebuilding application..."
npm run build

# 6. Stop PM2 completely
echo "🛑 Stopping PM2..."
pm2 stop page 2>/dev/null || true
pm2 delete page 2>/dev/null || true

# 7. Start PM2 fresh
echo "🚀 Starting PM2..."
pm2 start .next/standalone/server.js --name page --update-env

# 8. Wait a moment for server to start
sleep 3

# 9. Check PM2 status
echo "📊 PM2 Status:"
pm2 list

# 10. Test server response
echo "🧪 Testing server..."
if curl -I http://localhost:3000 2>/dev/null | grep -q "200 OK"; then
    echo "✅ Server is responding!"
else
    echo "❌ Server is not responding"
    echo "📋 Recent PM2 logs:"
    pm2 logs page --lines 30 --nostream | tail -20
    exit 1
fi

# 11. Check for errors
echo "🔍 Checking for errors..."
ERRORS=$(pm2 logs page --lines 50 --nostream 2>/dev/null | grep -i "error\|capturedAt" | tail -10 || true)
if [ -z "$ERRORS" ]; then
    echo "✅ No errors found!"
else
    echo "⚠️  Found errors:"
    echo "$ERRORS"
fi

echo ""
echo "✅ Fix complete! Server should be running now."
echo "🌐 Test your domain: https://crtfloorng.com"

