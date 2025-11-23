#!/bin/bash
# ============================================
# 🔍 TOKEN DIAGNOSTIC SCRIPT
# ============================================
# This script checks if a token exists in the database
# and shows its status and expiration
# ============================================

set -e

PROJECT_DIR="/root/page"
DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

TOKEN="${1:-1763935301702_3p66bsr0dxr7}"

echo "🔍 Token Diagnostic: $TOKEN"
echo ""

check_db_file() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "❌ $db_name database not found: $db_path"
        return 1
    fi
    
    echo "📁 Checking $db_name database: $db_path"
    echo ""
    
    # First, check what columns actually exist
    echo "📊 Table schema:"
    sqlite3 "$db_path" "PRAGMA table_info(links);" | head -10
    echo ""
    
    # Try to find the token using different column name variations
    echo "🔍 Searching for token (trying different column names)..."
    echo ""
    
    # Try snake_case (session_identifier)
    echo "1️⃣  Searching in session_identifier column:"
    sqlite3 "$db_path" "SELECT session_identifier, status, expires_at, created_at FROM links WHERE session_identifier = '$TOKEN' LIMIT 1;" 2>/dev/null || echo "   ❌ Column 'session_identifier' not found or query failed"
    echo ""
    
    # Try camelCase (sessionIdentifier)
    echo "2️⃣  Searching in sessionIdentifier column:"
    sqlite3 "$db_path" "SELECT sessionIdentifier, status, expiresAt, createdAt FROM links WHERE sessionIdentifier = '$TOKEN' LIMIT 1;" 2>/dev/null || echo "   ❌ Column 'sessionIdentifier' not found or query failed"
    echo ""
    
    # Try link_token (snake_case)
    echo "3️⃣  Searching in link_token column:"
    sqlite3 "$db_path" "SELECT link_token, status, expires_at, created_at FROM links WHERE link_token = '$TOKEN' LIMIT 1;" 2>/dev/null || echo "   ❌ Column 'link_token' not found or query failed"
    echo ""
    
    # Try linkToken (camelCase)
    echo "4️⃣  Searching in linkToken column:"
    sqlite3 "$db_path" "SELECT linkToken, status, expiresAt, createdAt FROM links WHERE linkToken = '$TOKEN' LIMIT 1;" 2>/dev/null || echo "   ❌ Column 'linkToken' not found or query failed"
    echo ""
    
    # Show all tokens (first 5) to see what format they use
    echo "📋 Sample tokens in database (first 5):"
    sqlite3 "$db_path" ".schema links" 2>/dev/null | grep -E "session|link" || echo "   Could not get schema"
    sqlite3 "$db_path" "SELECT * FROM links LIMIT 5;" 2>/dev/null | head -3 || echo "   Could not query links table"
    echo ""
}

# Check main database
check_db_file "$DB_FILE" "Main"

# Check standalone database
check_db_file "$STANDALONE_DB_FILE" "Standalone"

echo "✅ Diagnostic complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Check which column format is used (snake_case vs camelCase)"
echo "   2. Update getLink() query to match the actual column names"
echo "   3. If token exists but status != 'active', run fix script"
echo ""

