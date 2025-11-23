#!/bin/bash
# ============================================
# 🌐 DOMAIN DNS SETUP SCRIPT
# ============================================
# This script helps you configure your domain
# to point to your VPS and updates NGINX

set -e

DOMAIN="${1:-eciconstruction.biz}"

echo "🌐 Domain Setup for: $DOMAIN"
echo ""

# Get VPS IP
VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')

echo "📊 Your VPS IP Address: $VPS_IP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DNS CONFIGURATION STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Log in to GoDaddy: https://dcc.godaddy.com/"
echo ""
echo "2. Go to: My Products → Domains → $DOMAIN → DNS"
echo ""
echo "3. Update these DNS records:"
echo ""
echo "   Type    Name    Value              TTL"
echo "   ──────────────────────────────────────────────"
echo "   A       @       $VPS_IP           600"
echo "   A       www     $VPS_IP           600"
echo ""
echo "4. Wait 5-10 minutes for DNS to propagate"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update NGINX configuration
echo "🔧 Updating NGINX configuration..."
cat > /etc/nginx/sites-available/page << NGINX_EOF
server {
    listen 80;
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
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/page /etc/nginx/sites-enabled/page
rm -f /etc/nginx/sites-enabled/default

# Test and reload NGINX
if nginx -t; then
    systemctl reload nginx
    echo "✅ NGINX configured for: $DOMAIN"
else
    echo "❌ NGINX configuration test failed!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update DNS at GoDaddy (see instructions above)"
echo "2. Wait 5-10 minutes for DNS propagation"
echo "3. Test: curl -I http://$DOMAIN"
echo "4. Set up SSL: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "🔍 Check DNS propagation:"
echo "   dig $DOMAIN +short"
echo "   nslookup $DOMAIN"
echo ""

