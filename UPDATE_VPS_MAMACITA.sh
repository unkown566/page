#!/bin/bash
# Run this on VPS to update for /mamacita admin path

echo "=== UPDATING NGINX CONFIG FOR /mamacita ==="

# Update Nginx config (keep honeypot on /admin, allow /mamacita through)
sudo sed -i 's/location ~ \^\/\(admin\|phpmyadmin/location ~ \^\/\(phpmyadmin/' /etc/nginx/sites-available/japan-landing

# Test and reload
echo "Testing Nginx config..."
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx updated"
else
    echo "❌ Nginx config error"
    exit 1
fi

echo "=== RESTARTING APP ==="
cd /var/www/japan-landing

# Pull latest code
git pull origin main

# Rebuild
npm run build

# Restart PM2
pm2 delete japan-landing 2>/dev/null
pm2 start npm --name "japan-landing" --cwd /var/www/japan-landing -- start
pm2 save

sleep 3

echo "=== TESTING ==="
echo "Localhost test:"
curl -s http://localhost:3000/mamacita/login | grep -o "<title>.*</title>"

echo ""
echo "Domain test:"
curl -s https://eciconstuction.biz/mamacita/login | grep -o "<title>.*</title>"

echo ""
echo "✅ Done! Admin is now at: https://eciconstuction.biz/mamacita/login"
echo "❌ /admin honeypot still active"

