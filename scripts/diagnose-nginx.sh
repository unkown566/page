#!/bin/bash
# ============================================
# 🔍 NGINX Diagnostic Script
# ============================================
# This script checks NGINX configuration and fixes common issues
# ============================================

set -e

DOMAIN="${1:-crtfloorng.com}"

echo "🔍 NGINX Diagnostic for: $DOMAIN"
echo ""

# Step 1: Check if NGINX is running
echo "📊 Step 1: Checking NGINX status..."
if systemctl is-active --quiet nginx; then
    echo "✅ NGINX is running"
else
    echo "❌ NGINX is not running"
    echo "   Starting NGINX..."
    sudo systemctl start nginx
fi
echo ""

# Step 2: Check enabled sites
echo "📁 Step 2: Checking enabled NGINX sites..."
echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/ | grep -v "^total" || echo "   No sites found"
echo ""

# Step 3: Check if our config exists
echo "📝 Step 3: Checking NGINX config file..."
if [ -f "/etc/nginx/sites-available/page" ]; then
    echo "✅ Config file exists: /etc/nginx/sites-available/page"
    echo ""
    echo "Current server_name directives:"
    grep -i "server_name" /etc/nginx/sites-available/page || echo "   No server_name found"
    echo ""
else
    echo "❌ Config file not found: /etc/nginx/sites-available/page"
fi
echo ""

# Step 4: Check if symlink exists
echo "🔗 Step 4: Checking symlink..."
if [ -L "/etc/nginx/sites-enabled/page" ]; then
    echo "✅ Symlink exists"
    ls -la /etc/nginx/sites-enabled/page
else
    echo "❌ Symlink missing - creating it..."
    sudo ln -sf /etc/nginx/sites-available/page /etc/nginx/sites-enabled/page
    echo "✅ Symlink created"
fi
echo ""

# Step 5: Check if Next.js is running on port 3000
echo "🌐 Step 5: Checking if Next.js is running on port 3000..."
if netstat -tuln | grep -q ":3000 "; then
    echo "✅ Port 3000 is in use (Next.js is running)"
    netstat -tuln | grep ":3000 "
else
    echo "❌ Port 3000 is not in use - Next.js may not be running"
    echo "   Check PM2: pm2 list"
fi
echo ""

# Step 6: Test NGINX config
echo "🧪 Step 6: Testing NGINX configuration..."
if sudo nginx -t 2>&1; then
    echo "✅ NGINX configuration is valid"
else
    echo "❌ NGINX configuration has errors"
    exit 1
fi
echo ""

# Step 7: Show current NGINX config
echo "📋 Step 7: Current NGINX config for 'page' site:"
if [ -f "/etc/nginx/sites-available/page" ]; then
    cat /etc/nginx/sites-available/page
else
    echo "   Config file not found"
fi
echo ""

# Step 8: Check what NGINX is actually serving
echo "🔍 Step 8: Checking active NGINX server blocks..."
sudo nginx -T 2>/dev/null | grep -A 20 "server_name" | head -40 || echo "   Could not parse NGINX config"
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "💡 If you see issues, run:"
echo "   bash scripts/fix-nginx-domain.sh $DOMAIN"
echo ""

