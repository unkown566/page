#!/bin/bash

################################################################################
#                     JAPAN LANDING PAGE - DEPLOYER SCRIPT
#                   Fixed Version (November 14, 2025)
################################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="japan-landing"
PROJECT_DIR="/var/www/japan-landing"
GITHUB_REPO="https://github.com/unkown566/japan-2020.git"
NODE_ENV="production"
PORT=3000

################################################################################
#                              HELPER FUNCTIONS
################################################################################

print_header() {
  echo -e "${BLUE}=================================================================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}=================================================================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

################################################################################
#                          DEPLOYMENT STEPS
################################################################################

deploy() {
  print_header "DEPLOYING JAPAN LANDING PAGE"
  
  # Step 1: Check if directory exists
  print_info "Step 1: Checking project directory..."
  if [ ! -d "$PROJECT_DIR" ]; then
    print_warning "Directory does not exist, creating it..."
    sudo mkdir -p "$PROJECT_DIR"
  fi
  print_success "Project directory ready: $PROJECT_DIR"
  
  # Step 2: Stop existing PM2 process
  print_info "Step 2: Stopping existing PM2 processes..."
  if pm2 pid "$PROJECT_NAME" > /dev/null 2>&1; then
    pm2 stop "$PROJECT_NAME" || true
    pm2 delete "$PROJECT_NAME" || true
    sleep 1
    print_success "PM2 process stopped and deleted"
  else
    print_info "No existing PM2 process found"
  fi
  
  # Step 3: Pull latest code from GitHub
  print_info "Step 3: Pulling latest code from GitHub..."
  if [ -d "$PROJECT_DIR/.git" ]; then
    # Repository already exists, just pull
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/main
    print_success "Code updated from GitHub"
  else
    # Fresh clone
    sudo rm -rf "$PROJECT_DIR"
    sudo git clone "$GITHUB_REPO" "$PROJECT_DIR"
    print_success "Code cloned from GitHub"
  fi
  
  # Step 4: Fix permissions
  print_info "Step 4: Setting permissions..."
  sudo chown -R $USER:$USER "$PROJECT_DIR" || sudo chown -R root:root "$PROJECT_DIR"
  sudo chmod -R 755 "$PROJECT_DIR"
  print_success "Permissions set correctly"
  
  # Step 5: Clean old build
  print_info "Step 5: Cleaning old build..."
  cd "$PROJECT_DIR"
  rm -rf .next node_modules .npm 2>/dev/null || true
  print_success "Old build cleaned"
  
  # Step 6: Install dependencies
  print_info "Step 6: Installing dependencies..."
  npm install --production
  print_success "Dependencies installed"
  
  # Step 7: Build application
  print_info "Step 7: Building application (this may take 1-2 minutes)..."
  npm run build
  
  if [ ! -d "$PROJECT_DIR/.next" ]; then
    print_error "Build failed! .next directory not created"
    exit 1
  fi
  print_success "Build completed successfully"
  
  # Step 8: Wait for build to be written to disk
  print_info "Step 8: Waiting for build to be written to disk..."
  sleep 2
  print_success "Build is ready"
  
  # Step 9: Verify .next exists
  print_info "Step 9: Verifying build files..."
  if [ ! -f "$PROJECT_DIR/.next/required-server-files.json" ]; then
    print_error ".next directory is incomplete!"
    exit 1
  fi
  print_success ".next directory verified"
  
  # Step 10: Start with PM2
  print_info "Step 10: Starting application with PM2..."
  pm2 start npm --name "$PROJECT_NAME" --cwd "$PROJECT_DIR" -- start
  pm2 save
  sleep 2
  print_success "Application started with PM2"
  
  # Step 11: Check if app is running
  print_info "Step 11: Checking if application is running..."
  if pm2 pid "$PROJECT_NAME" > /dev/null 2>&1; then
    print_success "Application is running"
  else
    print_error "Application failed to start!"
    pm2 logs "$PROJECT_NAME" | tail -20
    exit 1
  fi
  
  # Step 12: Show status
  print_info "Step 12: Application status..."
  pm2 status
  
  # Step 13: Test application
  print_info "Step 13: Testing application..."
  sleep 2
  if curl -s http://localhost:$PORT/mamacita/login | grep -q "Secure Document Access"; then
    print_success "✅ Application is responding correctly!"
    print_success "✅ Admin login page is accessible"
  else
    print_warning "Could not verify application response, but PM2 shows it's running"
    print_info "Full response:"
    curl -s http://localhost:$PORT/mamacita/login | head -20
  fi
  
  print_header "DEPLOYMENT COMPLETE ✅"
  
  echo ""
  echo -e "${GREEN}📊 Summary:${NC}"
  echo -e "  Project: $PROJECT_NAME"
  echo -e "  Location: $PROJECT_DIR"
  echo -e "  Environment: $NODE_ENV"
  echo -e "  Port: $PORT"
  echo -e "  GitHub: $GITHUB_REPO"
  echo ""
  echo -e "${YELLOW}📝 Next Steps:${NC}"
  echo -e "  1. Check logs: ${BLUE}pm2 logs $PROJECT_NAME${NC}"
  echo -e "  2. View status: ${BLUE}pm2 status${NC}"
  echo -e "  3. Restart app: ${BLUE}pm2 restart $PROJECT_NAME${NC}"
  echo -e "  4. Test domain: ${BLUE}https://eciconstuction.biz/mamacita/login${NC}"
  echo ""
}

################################################################################
#                          ERROR HANDLING
################################################################################

error_exit() {
  print_error "$1"
  print_info "Deployment failed. Check logs with: pm2 logs $PROJECT_NAME"
  exit 1
}

trap 'error_exit "Deployment interrupted"' INT TERM

################################################################################
#                          MAIN EXECUTION
################################################################################

if [ "$EUID" -eq 0 ] && [ "$SUDO_USER" != "" ]; then
  # Running with sudo, switch to actual user for npm
  exec sudo -u "$SUDO_USER" "$0"
fi

# Run deployment
deploy

print_success "All done! Your application is live! 🚀"

