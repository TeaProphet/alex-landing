#!/bin/bash

# One-Click Deploy Script for fitness-trainer.online
# Ubuntu VPS Deployment Script
# Usage: curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/alex-landing/master/deploy.sh | bash

set -e

# Configuration
DOMAIN="fitness-trainer.online"
PROJECT_NAME="alex-landing"
GITHUB_REPO="https://github.com/TeaProphet/alex-landing"  # Update with your GitHub URL
PROJECT_DIR="/opt/$PROJECT_NAME"
ADMIN_EMAIL="admin@$DOMAIN"
ADMIN_PASSWORD="$(openssl rand -base64 32)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if user has sudo privileges
if ! sudo -n true 2>/dev/null; then
    error "This script requires sudo privileges. Please run: sudo -v"
fi

log "🚀 Starting deployment for $DOMAIN"
log "📋 Project: $PROJECT_NAME"
log "📁 Deploy location: $PROJECT_DIR"

# Update system
log "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
log "🔧 Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
log "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    log "✅ Docker installed successfully"
else
    log "✅ Docker already installed"
fi

# Install Docker Compose
log "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log "✅ Docker Compose installed successfully"
else
    log "✅ Docker Compose already installed"
fi

# Install Node.js
log "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    log "✅ Node.js $(node --version) installed successfully"
else
    log "✅ Node.js $(node --version) already installed"
fi

# Install Nginx
log "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    log "✅ Nginx installed successfully"
else
    log "✅ Nginx already installed"
fi

# Install Certbot for SSL
log "🔒 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    log "✅ Certbot installed successfully"
else
    log "✅ Certbot already installed"
fi

# Clone or update project
log "📥 Cloning project..."
if [ -d "$PROJECT_DIR" ]; then
    log "📁 Project directory exists, updating..."
    cd "$PROJECT_DIR"
    git pull origin master
else
    log "📂 Creating project directory..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
    git clone "$GITHUB_REPO" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Setup backend environment
log "⚙️ Setting up backend environment..."
cd "$PROJECT_DIR/backend"

# Create production .env file
cat > .env << EOF
# Directus Configuration
KEY="directus-production-key-$(openssl rand -hex 32)"
SECRET="directus-production-secret-$(openssl rand -hex 32)"

# Database
DB_CLIENT="sqlite3"
DB_FILENAME="./database/database.sqlite"

# Admin User
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASSWORD"

# Server
HOST=0.0.0.0
PORT=1337
PUBLIC_URL="https://$DOMAIN"

# Assets
ASSETS_CACHE_TTL="30d"
ASSETS_TRANSFORM_MAX_CONCURRENT=2

# Language
LANGUAGE="ru-RU"

# CORS settings
CORS_ENABLED="true"
CORS_ORIGIN="https://$DOMAIN"

# Security
STORAGE_LOCATIONS="local"
STORAGE_LOCAL_ROOT="./uploads"

# Rate limiting for VPS
RATE_LIMITER_ENABLED=true
RATE_LIMITER_POINTS=100
RATE_LIMITER_DURATION=60
EOF

log "✅ Backend environment configured"

# Create production docker-compose
log "🐳 Creating production Docker Compose configuration..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  directus:
    image: directus/directus:10.10.0
    container_name: directus-production
    restart: unless-stopped
    ports:
      - "127.0.0.1:1337:8055"
    volumes:
      - ./uploads:/directus/uploads
      - ./database:/directus/database
    env_file:
      - .env
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

networks:
  default:
    name: alex-landing-network
EOF

# Start backend services
log "🚀 Starting backend services..."
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml up -d

# Wait for Directus to be ready
log "⏳ Waiting for Directus to be ready..."
for i in {1..30}; do
    if curl -f http://localhost:1337/server/health &> /dev/null; then
        log "✅ Directus is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        error "❌ Directus failed to start after 5 minutes"
    fi
    sleep 10
done

# Build frontend
log "🏗️ Building frontend..."
cd "$PROJECT_DIR/frontend"

# Install dependencies
npm ci --only=production

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN
EOF

# Build frontend
npm run build

# Setup Nginx configuration
log "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Root directory
    root $PROJECT_DIR/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Main application
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Directus API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:1337/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts for large file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Directus assets proxy
    location /assets/ {
        proxy_pass http://127.0.0.1:1337/assets/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Cache assets
        proxy_cache_valid 200 1d;
        add_header X-Cache-Status \$upstream_cache_status;
    }

    # Directus items proxy
    location /items/ {
        proxy_pass http://127.0.0.1:1337/items/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Directus files proxy  
    location /files/ {
        proxy_pass http://127.0.0.1:1337/files/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(config|logs|temp) {
        deny all;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if ! sudo nginx -t; then
    error "❌ Nginx configuration is invalid"
fi

# Restart Nginx
sudo systemctl restart nginx

log "✅ Nginx configured successfully"

# Setup SSL with Let's Encrypt
log "🔒 Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect

# Setup automatic certificate renewal
sudo systemctl enable certbot.timer

# Create systemd service for the application
log "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/alex-landing.service > /dev/null << EOF
[Unit]
Description=Alex Landing Page Application
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable alex-landing.service

# Setup log rotation
log "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/alex-landing > /dev/null << EOF
$PROJECT_DIR/backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        docker-compose -f $PROJECT_DIR/backend/docker-compose.prod.yml restart directus
    endscript
}
EOF

# Setup firewall
log "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Setup monitoring script
log "📊 Creating monitoring script..."
sudo tee /usr/local/bin/alex-landing-monitor.sh > /dev/null << EOF
#!/bin/bash

# Health check script
check_service() {
    if ! curl -f http://localhost:1337/server/health &> /dev/null; then
        echo "Directus is down, restarting..."
        cd $PROJECT_DIR/backend
        docker-compose -f docker-compose.prod.yml restart directus
    fi
}

check_service
EOF

sudo chmod +x /usr/local/bin/alex-landing-monitor.sh

# Add monitoring to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/alex-landing-monitor.sh") | crontab -

# Final checks
log "🔍 Running final health checks..."

# Check if Directus is running
if ! curl -f http://localhost:1337/server/health &> /dev/null; then
    warn "⚠️ Directus health check failed, but continuing..."
fi

# Check if Nginx is running
if ! sudo systemctl is-active --quiet nginx; then
    error "❌ Nginx is not running"
fi

# Check if site is accessible
if ! curl -f https://$DOMAIN &> /dev/null; then
    warn "⚠️ Site is not yet accessible via HTTPS, SSL might still be propagating..."
fi

# Create deployment info file
cat > "$PROJECT_DIR/deployment-info.txt" << EOF
=== DEPLOYMENT INFORMATION ===
Domain: https://$DOMAIN
Admin Panel: https://$DOMAIN/admin
Admin Email: $ADMIN_EMAIL
Admin Password: $ADMIN_PASSWORD

Backend API: https://$DOMAIN/api/
Health Check: https://$DOMAIN/api/server/health

Project Directory: $PROJECT_DIR
Log Files: $PROJECT_DIR/backend/logs/
Nginx Config: /etc/nginx/sites-available/$DOMAIN

=== USEFUL COMMANDS ===
Restart Backend: cd $PROJECT_DIR/backend && docker-compose -f docker-compose.prod.yml restart
View Logs: cd $PROJECT_DIR/backend && docker-compose -f docker-compose.prod.yml logs -f
Update Project: cd $PROJECT_DIR && git pull && ./deploy.sh
Renew SSL: sudo certbot renew

=== MONITORING ===
Health monitoring runs every 5 minutes via cron
Logs are rotated daily and kept for 7 days
Firewall is enabled with SSH and HTTP/HTTPS access only

Deployment completed at: $(date)
EOF

log "🎉 Deployment completed successfully!"
log "📋 Deployment information saved to: $PROJECT_DIR/deployment-info.txt"
log ""
log "🌐 Your site should be available at: https://$DOMAIN"
log "⚙️ Directus admin panel: https://$DOMAIN/admin"
log "👤 Admin credentials:"
log "   Email: $ADMIN_EMAIL"
log "   Password: $ADMIN_PASSWORD"
log ""
log "📝 Please save your admin credentials securely!"
log "📖 Check deployment-info.txt for more details and useful commands"
log ""
log "🔄 To update your site in the future, run:"
log "   cd $PROJECT_DIR && git pull && ./deploy.sh"

warn "⚠️ Please point your domain DNS to this server's IP address if you haven't already"
warn "⚠️ SSL certificate may take a few minutes to become active"