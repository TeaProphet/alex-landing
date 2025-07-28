#!/bin/bash

# Backup Script for Alexander Paskhalis Fitness Trainer Website

set -e

PROJECT_DIR="/var/www/fitness-trainer"
BACKUP_BASE_DIR="/var/backups/fitness-trainer"
BACKUP_DIR="$BACKUP_BASE_DIR/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30

echo "💾 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database (SQLite)
echo "🗄️  Backing up database..."
if [ -f "$PROJECT_DIR/backend/data/data.db" ]; then
    cp "$PROJECT_DIR/backend/data/data.db" "$BACKUP_DIR/database.db"
    echo "✅ Database backed up"
else
    echo "⚠️  Database file not found, skipping..."
fi

# Backup uploaded files
echo "📁 Backing up uploaded files..."
if [ -d "$PROJECT_DIR/backend/public/uploads" ]; then
    cp -r "$PROJECT_DIR/backend/public/uploads" "$BACKUP_DIR/"
    echo "✅ Uploaded files backed up"
else
    echo "⚠️  Uploads directory not found, skipping..."
fi

# Backup configuration files
echo "⚙️  Backing up configuration files..."
mkdir -p "$BACKUP_DIR/config"
cp "$PROJECT_DIR/backend/.env" "$BACKUP_DIR/config/" 2>/dev/null || echo "Backend .env not found"
cp "$PROJECT_DIR/frontend/.env.production" "$BACKUP_DIR/config/" 2>/dev/null || echo "Frontend .env.production not found"
cp "$PROJECT_DIR/ecosystem.config.js" "$BACKUP_DIR/config/" 2>/dev/null || echo "PM2 config not found"
cp "/etc/nginx/sites-available/fitness-trainer.online" "$BACKUP_DIR/config/nginx.conf" 2>/dev/null || echo "Nginx config not found"

# Create backup info file
cat > "$BACKUP_DIR/backup_info.txt" << EOL
Backup Information
==================
Date: $(date)
Server: $(hostname)
Project: Alexander Paskhalis Fitness Trainer Website
Database: SQLite
Files: Strapi uploads, configurations

Contents:
- database.db (SQLite database)
- uploads/ (uploaded images and files)
- config/ (environment and configuration files)

Restore Instructions:
1. Stop the application: pm2 stop alex-backend
2. Restore database: cp database.db $PROJECT_DIR/backend/data/
3. Restore uploads: cp -r uploads/* $PROJECT_DIR/backend/public/uploads/
4. Restore configs as needed
5. Restart application: pm2 start alex-backend
EOL

# Compress backup
echo "🗜️  Compressing backup..."
cd $BACKUP_BASE_DIR
tar -czf "backup_$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
COMPRESSED_SIZE=$(du -sh "backup_$(basename $BACKUP_DIR).tar.gz" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📊 Backup size: $BACKUP_SIZE (compressed: $COMPRESSED_SIZE)"
echo "📍 Location: $BACKUP_DIR"
echo "📦 Compressed: $BACKUP_BASE_DIR/backup_$(basename $BACKUP_DIR).tar.gz"

# Clean up old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_BASE_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_BASE_DIR -type d -name "*_*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

echo "✅ Backup process completed!"