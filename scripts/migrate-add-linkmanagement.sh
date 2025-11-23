#!/bin/bash
# ============================================
# 🔧 DATABASE MIGRATION: Add linkManagement Column
# ============================================
# This script safely adds the linkManagement column to admin_settings table
# 
# Safety features:
# - Checks if column exists before adding
# - Stops PM2 to prevent race conditions
# - Backs up database before migration
# - Verifies migration success
# ============================================

set -e  # Exit on any error

PROJECT_DIR="/root/page"
DB_FILE="$PROJECT_DIR/data/fox_secure.db"
BACKUP_FILE="${DB_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Database Migration: Adding linkManagement column"
echo "📁 Database: $DB_FILE"
echo ""

# Step 1: Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database file not found: $DB_FILE"
    echo "🔍 Searching for database files..."
    find "$PROJECT_DIR" -name "*.db" -type f 2>/dev/null | head -5
    exit 1
fi

# Step 2: Check if column already exists
echo "🔍 Checking if linkManagement column exists..."
COLUMN_EXISTS=$(sqlite3 "$DB_FILE" "PRAGMA table_info(admin_settings);" | grep -c "linkManagement" || echo "0")

if [ "$COLUMN_EXISTS" -gt 0 ]; then
    echo "✅ linkManagement column already exists - no migration needed"
    exit 0
fi

echo "⚠️  linkManagement column NOT found - migration required"
echo ""

# Step 3: Stop PM2 to prevent race conditions
echo "🛑 Stopping PM2 process..."
pm2 stop page || echo "⚠️  PM2 process 'page' not running (this is OK)"
sleep 2

# Step 4: Backup database
echo "💾 Creating database backup..."
cp "$DB_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Step 5: Add column
echo "🔧 Adding linkManagement column..."
sqlite3 "$DB_FILE" <<EOF
ALTER TABLE admin_settings
ADD COLUMN linkManagement TEXT DEFAULT '{}';
EOF

# Step 6: Verify migration
echo "🔍 Verifying migration..."
COLUMN_EXISTS_AFTER=$(sqlite3 "$DB_FILE" "PRAGMA table_info(admin_settings);" | grep -c "linkManagement" || echo "0")

if [ "$COLUMN_EXISTS_AFTER" -gt 0 ]; then
    echo "✅ Migration successful! linkManagement column added"
else
    echo "❌ Migration failed - column not found after ALTER TABLE"
    echo "🔄 Restoring from backup..."
    cp "$BACKUP_FILE" "$DB_FILE"
    exit 1
fi

# Step 7: Clear cache
echo "🧹 Clearing settings cache..."
rm -f "$PROJECT_DIR/.next/standalone/.config-cache.json" 2>/dev/null || true
rm -f "$PROJECT_DIR/.config-cache.json" 2>/dev/null || true
echo "✅ Cache cleared"

# Step 8: Restart PM2
echo "🚀 Restarting PM2..."
pm2 restart page --update-env || pm2 start page --update-env
sleep 2

# Step 9: Verify PM2 is running
if pm2 list | grep -q "page.*online"; then
    echo "✅ PM2 process is running"
else
    echo "⚠️  PM2 process may not be running - check manually: pm2 list"
fi

echo ""
echo "🎉 Migration complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Check logs: pm2 logs page --lines 50 --nostream"
echo "   2. Look for: [ADMIN SETTINGS SQL] linkManagement column found"
echo "   3. If errors persist, restore backup: cp $BACKUP_FILE $DB_FILE"
echo ""

