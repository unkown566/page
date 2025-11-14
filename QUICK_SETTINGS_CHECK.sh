#!/bin/bash

# 🚀 QUICK SETTINGS SYSTEM CHECK
# Run this to diagnose settings issues quickly

echo "🔍 SETTINGS SYSTEM QUICK CHECK"
echo "=============================="
echo ""

# 1. Local file check
echo "1️⃣  LOCAL FILE CHECK:"
if [ -f .config-cache.json ]; then
    echo "   ✅ File exists: .config-cache.json"
    SIZE=$(wc -c < .config-cache.json)
    echo "   📊 Size: $SIZE bytes"
    PERMS=$(ls -l .config-cache.json | awk '{print $1}')
    echo "   🔐 Permissions: $PERMS"
    MODIFIED=$(ls -l .config-cache.json | awk '{print $6, $7, $8}')
    echo "   📅 Last modified: $MODIFIED"
    
    # Check if valid JSON
    if cat .config-cache.json | jq . > /dev/null 2>&1; then
        echo "   ✅ Valid JSON"
        echo "   📦 Keys: $(cat .config-cache.json | jq 'keys' | tr '\n' ' ')"
    else
        echo "   ❌ Invalid JSON!"
    fi
else
    echo "   ❌ File NOT found"
fi
echo ""

# 2. API routes check
echo "2️⃣  API ROUTES CHECK:"
if [ -f app/api/admin/settings/route.ts ]; then
    echo "   ✅ GET/POST handler exists"
    if grep -q "export const runtime = 'nodejs'" app/api/admin/settings/route.ts; then
        echo "   ✅ Node.js runtime configured"
    else
        echo "   ⚠️  Runtime not explicitly set"
    fi
    if grep -q "requireAdmin" app/api/admin/settings/route.ts; then
        echo "   ✅ Auth check enabled"
    fi
    if grep -q "verifyCSRFToken" app/api/admin/settings/route.ts; then
        echo "   ✅ CSRF protection enabled"
    fi
else
    echo "   ❌ API route NOT found"
fi
echo ""

# 3. File I/O check
echo "3️⃣  FILE I/O CHECK:"
if grep -q "secureWriteJSON\|secureReadJSON" lib/secureFileSystem.ts; then
    echo "   ✅ Secure file operations implemented"
    if grep -q "SECURE_FILE_MODE = 0o600" lib/secureFileSystem.ts; then
        echo "   ✅ Secure permissions (0600) configured"
    fi
    if grep -q "acquireLock" lib/secureFileSystem.ts; then
        echo "   ✅ File locking implemented"
    fi
else
    echo "   ❌ Secure file ops NOT found"
fi
echo ""

# 4. Logging check
echo "4️⃣  LOGGING CHECK:"
LOG_COUNT=$(grep -c "console.log.*SETTINGS\|console.log.*FILE I/O" app/api/admin/settings/route.ts lib/secureFileSystem.ts lib/adminSettings.ts 2>/dev/null || echo 0)
echo "   📝 Logging statements: $LOG_COUNT"
if [ "$LOG_COUNT" -gt 0 ]; then
    echo "   ✅ Diagnostic logging enabled"
fi
echo ""

# 5. Build check
echo "5️⃣  BUILD CHECK:"
if npm run build 2>&1 | grep -q "✓"; then
    echo "   ✅ Build successful"
else
    echo "   ⚠️  Build may have errors (run 'npm run build' for details)"
fi
echo ""

echo "=============================="
echo "✅ QUICK CHECK COMPLETE"
echo ""
echo "Next steps:"
echo "1. Build: npm run build"
echo "2. Deploy to VPS"
echo "3. Test save in /mamacita/settings"
echo "4. Check logs: pm2 logs japan-landing | grep -E 'SETTINGS|FILE I/O'"

