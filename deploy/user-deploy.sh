#!/bin/bash

# 🚀 USER-LEVEL DEPLOYMENT SCRIPT (NO SUDO REQUIRED)
# Alexander Paskhalis Fitness Trainer Website
# Repository: https://github.com/TeaProphet/alex-landing
# Domain: fitness-trainer.online
# Compatible with: Ubuntu 20.04+, AlmaLinux 8+, Rocky Linux 8+

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - User-level paths (no sudo required)
USER_HOME="$HOME"
PROJECT_DIR="$USER_HOME/fitness-trainer"
WEB_ROOT="$USER_HOME/www/fitness-trainer.online"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_BUILD_DIR="$PROJECT_DIR/frontend/dist"
REPO_URL="https://github.com/TeaProphet/alex-landing.git"
DOMAIN="fitness-trainer.online"
BACKEND_PORT="3000"
FRONTEND_PORT="3001"

# Progress tracking
STEP=0
TOTAL_STEPS=8

print_step() {
    STEP=$((STEP + 1))
    echo ""
    echo -e "${BLUE}[$STEP/$TOTAL_STEPS] $1${NC}"
    echo "================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is available"
    else
        print_error "$1 is not available - please install it first"
        return 1
    fi
}

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID=$ID
fi

echo "🚀 Alexander Paskhalis Fitness Trainer - USER-LEVEL DEPLOYMENT"
echo "=============================================================="
echo "Operating System: $NAME"
echo "Repository: $REPO_URL"
echo "Domain: $DOMAIN"
echo "Project Directory: $PROJECT_DIR"
echo "Web Root: $WEB_ROOT"
echo "User: $(whoami)"
echo "No sudo privileges required!"
echo ""

# Step 1: Check prerequisites
print_step "Checking prerequisites"
check_command "node" || { print_error "Please install Node.js first"; exit 1; }
check_command "npm" || { print_error "Please install NPM first"; exit 1; }
check_command "git" || { print_error "Please install Git first"; exit 1; }

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js $NODE_VERSION and NPM $NPM_VERSION available"

# Step 2: Install PM2 (user-level, no sudo)
print_step "Installing PM2 process manager (user-level)"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "PM2 installed globally for user"
else
    print_success "PM2 already available"
fi

# Step 3: Create directory structure
print_step "Creating user directory structure"
mkdir -p "$PROJECT_DIR"
mkdir -p "$WEB_ROOT"
mkdir -p "$USER_HOME/logs"
mkdir -p "$USER_HOME/backups"
print_success "User directories created"

# Step 4: Clone or update application
print_step "Setting up application from Git repository"
if [ -d "$PROJECT_DIR/.git" ]; then
    print_warning "Git repository found, pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main || git pull origin master
else
    print_warning "Cloning repository..."
    if [ -d "$PROJECT_DIR" ] && [ "$(ls -A $PROJECT_DIR)" ]; then
        # Backup existing files
        BACKUP_DIR="$USER_HOME/backups/backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r "$PROJECT_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
        print_warning "Existing files backed up to $BACKUP_DIR"
    fi
    
    rm -rf "$PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Make scripts executable
chmod +x deploy/*.sh 2>/dev/null || true
print_success "Application repository ready"

# Step 5: Install dependencies and build
print_step "Installing dependencies and building application"

# Create environment files
cat > backend/.env << EOL
NODE_ENV=production
PORT=$BACKEND_PORT
HOST=0.0.0.0

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db

# Secrets (CHANGE THESE IN PRODUCTION!)
APP_KEYS=$(openssl rand -base64 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
API_TOKEN_SALT=$(openssl rand -base64 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
ADMIN_JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date | md5sum | cut -d' ' -f1)

# File Upload
UPLOAD_DIR=./public/uploads

# Enable admin panel
STRAPI_DISABLE_REMOTE_DATA_TRANSFER=false
STRAPI_ADMIN_PANEL_ENABLED=true
EOL

# Frontend environment
cat > frontend/.env.production << EOL
VITE_API_URL=http://localhost:$BACKEND_PORT/api
VITE_STRAPI_URL=http://localhost:$BACKEND_PORT
EOL

# Generate api.ts from template if needed
if [ ! -f "frontend/src/lib/api.ts" ] && [ -f "frontend/src/lib/api.ts.template" ]; then
    print_warning "Generating api.ts from template..."
    STRAPI_TOKEN=$(openssl rand -hex 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
    sed "s/YOUR_STRAPI_TOKEN_HERE/$STRAPI_TOKEN/" frontend/src/lib/api.ts.template > frontend/src/lib/api.ts
    print_success "api.ts generated"
fi

# Install and build backend
cd backend
npm install --production
npm run build
cd ..

# Install and build frontend
cd frontend
npm install
npm run build
cd ..

# Create necessary directories
mkdir -p backend/data
mkdir -p backend/public/uploads
chmod 755 backend/public/uploads
chmod 755 backend/data

# Copy frontend build to web root
print_warning "Copying frontend build to web root: $WEB_ROOT"
if [ -d "frontend/dist" ]; then
    cp -r frontend/dist/* "$WEB_ROOT/"
    print_success "Frontend deployed to web root"
else
    print_warning "Frontend build directory not found"
fi

print_success "Application built and configured"

# Step 6: Start application with PM2
print_step "Starting application with PM2"

# Stop existing processes
pm2 stop alex-backend 2>/dev/null || true
pm2 delete alex-backend 2>/dev/null || true

# Start backend
cd backend
pm2 start npm --name "alex-backend" -- start
pm2 save

print_success "Backend started with PM2 on port $BACKEND_PORT"

# Step 7: Setup simple HTTP server for frontend (optional)
print_step "Setting up frontend server (optional)"
if command -v python3 &> /dev/null; then
    pm2 stop alex-frontend 2>/dev/null || true
    pm2 delete alex-frontend 2>/dev/null || true
    
    cd "$WEB_ROOT"
    pm2 start python3 --name "alex-frontend" -- -m http.server $FRONTEND_PORT
    pm2 save
    print_success "Frontend server started on port $FRONTEND_PORT"
elif command -v serve &> /dev/null; then
    pm2 stop alex-frontend 2>/dev/null || true
    pm2 delete alex-frontend 2>/dev/null || true
    
    cd "$WEB_ROOT"
    pm2 start serve --name "alex-frontend" -- -s . -p $FRONTEND_PORT
    pm2 save
    print_success "Frontend server started with 'serve' on port $FRONTEND_PORT"
else
    print_warning "No simple HTTP server available (python3 or serve)"
    print_warning "Frontend files are in: $WEB_ROOT"
    print_warning "You can serve them with any web server"
fi

# Step 8: Final status and instructions
print_step "Deployment completed - Final status"

echo ""
echo "🎉 USER-LEVEL DEPLOYMENT COMPLETED! 🎉"
echo "======================================"
echo ""

echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Your application is accessible at:"
echo "  • Backend API: http://localhost:$BACKEND_PORT"
echo "  • Strapi Admin: http://localhost:$BACKEND_PORT/admin"
if pm2 list | grep -q alex-frontend; then
    echo "  • Frontend: http://localhost:$FRONTEND_PORT"
fi
echo "  • Web Files: $WEB_ROOT"
echo ""

echo "🛠️  Management Commands:"
echo "  • Check status: pm2 status"
echo "  • View logs: pm2 logs"
echo "  • Restart: pm2 restart all"
echo "  • Stop: pm2 stop all"
echo "  • Monitor: pm2 monit"
echo ""

echo "📁 Important Paths:"
echo "  • Project: $PROJECT_DIR"
echo "  • Web Root: $WEB_ROOT"
echo "  • Database: $PROJECT_DIR/backend/data/data.db"
echo "  • Uploads: $PROJECT_DIR/backend/public/uploads/"
echo "  • Logs: $USER_HOME/logs/"
echo "  • Backups: $USER_HOME/backups/"
echo ""

echo "🔄 Next Steps:"
echo "1. Configure your web server (Nginx/Apache) to serve:"
echo "   - Static files from: $WEB_ROOT"
echo "   - API proxy to: http://localhost:$BACKEND_PORT"
echo "2. Setup domain DNS to point to your server"
echo "3. Configure SSL certificate for HTTPS"
echo ""

print_success "USER-LEVEL DEPLOYMENT COMPLETED! 🚀"

echo "Note: This deployment runs entirely in user space without sudo privileges."
echo "For production use, consider using a proper web server with SSL."