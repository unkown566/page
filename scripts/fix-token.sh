#!/bin/bash
# ============================================
# 🔧 TOKEN FIX SCRIPT
# ============================================
# This script fixes a token by:
# 1. Setting status to 'active'
# 2. Extending expiration to 1 day from now
# ============================================

set -e

PROJECT_DIR="/root/page"
DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

TOKEN="${1:-1763935301702_3p66bsr0dxr7}"

if [ -z "$TOKEN" ]; then
    echo "❌ Usage: $0 <token>"
    echo "   Example: $0 1763935301702_3p66bsr0dxr7"
    exit 1
fi

echo "🔧 Fixing token: $TOKEN"
echo ""

fix_db_file() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "ℹ️  $db_name database not found: $db_path (skipping)"
        return 0
    fi
    
    echo "📁 Fixing $db_name database: $db_path"
    
    # Calculate expiration (1 day from now in Unix timestamp seconds)
    EXPIRES_AT=$(date +%s)
    EXPIRES_AT=$((EXPIRES_AT + 86400)) # Add 1 day (86400 seconds)
    
    # Try snake_case columns first (schema format)
    echo "   🔍 Trying snake_case columns..."
    UPDATED=$(sqlite3 "$db_path" "
        UPDATE links 
        SET status = 'active', 
            expires_at = $EXPIRES_AT
        WHERE session_identifier = '$TOKEN' OR link_token = '$TOKEN';
        SELECT changes();
    " 2>/dev/null || echo "0")
    
    # If no rows updated, try camelCase (legacy format)
    if [ "$UPDATED" = "0" ]; then
        echo "   🔍 Trying camelCase columns..."
        UPDATED=$(sqlite3 "$db_path" "
            UPDATE links 
            SET status = 'active', 
                expiresAt = $EXPIRES_AT
            WHERE sessionIdentifier = '$TOKEN' OR linkToken = '$TOKEN';
            SELECT changes();
        " 2>/dev/null || echo "0")
    fi
    
    if [ "$UPDATED" -gt 0 ]; then
        echo "   ✅ Token fixed! ($UPDATED row(s) updated)"
        
        # Verify the fix
        echo "   🔍 Verifying fix..."
        sqlite3 "$db_path" "
            SELECT 
                session_identifier || sessionIdentifier as token,
                status,
                datetime(expires_at || expiresAt, 'unixepoch') as expires_at,
                datetime(created_at || createdAt, 'unixepoch') as created_at
            FROM links 
            WHERE session_identifier = '$TOKEN' 
               OR link_token = '$TOKEN'
               OR sessionIdentifier = '$TOKEN'
               OR linkToken = '$TOKEN'
            LIMIT 1;
        " 2>/dev/null || echo "   ⚠️  Could not verify (column name mismatch)"
    else
        echo "   ❌ Token not found in database"
        echo "   💡 Run: bash scripts/check-token.sh $TOKEN"
    fi
    echo ""
}

# Stop PM2 to prevent race conditions
echo "🛑 Stopping PM2..."
pm2 stop page || echo "⚠️  PM2 process 'page' not running (this is OK)"
sleep 2

# Fix main database
fix_db_file "$DB_FILE" "Main"

# Fix standalone database
fix_db_file "$STANDALONE_DB_FILE" "Standalone"

# Restart PM2
echo "🚀 Restarting PM2..."
pm2 restart page --update-env || pm2 start page --update-env
sleep 2

echo "✅ Token fix complete!"
echo ""
echo "📊 Test the token:"
echo "   curl -I 'https://crtfloorng.com/?token=$TOKEN&email=user1@company.jp'"
echo ""

