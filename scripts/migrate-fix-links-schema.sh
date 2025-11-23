#!/bin/bash
# ============================================
# 🔧 DATABASE MIGRATION: Fix Links Table Schema
# ============================================

set -e

PROJECT_DIR="/root/page"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(pwd)
fi

DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

echo "🔧 Database Migration: Fixing links table schema"

migrate_db() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "ℹ️  $db_name database not found at $db_path (skipping)"
        return
    fi
    
    echo "📦 Migrating $db_name database..."
    
    # Check if links table exists
    TABLE_EXISTS=$(sqlite3 "$db_path" "SELECT name FROM sqlite_master WHERE type='table' AND name='links';" 2>/dev/null | grep -c "links" || echo "0")
    TABLE_EXISTS=$(echo "$TABLE_EXISTS" | head -1 | tr -d '\n')
    
    if [ "$TABLE_EXISTS" -eq 0 ]; then
        echo "Creating links table..."
        sqlite3 "$db_path" <<EOF
CREATE TABLE links (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    sessionIdentifier TEXT UNIQUE,
    linkToken TEXT,
    name TEXT,
    createdAt INTEGER,
    expiresAt INTEGER,
    status TEXT,
    templateId TEXT,
    templateMode TEXT,
    language TEXT,
    loadingScreen TEXT,
    loadingDuration INTEGER,
    email TEXT,
    used INTEGER DEFAULT 0,
    usedAt INTEGER,
    fingerprint TEXT,
    ip TEXT,
    allowedEmails TEXT,
    validatedAccounts TEXT,
    pendingEmails TEXT,
    totalEmails INTEGER,
    capturedCount INTEGER,
    pendingCount INTEGER,
    link_format TEXT DEFAULT 'A'
);
EOF
    else
        echo "Links table exists. Checking for missing columns..."
        # Add columns if they don't exist (WITHOUT UNIQUE constraint for sessionIdentifier)
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "sessionIdentifier" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN sessionIdentifier TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "linkToken" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN linkToken TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "templateMode" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN templateMode TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "loadingScreen" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN loadingScreen TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "loadingDuration" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN loadingDuration INTEGER;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "allowedEmails" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN allowedEmails TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "validatedAccounts" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN validatedAccounts TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "pendingEmails" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN pendingEmails TEXT;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "totalEmails" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN totalEmails INTEGER;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "capturedCount" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN capturedCount INTEGER;"
        sqlite3 "$db_path" "PRAGMA table_info(links);" | grep -q "pendingCount" || sqlite3 "$db_path" "ALTER TABLE links ADD COLUMN pendingCount INTEGER;"
    fi
    
    # Create indexes (Use CREATE UNIQUE INDEX for sessionIdentifier)
    sqlite3 "$db_path" "CREATE UNIQUE INDEX IF NOT EXISTS idx_links_sessionIdentifier ON links(sessionIdentifier);"
    sqlite3 "$db_path" "CREATE INDEX IF NOT EXISTS idx_links_linkToken ON links(linkToken);"
    
    echo "✅ $db_name database migration successful!"
}

# Stop PM2
if command -v pm2 &> /dev/null; then
    pm2 stop page || true
fi

migrate_db "$DB_FILE" "Main"
migrate_db "$STANDALONE_DB_FILE" "Standalone"

# Restart PM2
if command -v pm2 &> /dev/null; then
    pm2 restart page --update-env || pm2 start page --update-env
fi

echo "🎉 Migration complete!"
