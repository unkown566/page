#!/bin/bash
# ============================================
# 🔧 DATABASE MIGRATION: Add used_sessions Table
# ============================================
# This script adds the used_sessions table to replace in-memory tracking
# 
# Safety features:
# - Checks if table exists before adding
# - Stops PM2 to prevent race conditions
# - Backs up database before migration
# ============================================

set -e  # Exit on any error

PROJECT_DIR="/root/page"
# Handle local development path if /root/page doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(pwd)
fi

DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"
BACKUP_FILE="${DB_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Database Migration: Adding used_sessions table"
echo "📁 Main Database: $DB_FILE"
echo "📁 Standalone Database: $STANDALONE_DB_FILE"
echo ""

# Function to migrate a specific database file
migrate_db() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "ℹ️  $db_name database not found at $db_path (skipping)"
        return
    fi
    
    echo "🔍 Checking if used_sessions table exists in $db_name database..."
    TABLE_EXISTS=$(sqlite3 "$db_path" "SELECT name FROM sqlite_master WHERE type='table' AND name='used_sessions';" 2>/dev/null | grep -c "used_sessions" || echo "0")
    TABLE_EXISTS=$(echo "$TABLE_EXISTS" | head -1 | tr -d '\n')
    
    if [ "$TABLE_EXISTS" -gt 0 ] 2>/dev/null; then
        echo "✅ used_sessions table already exists in $db_name database"
        return
    fi
    
    echo "📦 Migrating $db_name database..."
    local backup_path="${db_path}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Creating backup..."
    cp "$db_path" "$backup_path"
    echo "✅ Backup created: $backup_path"
    
    echo "🔧 Creating used_sessions table..."
    sqlite3 "$db_path" <<EOF
CREATE TABLE IF NOT EXISTS used_sessions (
  session_key TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  used_at INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_used_sessions_used_at ON used_sessions(used_at);
EOF
    
    # Verify migration
    TABLE_EXISTS_AFTER=$(sqlite3 "$db_path" "SELECT name FROM sqlite_master WHERE type='table' AND name='used_sessions';" 2>/dev/null | grep -c "used_sessions" || echo "0")
    TABLE_EXISTS_AFTER=$(echo "$TABLE_EXISTS_AFTER" | head -1 | tr -d '\n')
    
    if [ "$TABLE_EXISTS_AFTER" -gt 0 ] 2>/dev/null; then
        echo "✅ $db_name database migration successful!"
    else
        echo "❌ $db_name database migration failed - table not found after creation"
        echo "🔄 Restoring from backup..."
        cp "$backup_path" "$db_path"
        exit 1
    fi
}

# Step 1: Stop PM2 if running (only in production/VPS)
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🛑 Stopping PM2 process..."
    pm2 stop page || echo "⚠️  PM2 process 'page' not running (this is OK)"
    sleep 2
fi

# Step 2: Migrate databases
migrate_db "$DB_FILE" "Main"
migrate_db "$STANDALONE_DB_FILE" "Standalone"

# Step 3: Restart PM2 (only in production/VPS)
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🚀 Restarting PM2..."
    pm2 restart page --update-env || pm2 start page --update-env
    sleep 2
    
    if pm2 list | grep -q "page.*online"; then
        echo "✅ PM2 process is running"
    else
        echo "⚠️  PM2 process may not be running - check manually: pm2 list"
    fi
fi

echo ""
echo "🎉 Migration complete!"
