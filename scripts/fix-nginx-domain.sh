#!/bin/bash
# ============================================
# 🔧 Fix NGINX Configuration for New Domain
# ============================================
# This script updates NGINX config to use the new domain
# and installs the SSL certificate
# ============================================

set -e

DOMAIN="${1:-crtfloorng.com}"

echo "🔧 Updating NGINX configuration for: $DOMAIN"
echo ""

# Step 1: Update NGINX config file
echo "📝 Step 1: Updating NGINX config..."
sudo tee /etc/nginx/sites-available/page > /dev/null << NGINX_EOF
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

echo "✅ NGINX config updated"

# Step 2: Ensure symlink exists
echo "🔗 Step 2: Ensuring symlink..."
sudo ln -sf /etc/nginx/sites-available/page /etc/nginx/sites-enabled/page
sudo rm -f /etc/nginx/sites-enabled/default
echo "✅ Symlink created"

# Step 3: Test NGINX config
echo "🧪 Step 3: Testing NGINX configuration..."
if sudo nginx -t; then
    echo "✅ NGINX configuration test passed"
else
    echo "❌ NGINX configuration test failed"
    exit 1
fi

# Step 4: Install SSL certificate (if not already installed)
echo "🔒 Step 4: Installing SSL certificate..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate already exists"
    sudo certbot install --cert-name $DOMAIN --nginx || echo "⚠️  Certificate install may have failed, but continuing..."
else
    echo "❌ SSL certificate not found at /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "   Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    exit 1
fi

# Step 5: Reload NGINX
echo "🔄 Step 5: Reloading NGINX..."
sudo systemctl reload nginx
echo "✅ NGINX reloaded"

echo ""
echo "🎉 NGINX configuration complete!"
echo ""
echo "🌐 Your site should now be accessible at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📊 Test with:"
echo "   curl -I https://$DOMAIN"
echo ""

