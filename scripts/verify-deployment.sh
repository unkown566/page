#!/bin/bash
# ============================================
# ✅ DEPLOYMENT VERIFICATION SCRIPT
# ============================================
# This script verifies that all required files
# and features are properly deployed
# ============================================

set -e

PROJECT_DIR="${1:-/root/page}"
STANDALONE_DIR="$PROJECT_DIR/.next/standalone"

echo "🔍 Verifying deployment completeness..."
echo "📁 Project directory: $PROJECT_DIR"
echo "📁 Standalone directory: $STANDALONE_DIR"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

check_file() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ] || [ -d "$file_path" ]; then
        echo -e "${GREEN}✅${NC} $description"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $description (MISSING: $file_path)"
        ((CHECKS_FAILED++))
        return 1
    fi
}

echo "📦 Checking required files and directories..."
echo ""

# 1. Core Next.js files
check_file "$STANDALONE_DIR/server.js" "Next.js server file"
check_file "$STANDALONE_DIR/.next/static" "Static assets directory"

# 2. Environment and configuration
check_file "$STANDALONE_DIR/.env" ".env file"

# 3. Templates and locales
check_file "$STANDALONE_DIR/.templates" ".templates directory"
check_file "$STANDALONE_DIR/locales" "locales directory"

# 4. Database directory
check_file "$STANDALONE_DIR/data" "data directory (for database)"

# 5. Node modules
check_file "$STANDALONE_DIR/node_modules" "node_modules directory"
check_file "$STANDALONE_DIR/node_modules/better-sqlite3" "better-sqlite3 module"

# 6. Package.json
check_file "$STANDALONE_DIR/package.json" "package.json"

echo ""
echo "🔍 Checking application features..."
echo ""

# 7. Check if PM2 is running
if pm2 list | grep -q "page"; then
    echo -e "${GREEN}✅${NC} PM2 process 'page' is running"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} PM2 process 'page' is NOT running"
    ((CHECKS_FAILED++))
fi

# 8. Check if server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅${NC} Server is responding on port 3000"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Server may not be responding (check PM2 logs)"
    ((CHECKS_FAILED++))
fi

# 9. Check database file (optional - will be created if missing)
if [ -f "$STANDALONE_DIR/data/fox_secure.db" ]; then
    echo -e "${GREEN}✅${NC} Database file exists"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}ℹ️${NC}  Database file not found (will be created on first run)"
fi

# 10. Check templates file
if [ -f "$STANDALONE_DIR/.templates/templates.json" ]; then
    TEMPLATE_COUNT=$(cat "$STANDALONE_DIR/.templates/templates.json" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✅${NC} Templates file exists ($TEMPLATE_COUNT templates)"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}ℹ️${NC}  Templates file not found (will be auto-created on first load)"
fi

echo ""
echo "============================================"
echo "📊 VERIFICATION SUMMARY"
echo "============================================"
echo -e "${GREEN}Passed:${NC} $CHECKS_PASSED"
echo -e "${RED}Failed:${NC} $CHECKS_FAILED"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Deployment is complete.${NC}"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Visit your admin panel: https://your-domain.com/mamacita"
    echo "2. Check templates: https://your-domain.com/mamacita/templates"
    echo "3. Test landing page: https://your-domain.com"
    echo "4. Check PM2 logs: pm2 logs page --lines 50"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "1. Run: cd $PROJECT_DIR && npm run build"
    echo "2. Check PM2: pm2 restart page"
    echo "3. Check logs: pm2 logs page --lines 100"
    exit 1
fi

