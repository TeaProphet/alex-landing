#!/bin/bash

# User-Level Backup Script for Alexander Paskhalis Fitness Trainer Website
# No sudo privileges required

set -e

USER_HOME="$HOME"
PROJECT_DIR="$USER_HOME/fitness-trainer"
WEB_ROOT="$USER_HOME/www/fitness-trainer.online"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKUP_BASE_DIR="$USER_HOME/backups"
BACKUP_DIR="$BACKUP_BASE_DIR/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "🖥️  Operating System: $NAME"
fi

echo "💾 Starting user-level backup process..."
echo "👤 User: $(whoami)"
echo "📁 Project: $PROJECT_DIR"
echo "📦 Backup to: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database (SQLite)
echo "🗄️  Backing up database..."
if [ -f "$BACKEND_DIR/data/data.db" ]; then
    cp "$BACKEND_DIR/data/data.db" "$BACKUP_DIR/database.db"
    echo "✅ Database backed up"
else
    echo "⚠️  Database file not found, skipping..."
fi

# Backup uploaded files
echo "📁 Backing up uploaded files..."
if [ -d "$BACKEND_DIR/public/uploads" ]; then
    cp -r "$BACKEND_DIR/public/uploads" "$BACKUP_DIR/"
    echo "✅ Uploaded files backed up"
else
    echo "⚠️  Uploads directory not found, skipping..."
fi

# Backup configuration files
echo "⚙️  Backing up configuration..."
if [ -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env" "$BACKUP_DIR/backend.env"
    echo "✅ Backend configuration backed up"
fi

if [ -f "$PROJECT_DIR/frontend/.env.production" ]; then
    cp "$PROJECT_DIR/frontend/.env.production" "$BACKUP_DIR/frontend.env"
    echo "✅ Frontend configuration backed up"
fi

# Backup frontend build
echo "🎨 Backing up frontend files..."
if [ -d "$WEB_ROOT" ]; then
    mkdir -p "$BACKUP_DIR/frontend"
    cp -r "$WEB_ROOT"/* "$BACKUP_DIR/frontend/" 2>/dev/null || true
    echo "✅ Frontend files backed up"
fi

# Backup PM2 configuration
echo "🔄 Backing up PM2 configuration..."
if command -v pm2 &> /dev/null; then
    pm2 save
    if [ -f "$HOME/.pm2/dump.pm2" ]; then
        cp "$HOME/.pm2/dump.pm2" "$BACKUP_DIR/pm2-processes.json"
        echo "✅ PM2 configuration backed up"
    fi
fi

# Create backup metadata
cat > "$BACKUP_DIR/backup_info.txt" << EOL
=== FITNESS TRAINER WEBSITE BACKUP ===
Backup Date: $(date)
User: $(whoami)
Hostname: $(hostname)
OS: $NAME
Project Directory: $PROJECT_DIR
Web Root: $WEB_ROOT

Files Included:
- Database: $([ -f "$BACKUP_DIR/database.db" ] && echo "✅ Yes" || echo "❌ No")
- Uploads: $([ -d "$BACKUP_DIR/uploads" ] && echo "✅ Yes" || echo "❌ No")
- Backend Config: $([ -f "$BACKUP_DIR/backend.env" ] && echo "✅ Yes" || echo "❌ No")
- Frontend Config: $([ -f "$BACKUP_DIR/frontend.env" ] && echo "✅ Yes" || echo "❌ No")
- Frontend Files: $([ -d "$BACKUP_DIR/frontend" ] && echo "✅ Yes" || echo "❌ No")
- PM2 Config: $([ -f "$BACKUP_DIR/pm2-processes.json" ] && echo "✅ Yes" || echo "❌ No")

Git Information:
$(cd "$PROJECT_DIR" 2>/dev/null && {
    echo "Repository: $(git config --get remote.origin.url 2>/dev/null || echo 'Unknown')"
    echo "Branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
    echo "Commit: $(git rev-parse HEAD 2>/dev/null || echo 'Unknown')"
    echo "Last Commit: $(git log -1 --format='%cd - %s' 2>/dev/null || echo 'Unknown')"
} || echo "Not a git repository")

Restore Instructions:
1. Stop the application: pm2 stop all
2. Restore database: cp database.db $BACKEND_DIR/data/
3. Restore uploads: cp -r uploads/* $BACKEND_DIR/public/uploads/
4. Restore configs: cp *.env to appropriate locations
5. Start application: pm2 start all
EOL

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

# Compress backup (optional)
echo "📦 Compressing backup..."
cd "$BACKUP_BASE_DIR"
tar -czf "${BACKUP_DIR##*/}.tar.gz" "${BACKUP_DIR##*/}"
if [ $? -eq 0 ]; then
    rm -rf "$BACKUP_DIR"
    BACKUP_FILE="${BACKUP_DIR}.tar.gz"
    COMPRESSED_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup compressed: $COMPRESSED_SIZE"
else
    BACKUP_FILE="$BACKUP_DIR"
    echo "⚠️  Compression failed, keeping uncompressed backup"
fi

# Clean old backups
echo "🧹 Cleaning old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_BASE_DIR" -name "backup-*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_BASE_DIR" -name "20*" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

# Show backup summary
echo ""
echo "✅ BACKUP COMPLETED SUCCESSFULLY!"
echo "================================="
echo "📁 Backup Location: $BACKUP_FILE"
echo "📏 Backup Size: $BACKUP_SIZE"
echo "🕒 Created: $(date)"
echo ""
echo "📋 Backup Contents:"
ls -la "$BACKUP_BASE_DIR" | grep "$(date +%Y%m%d)" || ls -la "$BACKUP_FILE" 2>/dev/null || echo "Backup file listing unavailable"
echo ""
echo "💡 To restore from this backup:"
echo "   tar -xzf '$BACKUP_FILE'"
echo "   # Then follow instructions in backup_info.txt"
echo ""
echo "🗂️  All backups:"
ls -la "$BACKUP_BASE_DIR" | grep -E "(backup-|\.tar\.gz)" | tail -5