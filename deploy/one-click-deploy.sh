#!/bin/bash

# 🚀 ONE-CLICK DEPLOYMENT SCRIPT
# Alexander Paskhalis Fitness Trainer Website
# Repository: https://github.com/TeaProphet/alex-landing
# Domain: fitness-trainer.online

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/fitness-trainer"
REPO_URL="https://github.com/TeaProphet/alex-landing.git"
DOMAIN="fitness-trainer.online"

# Progress tracking
STEP=0
TOTAL_STEPS=12

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
        print_error "$1 is not available"
        return 1
    fi
}

echo "🚀 Alexander Paskhalis Fitness Trainer - ONE-CLICK DEPLOYMENT"
echo "=============================================================="
echo "Repository: $REPO_URL"
echo "Domain: $DOMAIN"
echo "Target Directory: $PROJECT_DIR"
echo ""

# Step 1: System Update
print_step "Updating system packages"
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Step 2: Install essential packages
print_step "Installing essential packages"
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release htop
print_success "Essential packages installed"

# Step 3: Install Node.js 18
print_step "Installing Node.js 18"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js $NODE_VERSION and NPM $NPM_VERSION installed"

# Step 4: Install PM2
print_step "Installing PM2 process manager"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
print_success "PM2 installed globally"

# Step 5: Install and configure Nginx
print_step "Installing and configuring Nginx"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
fi

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create necessary directories
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo mkdir -p /var/www/html/fitness-trainer

# Backup original nginx.conf
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true

print_success "Nginx installed and started"

# Step 6: Install SSL tools
print_step "Installing SSL tools (Certbot)"
sudo apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Step 7: Configure firewall
print_step "Configuring firewall"
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_success "Firewall configured"

# Step 8: Clone and setup application
print_step "Setting up application from Git repository"

# Create application directory
sudo mkdir -p /var/www

# Handle existing installation
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Existing installation found, backing up..."
    sudo mv "$PROJECT_DIR" "${PROJECT_DIR}-backup-$(date +%Y%m%d_%H%M%S)"
fi

# Clone repository
sudo git clone "$REPO_URL" "$PROJECT_DIR"
sudo chown -R $USER:$USER "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Make scripts executable
chmod +x deploy/*.sh 2>/dev/null || true

print_success "Application repository cloned"

# Step 9: Install application dependencies and build
print_step "Installing dependencies and building application"

# Create environment files
cat > backend/.env << EOL
NODE_ENV=production
PORT=1337
HOST=0.0.0.0

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db

# Secrets (CHANGE THESE IN PRODUCTION!)
APP_KEYS=$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# File Upload
UPLOAD_DIR=./public/uploads
EOL

# Frontend environment
cat > frontend/.env.production << EOL
VITE_API_URL=http://$DOMAIN/api
VITE_STRAPI_URL=http://$DOMAIN
EOL

# Install root dependencies
npm install || true

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

# Set permissions
sudo chown -R $USER:www-data "$PROJECT_DIR"
sudo chmod -R 755 "$PROJECT_DIR"
sudo chmod -R 775 backend/public/uploads
sudo chmod -R 775 backend/data

# Copy frontend build to web directory
sudo rm -rf /var/www/html/fitness-trainer/*
sudo cp -r frontend/dist/* /var/www/html/fitness-trainer/
sudo chown -R www-data:www-data /var/www/html/fitness-trainer

print_success "Application built and configured"

# Step 10: Configure Nginx for the site
print_step "Configuring Nginx for $DOMAIN"

# Create main nginx.conf with sites-enabled support
sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Include sites
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create site configuration
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Root directory for frontend
    root /var/www/html/fitness-trainer;
    index index.html;
    
    # Frontend - Serve React SPA
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API - Proxy to Strapi
    location /api/ {
        proxy_pass http://127.0.0.1:1337/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Strapi Admin Panel
    location /admin {
        proxy_pass http://127.0.0.1:1337/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Serve uploaded images
    location /uploads/ {
        alias $PROJECT_DIR/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # Security - Block sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(env|ini|conf|bak|old|tmp)$ {
        deny all;
    }
    
    # Custom error pages
    error_page 404 /index.html;
    
    # Logging
    access_log /var/log/nginx/fitness-trainer-access.log;
    error_log /var/log/nginx/fitness-trainer-error.log;
}

# Redirect www to non-www
server {
    listen 80;
    listen [::]:80;
    server_name www.$DOMAIN;
    return 301 http://$DOMAIN\$request_uri;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t
sudo systemctl reload nginx

print_success "Nginx configured for $DOMAIN"

# Step 11: Start application with PM2
print_step "Starting application with PM2"

# Stop existing processes
pm2 stop alex-backend 2>/dev/null || true
pm2 delete alex-backend 2>/dev/null || true

# Start backend
cd backend
pm2 start dist/index.js --name "alex-backend" --env production
pm2 save

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

print_success "Application started with PM2"

# Step 12: Final status and instructions
print_step "Deployment completed - Final status"

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
echo "========================================"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || echo "Unable to detect")

echo "📊 System Status:"
echo "  • Node.js: $(node --version)"
echo "  • NPM: $(npm --version)"
echo "  • PM2: $(pm2 --version)"
echo "  • Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)"
echo "  • Server IP: $SERVER_IP"
echo ""

echo "🌐 Your website is accessible at:"
echo "  • http://$SERVER_IP"
echo "  • http://$DOMAIN (once DNS is configured)"
echo "  • http://$DOMAIN/admin (Strapi admin panel)"
echo ""

echo "📋 Application Status:"
pm2 status

echo ""
echo "🔒 Next Steps:"
echo "1. Point your domain $DOMAIN to server IP: $SERVER_IP"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Setup SSL certificate:"
echo "   cd $PROJECT_DIR/deploy"
echo "   nano setup-ssl.sh  # Edit email address"
echo "   ./setup-ssl.sh"
echo ""

echo "🛠️  Management Commands:"
echo "  • Check status: cd $PROJECT_DIR && ./deploy/maintenance.sh status"
echo "  • View logs: ./deploy/maintenance.sh logs"
echo "  • Restart: ./deploy/maintenance.sh restart"
echo "  • Backup: ./deploy/maintenance.sh backup"
echo ""

echo "📁 Important Paths:"
echo "  • Project: $PROJECT_DIR"
echo "  • Frontend: /var/www/html/fitness-trainer"
echo "  • Logs: /var/log/nginx/"
echo "  • Database: $PROJECT_DIR/backend/data/data.db"
echo "  • Uploads: $PROJECT_DIR/backend/public/uploads/"
echo ""

print_success "ONE-CLICK DEPLOYMENT COMPLETED! 🚀"

# Final health check
echo "🏥 Quick Health Check:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:1337 | grep -q "200\|404"; then
    print_success "Backend is responding"
else
    print_warning "Backend might not be ready yet (this is normal, wait 30 seconds)"
fi

if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_warning "Nginx is not running"
fi

echo ""
echo "🎯 Your Alexander Paskhalis Fitness Trainer website is now LIVE!"