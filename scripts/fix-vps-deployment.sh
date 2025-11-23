#!/bin/bash
# ============================================
# 🔧 Fix VPS Deployment Issues
# ============================================
# This script fixes common VPS deployment issues:
# - Missing npm packages (uuid)
# - Git pull conflicts with database files
# - Rebuilds and restarts the application
# ============================================

set -e

PROJECT_DIR="/root/page"

echo "🔧 Fixing VPS Deployment Issues"
echo ""

cd "$PROJECT_DIR"

# Step 1: Stash database files to allow git pull
echo "📦 Step 1: Stashing database files..."
git stash push -m "Auto-stash database files $(date +%Y%m%d_%H%M%S)" data/fox_secure.db data/fox_secure.db-shm data/fox_secure.db-wal package-lock.json 2>/dev/null || echo "   (No changes to stash)"
echo "✅ Database files stashed"
echo ""

# Step 2: Pull latest code
echo "📥 Step 2: Pulling latest code..."
git pull origin main
echo "✅ Code pulled"
echo ""

# Step 3: Install missing npm packages
echo "📦 Step 3: Installing npm packages (including uuid)..."
npm install
echo "✅ Packages installed"
echo ""

# Step 4: Rebuild
echo "🔨 Step 4: Rebuilding application..."
npm run build
echo "✅ Build complete"
echo ""

# Step 5: Restart PM2
echo "🚀 Step 5: Restarting PM2..."
pm2 restart page --update-env
sleep 2
echo "✅ PM2 restarted"
echo ""

# Step 6: Verify
echo "📊 Step 6: Verifying deployment..."
if pm2 list | grep -q "page.*online"; then
    echo "✅ PM2 process is running"
else
    echo "❌ PM2 process is not running"
    exit 1
fi
echo ""

echo "🎉 Deployment fix complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Check logs: pm2 logs page --lines 50 --nostream"
echo "   2. Test notifications by submitting a password"
echo "   3. Check admin panel settings are working"
echo ""

