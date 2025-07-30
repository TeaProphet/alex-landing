#!/bin/bash

# Quick update script for production
# Run this on your VPS to update the application

set -e

PROJECT_DIR="/opt/alex-landing"
DOMAIN="fitness-trainer.online"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log "🔄 Starting application update..."

# Navigate to project directory
cd "$PROJECT_DIR"

# Pull latest changes
log "📥 Pulling latest changes from GitHub..."
git pull origin master

# Update backend
log "🐳 Updating backend services..."
cd "$PROJECT_DIR/backend"
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 10

# Update frontend
log "🏗️ Rebuilding frontend..."
cd "$PROJECT_DIR/frontend"
npm ci --only=production
npm run build

# Restart Nginx to clear any caches
log "🌐 Restarting Nginx..."
sudo systemctl reload nginx

# Health check
log "🔍 Running health check..."
if curl -f https://$DOMAIN/api/server/health &> /dev/null; then
    log "✅ Update completed successfully!"
    log "🌐 Site is available at: https://$DOMAIN"
else
    log "⚠️ Warning: Health check failed, but update completed"
    log "🔧 You may need to check the services manually"
fi

info "📊 Current status:"
info "   Backend: $(docker ps --filter name=directus-production --format "table {{.Status}}")"
info "   Nginx: $(sudo systemctl is-active nginx)"
info "   SSL: $(sudo certbot certificates 2>/dev/null | grep -A1 "Certificate Name: $DOMAIN" | tail -1 || echo "Check manually")"

log "🎉 Update process completed!"