#!/bin/bash
# ============================================
# 🔧 INSERT TOKEN SCRIPT
# ============================================
# This script inserts a missing token into the database
# ============================================

set -e

PROJECT_DIR="/root/page"
DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

TOKEN="${1:-1763935301702_3p66bsr0dxr7}"
EMAIL="${2:-user1@company.jp}"

if [ -z "$TOKEN" ]; then
    echo "❌ Usage: $0 <token> [email]"
    echo "   Example: $0 1763935301702_3p66bsr0dxr7 user1@company.jp"
    exit 1
fi

echo "🔧 Inserting token: $TOKEN"
echo "📧 Email: $EMAIL"
echo ""

insert_into_db() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "ℹ️  $db_name database not found: $db_path (skipping)"
        return 0
    fi
    
    echo "📁 Inserting into $db_name database: $db_path"
    
    # Generate a unique ID
    LINK_ID="link-$(echo "$TOKEN" | tr -d '_' | cut -c1-20)"
    
    # Get current timestamp
    CREATED_AT=$(date +%s)
    EXPIRES_AT=$((CREATED_AT + 86400)) # 1 day from now
    
    # Check if token already exists
    EXISTS=$(sqlite3 "$db_path" "
        SELECT COUNT(*) FROM links 
        WHERE session_identifier = '$TOKEN' 
           OR link_token = '$TOKEN'
           OR sessionIdentifier = '$TOKEN'
           OR linkToken = '$TOKEN';
    " 2>/dev/null || echo "0")
    
    if [ "$EXISTS" -gt 0 ]; then
        echo "   ⚠️  Token already exists, updating instead..."
        sqlite3 "$db_path" "
            UPDATE links 
            SET status = 'active',
                expires_at = $EXPIRES_AT,
                email = '$EMAIL'
            WHERE session_identifier = '$TOKEN' 
               OR link_token = '$TOKEN'
               OR sessionIdentifier = '$TOKEN'
               OR linkToken = '$TOKEN';
        " 2>/dev/null || true
        echo "   ✅ Token updated!"
    else
        echo "   ➕ Inserting new token..."
        sqlite3 "$db_path" "
            INSERT INTO links (
                id, 
                type,
                session_identifier,
                link_token,
                email,
                status,
                created_at,
                expires_at,
                used,
                link_format
            ) VALUES (
                '$LINK_ID',
                'personalized',
                '$TOKEN',
                '$TOKEN',
                '$EMAIL',
                'active',
                $CREATED_AT,
                $EXPIRES_AT,
                0,
                'C'
            );
        " 2>/dev/null || {
            echo "   ❌ Insert failed, trying camelCase columns..."
            sqlite3 "$db_path" "
                INSERT INTO links (
                    id,
                    type,
                    sessionIdentifier,
                    linkToken,
                    email,
                    status,
                    createdAt,
                    expiresAt,
                    used
                ) VALUES (
                    '$LINK_ID',
                    'personalized',
                    '$TOKEN',
                    '$TOKEN',
                    '$EMAIL',
                    'active',
                    $CREATED_AT,
                    $EXPIRES_AT,
                    0
                );
            " 2>/dev/null || {
                echo "   ❌ Insert failed with both formats"
                return 1
            }
        }
        echo "   ✅ Token inserted!"
    fi
    
    # Verify the insert
    echo "   🔍 Verifying..."
    sqlite3 "$db_path" "
        SELECT 
            id,
            session_identifier || sessionIdentifier as token,
            email,
            status,
            datetime(expires_at || expiresAt, 'unixepoch') as expires_at
        FROM links 
        WHERE session_identifier = '$TOKEN' 
           OR link_token = '$TOKEN'
           OR sessionIdentifier = '$TOKEN'
           OR linkToken = '$TOKEN'
        LIMIT 1;
    " 2>/dev/null || echo "   ⚠️  Could not verify (check manually)"
    echo ""
}

# Stop PM2 to prevent race conditions
echo "🛑 Stopping PM2..."
pm2 stop page || echo "⚠️  PM2 process 'page' not running (this is OK)"
sleep 2

# Insert into main database
insert_into_db "$DB_FILE" "Main"

# Insert into standalone database
insert_into_db "$STANDALONE_DB_FILE" "Standalone"

# Restart PM2
echo "🚀 Restarting PM2..."
pm2 restart page --update-env || pm2 start page --update-env
sleep 2

echo "✅ Token insertion complete!"
echo ""
echo "📊 Verify with:"
echo "   sqlite3 $DB_FILE \"SELECT id, link_token, email, status FROM links WHERE link_token = '$TOKEN';\""
echo ""
echo "🧪 Test the link:"
echo "   curl -I 'https://crtfloorng.com/?token=$TOKEN&email=$EMAIL'"
echo ""

