#!/bin/bash
# ============================================
# 🚀 AUTOMATED DEPLOYMENT SCRIPT
# ============================================
# This script handles complete deployment:
# - Pulls latest code
# - Builds the project
# - Copies static files automatically
# - Rebuilds native modules
# - Restarts PM2
# - Configures NGINX

set -e

PROJECT_DIR="/root/page"
DOMAIN="${1:-eciconstuction.biz}"

echo "🚀 Starting automated deployment..."
echo "📁 Project directory: $PROJECT_DIR"
echo "🌐 Domain: $DOMAIN"
echo ""

cd "$PROJECT_DIR"

# Step 1: Pull latest code
echo "📥 Step 1: Pulling latest code..."
git pull origin main || git pull origin master
echo "✅ Code updated"
echo ""

# Step 2: Install dependencies (if package.json changed)
echo "📦 Step 2: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Build project (includes automatic static file copy via postbuild script)
echo "🔨 Step 3: Building project..."
npm run build
echo "✅ Build complete"
echo ""

# Step 4: Rebuild better-sqlite3 in standalone
echo "🔧 Step 4: Rebuilding native modules..."
if [ -d ".next/standalone" ]; then
    cd .next/standalone
    npm rebuild better-sqlite3
    cd "$PROJECT_DIR"
    echo "✅ Native modules rebuilt"
else
    echo "⚠️  Standalone directory not found"
fi
echo ""

# Step 5: Restart PM2
echo "🔄 Step 5: Restarting PM2..."
pm2 delete page 2>/dev/null || true
cd "$PROJECT_DIR/.next/standalone"
pm2 start server.js --name page
pm2 save
cd "$PROJECT_DIR"
echo "✅ PM2 restarted"
echo ""

# Step 6: Configure NGINX (if not already configured)
echo "🌐 Step 6: Configuring NGINX..."
if [ ! -f "/etc/nginx/sites-available/page" ]; then
    cat > /etc/nginx/sites-available/page << NGINX_EOF
server {
    server_name $DOMAIN www.$DOMAIN;
    client_max_body_size 10M;
    
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_redirect off;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if (\$host = www.$DOMAIN) {
        return 301 https://\$host\$request_uri;
    }
    if (\$host = $DOMAIN) {
        return 301 https://\$host\$request_uri;
    }
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 404;
}
NGINX_EOF

    ln -sf /etc/nginx/sites-available/page /etc/nginx/sites-enabled/page
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "✅ NGINX configured"
else
    echo "✅ NGINX already configured"
fi
echo ""

# Step 7: Verify deployment
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "🌐 Your site should be accessible at: https://$DOMAIN"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs page --lines 50"
echo "   pm2 restart page"
echo "   pm2 status"
echo ""
echo "🔄 To deploy again, just run: ./deploy.sh"

