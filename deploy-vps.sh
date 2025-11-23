#!/bin/bash
# ============================================
# 🚀 VPS DEPLOYMENT SCRIPT - NEW "page" REPO
# ============================================

set -e

REPO_URL="$1"
PROJECT_DIR="/root/page"

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL required"
    echo ""
    echo "Usage: ./deploy-vps.sh https://github.com/YOUR_USERNAME/page.git"
    echo ""
    echo "Or with token:"
    echo "   ./deploy-vps.sh https://YOUR_TOKEN@github.com/YOUR_USERNAME/page.git"
    exit 1
fi

echo "🚀 Starting deployment..."
echo "Repository: $REPO_URL"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing system dependencies..."
apt-get update
apt-get install -y curl git build-essential

# Step 2: Install Node.js 24
echo ""
echo "📦 Step 2: Installing Node.js 24..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version) installed"

# Step 3: Install PM2
echo ""
echo "📦 Step 3: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "✅ PM2 installed"

# Step 4: Install NGINX
echo ""
echo "📦 Step 4: Installing NGINX..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi
echo "✅ NGINX installed"

# Step 5: Clone or update repository
echo ""
echo "📥 Step 5: Setting up project..."
if [ -d "$PROJECT_DIR" ]; then
    echo "   Updating existing repository..."
    cd "$PROJECT_DIR"
    git pull
else
    echo "   Cloning new repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Step 6: Install dependencies
echo ""
echo "📦 Step 6: Installing project dependencies..."
npm install

# Step 7: Build project
echo ""
echo "🔨 Step 7: Building project..."
npm run build

# Step 8: Rebuild better-sqlite3 in standalone
echo ""
echo "🔧 Step 8: Rebuilding native modules..."
if [ -d ".next/standalone" ]; then
    cd .next/standalone
    npm rebuild better-sqlite3
    cd "$PROJECT_DIR"
fi

# Step 9: Setup NGINX
echo ""
echo "🌐 Step 9: Setting up NGINX..."
cat > /etc/nginx/sites-available/page << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_redirect off;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_redirect off;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
}
NGINX_CONFIG

ln -sf /etc/nginx/sites-available/page /etc/nginx/sites-enabled/page
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Step 10: Setup PM2
echo ""
echo "🔄 Step 10: Setting up PM2..."
pm2 stop page 2>/dev/null || true
pm2 delete page 2>/dev/null || true
pm2 start .next/standalone/server.js --name page --cwd "$PROJECT_DIR/.next/standalone"
pm2 save

# Step 11: Display status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
pm2 status
echo ""
echo "🌐 Your site should be accessible at: http://$(curl -s ifconfig.me)"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs page --lines 50"
echo "   pm2 restart page"
echo "   pm2 status"

