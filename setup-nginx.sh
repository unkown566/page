#!/bin/bash
# ============================================
# NGINX Reverse Proxy Setup for Next.js
# ============================================

set -e

echo "🔧 Setting up NGINX reverse proxy..."

# Check if NGINX is installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing NGINX..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Create rate limiting zones in main NGINX config (if not exists)
if ! grep -q "zone=api_limit" /etc/nginx/nginx.conf; then
    echo "📝 Adding rate limiting zones to nginx.conf..."
    sudo sed -i '/http {/a\
    # Rate limiting zones\
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;\
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
' /etc/nginx/nginx.conf
fi

# Create site configuration
echo "📝 Creating NGINX site configuration..."
sudo tee /etc/nginx/sites-available/japan > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;  # Replace with your domain or IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Main location - proxy to Next.js
    location / {
        limit_req zone=general_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_redirect off;
    }

    # API routes with stricter rate limiting
    location /api/ {
        limit_req zone=api_limit burst=5 nodelay;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_redirect off;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }

    # Block common exploit paths
    location ~ ^/(\.env|\.git|wp-admin|wp-login|phpmyadmin|adminer) {
        return 404;
    }
}

NGINX_CONFIG

# Enable the site
echo "🔗 Enabling site..."
sudo ln -sf /etc/nginx/sites-available/japan /etc/nginx/sites-enabled/japan

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
echo "🧪 Testing NGINX configuration..."
if sudo nginx -t; then
    echo "✅ NGINX configuration test passed!"
    
    # Reload NGINX
    echo "🔄 Reloading NGINX..."
    sudo systemctl reload nginx
    
    # Check status
    echo "📊 NGINX status:"
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    echo "✅ NGINX setup complete!"
    echo ""
    echo "🌐 Your site should now be accessible at:"
    echo "   http://YOUR-VPS-IP"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test: curl -I http://localhost"
    echo "   2. View logs: sudo tail -f /var/log/nginx/access.log"
    echo "   3. Set up SSL: sudo certbot --nginx -d your-domain.com"
else
    echo "❌ NGINX configuration test failed!"
    echo "Please check the errors above and fix them."
    exit 1
fi

