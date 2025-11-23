#!/bin/bash
# ============================================
# 🔍 DATABASE DIAGNOSTIC: Check linkManagement Column
# ============================================

PROJECT_DIR="/root/page"
DB_FILE="$PROJECT_DIR/data/fox_secure.db"
STANDALONE_DB_FILE="$PROJECT_DIR/.next/standalone/data/fox_secure.db"

echo "🔍 Database Diagnostic: Checking linkManagement column"
echo ""

# Check main database
if [ -f "$DB_FILE" ]; then
    echo "📁 Main Database: $DB_FILE"
    echo "   Columns in admin_settings table:"
    sqlite3 "$DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | while IFS='|' read -r cid name type notnull dflt_value pk; do
        echo "   - $name ($type)"
    done
    echo ""
    
    if sqlite3 "$DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | grep -q "linkManagement"; then
        echo "   ✅ linkManagement column EXISTS"
    else
        echo "   ❌ linkManagement column MISSING"
    fi
    echo ""
else
    echo "❌ Main database not found: $DB_FILE"
    echo ""
fi

# Check standalone database
if [ -f "$STANDALONE_DB_FILE" ]; then
    echo "📁 Standalone Database: $STANDALONE_DB_FILE"
    echo "   Columns in admin_settings table:"
    sqlite3 "$STANDALONE_DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | while IFS='|' read -r cid name type notnull dflt_value pk; do
        echo "   - $name ($type)"
    done
    echo ""
    
    if sqlite3 "$STANDALONE_DB_FILE" "PRAGMA table_info(admin_settings);" 2>/dev/null | grep -q "linkManagement"; then
        echo "   ✅ linkManagement column EXISTS"
    else
        echo "   ❌ linkManagement column MISSING"
    fi
    echo ""
else
    echo "⚠️  Standalone database not found: $STANDALONE_DB_FILE"
    echo "   (This is OK if you haven't built yet)"
    echo ""
fi

# Check which database PM2 is using
echo "🔍 PM2 Process Info:"
pm2 list | grep page || echo "   PM2 process 'page' not found"
echo ""

# Check if there are other database files
echo "🔍 All .db files in project:"
find "$PROJECT_DIR" -name "*.db" -type f 2>/dev/null | head -10
echo ""

