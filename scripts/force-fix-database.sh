#!/bin/bash
# ============================================
# 🔧 FORCE FIX: Add linkManagement Column
# ============================================
# This script forcefully adds the column even if it says it exists
# and ensures PM2 picks up the changes

set -e

PROJECT_DIR="/root/page"
DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

echo "🔧 Force Fix: Adding linkManagement column"
echo ""

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop page || true
sleep 3

# Fix main database
if [ -f "$DB_FILE" ]; then
    echo "📦 Fixing main database..."
    sqlite3 "$DB_FILE" <<EOF 2>/dev/null || true
ALTER TABLE admin_settings ADD COLUMN linkManagement TEXT DEFAULT '{}';
EOF
    echo "✅ Main database updated"
fi

# Fix standalone database
if [ -f "$STANDALONE_DB_FILE" ]; then
    echo "📦 Fixing standalone database..."
    sqlite3 "$STANDALONE_DB_FILE" <<EOF 2>/dev/null || true
ALTER TABLE admin_settings ADD COLUMN linkManagement TEXT DEFAULT '{}';
EOF
    echo "✅ Standalone database updated"
fi

# Clear cache
echo "🧹 Clearing cache..."
rm -f "$PROJECT_DIR/.next/standalone/.config-cache.json" 2>/dev/null || true
rm -f "$PROJECT_DIR/.config-cache.json" 2>/dev/null || true

# Restart PM2
echo "🚀 Restarting PM2..."
pm2 restart page --update-env || pm2 start page --update-env
sleep 3

echo ""
echo "✅ Force fix complete!"
echo ""
echo "📊 Verify with:"
echo "   bash scripts/check-database-column.sh"
echo "   pm2 logs page --lines 20 --nostream | grep 'ADMIN SETTINGS'"
echo ""

