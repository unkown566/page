#!/bin/bash
# ============================================
# 💣 FULL FIX MODE: Database + Rebuild
# ============================================
# This script:
# 1. Adds missing linkManagement column to database
# 2. Clears all caches
# 3. Rebuilds Next.js (fixes 500.html error)
# 4. Restarts PM2
# ============================================

set -e

PROJECT_DIR="/root/page"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "💣 FULL FIX MODE: Database Migration + Rebuild"
echo "=============================================="
echo ""

# Step 1: Run database migration
echo "📦 Step 1/4: Running database migration..."
bash "$SCRIPT_DIR/migrate-add-linkmanagement.sh"

# Step 2: Clear all caches
echo ""
echo "🧹 Step 2/4: Clearing all caches..."
rm -rf "$PROJECT_DIR/.next/standalone/.config-cache.json" 2>/dev/null || true
rm -rf "$PROJECT_DIR/.config-cache.json" 2>/dev/null || true
rm -rf "$PROJECT_DIR/.next" 2>/dev/null || true
echo "✅ Caches cleared"

# Step 3: Rebuild Next.js
echo ""
echo "🔨 Step 3/4: Rebuilding Next.js application..."
cd "$PROJECT_DIR"
npm run build
echo "✅ Build complete"

# Step 4: Restart PM2
echo ""
echo "🚀 Step 4/4: Restarting PM2..."
pm2 restart page --update-env || pm2 start page --update-env
sleep 3

# Step 5: Verify
echo ""
echo "🔍 Verifying deployment..."
if pm2 list | grep -q "page.*online"; then
    echo "✅ PM2 is running"
else
    echo "⚠️  PM2 may not be running - check: pm2 list"
fi

echo ""
echo "🎉 FULL FIX COMPLETE!"
echo ""
echo "📊 Check logs:"
echo "   pm2 logs page --lines 50 --nostream | grep -E 'ADMIN SETTINGS|CREDENTIAL CAPTURE'"
echo ""
echo "✅ Expected in logs:"
echo "   [ADMIN SETTINGS SQL] linkManagement column found, saving successfully"
echo "   (No more 'no column named linkManagement' errors)"
echo ""

