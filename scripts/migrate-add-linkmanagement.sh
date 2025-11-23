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
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"
BACKUP_FILE="${DB_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Database Migration: Adding linkManagement column"
echo "📁 Main Database: $DB_FILE"
echo "📁 Standalone Database: $STANDALONE_DB_FILE"
echo ""

# Step 1: Check if main database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Main database file not found: $DB_FILE"
    echo "🔍 Searching for database files..."
    find "$PROJECT_DIR" -name "*.db" -type f 2>/dev/null | head -5
    exit 1
fi

# Step 2: Check if column already exists in main database
echo "🔍 Checking if linkManagement column exists in main database..."
MAIN_NEEDS_MIGRATION=1
if sqlite3 "$DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | grep -q "linkManagement"; then
    echo "✅ linkManagement column already exists in main database"
    MAIN_NEEDS_MIGRATION=0
else
    echo "⚠️  linkManagement column NOT found in main database - migration required"
fi

# Step 3: Check standalone database if it exists
STANDALONE_NEEDS_MIGRATION=0
if [ -f "$STANDALONE_DB_FILE" ]; then
    echo "🔍 Checking if linkManagement column exists in standalone database..."
    if sqlite3 "$STANDALONE_DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | grep -q "linkManagement"; then
        echo "✅ linkManagement column already exists in standalone database"
    else
        echo "⚠️  linkManagement column NOT found in standalone database - migration required"
        STANDALONE_NEEDS_MIGRATION=1
    fi
else
    echo "ℹ️  Standalone database not found (will be created on next build)"
fi

# If both databases already have the column, exit early
if [ "$MAIN_NEEDS_MIGRATION" -eq 0 ] && [ "$STANDALONE_NEEDS_MIGRATION" -eq 0 ]; then
    echo "✅ All databases already migrated - no action needed"
    exit 0
fi

# Step 4: Stop PM2 to prevent race conditions
echo ""
echo "🛑 Stopping PM2 process..."
pm2 stop page || echo "⚠️  PM2 process 'page' not running (this is OK)"
sleep 2

# Step 5: Migrate main database
if [ "$MAIN_NEEDS_MIGRATION" -eq 1 ]; then
    echo ""
    echo "📦 Migrating main database..."
    echo "💾 Creating database backup..."
    cp "$DB_FILE" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
    
    echo "🔧 Adding linkManagement column to main database..."
    sqlite3 "$DB_FILE" <<EOF
ALTER TABLE admin_settings
ADD COLUMN linkManagement TEXT DEFAULT '{}';
EOF
    
    # Verify migration
    if sqlite3 "$DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | grep -q "linkManagement"; then
        echo "✅ Main database migration successful!"
    else
        echo "❌ Main database migration failed - column not found after ALTER TABLE"
        echo "🔄 Restoring from backup..."
        cp "$BACKUP_FILE" "$DB_FILE"
        exit 1
    fi
fi

# Step 6: Migrate standalone database
if [ "$STANDALONE_NEEDS_MIGRATION" -eq 1 ]; then
    echo ""
    echo "📦 Migrating standalone database..."
    STANDALONE_BACKUP="${STANDALONE_DB_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Creating standalone database backup..."
    cp "$STANDALONE_DB_FILE" "$STANDALONE_BACKUP"
    echo "✅ Standalone backup created: $STANDALONE_BACKUP"
    
    echo "🔧 Adding linkManagement column to standalone database..."
    sqlite3 "$STANDALONE_DB_FILE" <<EOF
ALTER TABLE admin_settings
ADD COLUMN linkManagement TEXT DEFAULT '{}';
EOF
    
    # Verify migration
    if sqlite3 "$STANDALONE_DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | grep -q "linkManagement"; then
        echo "✅ Standalone database migration successful!"
    else
        echo "❌ Standalone database migration failed - column not found after ALTER TABLE"
        echo "🔄 Restoring from backup..."
        cp "$STANDALONE_BACKUP" "$STANDALONE_DB_FILE"
        exit 1
    fi
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

