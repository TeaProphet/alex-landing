#!/bin/bash

# User-Level Maintenance Script for Alexander Paskhalis Fitness Trainer Website
# No sudo privileges required

USER_HOME="$HOME"
PROJECT_DIR="$USER_HOME/fitness-trainer"
WEB_ROOT="$USER_HOME/www/fitness-trainer.online"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_DIR="$USER_HOME/logs"
BACKUP_DIR="$USER_HOME/backups"

show_help() {
    echo "🔧 Fitness Trainer Website Maintenance Script (User-Level)"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status      Show application status"
    echo "  restart     Restart the application"
    echo "  logs        Show recent logs"
    echo "  update      Update the application"
    echo "  backup      Create a backup"
    echo "  monitor     Show real-time monitoring"
    echo "  cleanup     Clean up old logs and temporary files"
    echo "  health      Run health checks"
    echo "  help        Show this help message"
}

show_status() {
    echo "📊 Application Status (User-Level)"
    echo "=================================="
    echo ""
    
    # Detect OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "🖥️  Operating System: $NAME"
        echo "👤 User: $(whoami)"
        echo ""
    fi
    
    echo "🔄 PM2 Status:"
    if command -v pm2 &> /dev/null; then
        pm2 status
    else
        echo "PM2 not available"
    fi
    echo ""
    
    echo "💾 Disk Usage (User Directories):"
    du -sh "$USER_HOME" 2>/dev/null || echo "Cannot check user directory size"
    du -sh "$PROJECT_DIR" 2>/dev/null || echo "Project directory not found"
    du -sh "$WEB_ROOT" 2>/dev/null || echo "Web root not found"
    echo ""
    
    echo "🧠 Memory Usage:"
    free -h 2>/dev/null || echo "Cannot check system memory"
    echo ""
    
    echo "🌡️  System Load:"
    uptime 2>/dev/null || echo "Cannot check system load"
    
    echo ""
    echo "📁 Directory Status:"
    echo "  • Project Dir: $([ -d "$PROJECT_DIR" ] && echo "✅ Exists" || echo "❌ Missing")"
    echo "  • Web Root: $([ -d "$WEB_ROOT" ] && echo "✅ Exists" || echo "❌ Missing")"
    echo "  • Backend: $([ -d "$BACKEND_DIR" ] && echo "✅ Exists" || echo "❌ Missing")"
    echo "  • Database: $([ -f "$BACKEND_DIR/data/data.db" ] && echo "✅ Exists" || echo "❌ Missing")"
}

restart_app() {
    echo "🔄 Restarting application..."
    
    if command -v pm2 &> /dev/null; then
        pm2 restart all
        echo "✅ Application restarted via PM2"
    else
        echo "❌ PM2 not available - cannot restart"
        return 1
    fi
}

show_logs() {
    echo "📋 Recent Application Logs"
    echo "=========================="
    
    if command -v pm2 &> /dev/null; then
        echo "🔄 PM2 Logs:"
        pm2 logs --lines 50
    else
        echo "❌ PM2 not available"
    fi
    
    if [ -d "$LOG_DIR" ]; then
        echo ""
        echo "📁 User Log Files:"
        ls -la "$LOG_DIR"
    fi
}

update_app() {
    echo "🔄 Updating application..."
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        cd "$PROJECT_DIR"
        
        echo "📥 Pulling latest changes..."
        git pull origin main || git pull origin master
        
        echo "🔧 Installing backend dependencies..."
        cd backend
        npm install --production
        npm run build
        cd ..
        
        echo "🎨 Building frontend..."
        cd frontend
        npm install
        npm run build
        cd ..
        
        echo "📦 Updating web root..."
        if [ -d "frontend/dist" ]; then
            cp -r frontend/dist/* "$WEB_ROOT/"
        fi
        
        echo "🔄 Restarting services..."
        if command -v pm2 &> /dev/null; then
            pm2 restart all
        fi
        
        echo "✅ Application updated successfully"
    else
        echo "❌ Not a git repository - cannot update"
        return 1
    fi
}

backup_app() {
    echo "💾 Creating application backup..."
    
    BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if [ -f "$BACKEND_DIR/data/data.db" ]; then
        cp "$BACKEND_DIR/data/data.db" "$BACKUP_PATH/database.db"
        echo "✅ Database backed up"
    fi
    
    # Backup uploads
    if [ -d "$BACKEND_DIR/public/uploads" ]; then
        cp -r "$BACKEND_DIR/public/uploads" "$BACKUP_PATH/"
        echo "✅ Uploads backed up"
    fi
    
    # Backup configuration
    if [ -f "$BACKEND_DIR/.env" ]; then
        cp "$BACKEND_DIR/.env" "$BACKUP_PATH/backend.env"
        echo "✅ Backend config backed up"
    fi
    
    if [ -f "$PROJECT_DIR/frontend/.env.production" ]; then
        cp "$PROJECT_DIR/frontend/.env.production" "$BACKUP_PATH/frontend.env"
        echo "✅ Frontend config backed up"
    fi
    
    # Create backup info
    cat > "$BACKUP_PATH/backup_info.txt" << EOL
Backup created: $(date)
User: $(whoami)
Project directory: $PROJECT_DIR
Web root: $WEB_ROOT
Git commit: $(cd "$PROJECT_DIR" && git rev-parse HEAD 2>/dev/null || echo "Unknown")
EOL
    
    echo "✅ Backup completed: $BACKUP_PATH"
}

monitor_app() {
    echo "📊 Real-time Application Monitoring"
    echo "==================================="
    
    if command -v pm2 &> /dev/null; then
        pm2 monit
    else
        echo "❌ PM2 not available for monitoring"
        echo "📋 Alternative monitoring:"
        while true; do
            clear
            echo "📊 Application Status - $(date)"
            echo "=============================="
            show_status
            sleep 5
        done
    fi
}

cleanup_app() {
    echo "🧹 Cleaning up application..."
    
    # Clean PM2 logs
    if command -v pm2 &> /dev/null; then
        pm2 flush
        echo "✅ PM2 logs cleaned"
    fi
    
    # Clean old backups (keep last 10)
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +11 | xargs -r rm -rf
        echo "✅ Old backups cleaned (kept last 10)"
    fi
    
    # Clean node_modules cache
    if [ -d "$PROJECT_DIR" ]; then
        find "$PROJECT_DIR" -name "node_modules" -type d -exec du -sh {} \; 2>/dev/null || true
        echo "💡 To free space, run: find $PROJECT_DIR -name 'node_modules' -type d -exec rm -rf {} +"
    fi
    
    echo "✅ Cleanup completed"
}

health_check() {
    echo "🏥 Application Health Check"
    echo "=========================="
    
    # Check if processes are running
    if command -v pm2 &> /dev/null; then
        echo "🔄 PM2 Process Status:"
        pm2 status
        echo ""
    fi
    
    # Check backend health
    BACKEND_PORT=$(grep "^PORT=" "$BACKEND_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "3000")
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT" | grep -q "200\|404"; then
        echo "✅ Backend is responding on port $BACKEND_PORT"
    else
        echo "❌ Backend is not responding on port $BACKEND_PORT"
    fi
    
    # Check database
    if [ -f "$BACKEND_DIR/data/data.db" ]; then
        DB_SIZE=$(du -sh "$BACKEND_DIR/data/data.db" | cut -f1)
        echo "✅ Database exists (size: $DB_SIZE)"
    else
        echo "❌ Database file missing"
    fi
    
    # Check uploads directory
    if [ -d "$BACKEND_DIR/public/uploads" ]; then
        UPLOAD_COUNT=$(find "$BACKEND_DIR/public/uploads" -type f | wc -l)
        echo "✅ Uploads directory exists ($UPLOAD_COUNT files)"
    else
        echo "❌ Uploads directory missing"
    fi
    
    # Check frontend files
    if [ -f "$WEB_ROOT/index.html" ]; then
        echo "✅ Frontend files exist"
    else
        echo "❌ Frontend files missing"
    fi
}

# Main script logic
case "$1" in
    status)
        show_status
        ;;
    restart)
        restart_app
        ;;
    logs)
        show_logs
        ;;
    update)
        update_app
        ;;
    backup)
        backup_app
        ;;
    monitor)
        monitor_app
        ;;
    cleanup)
        cleanup_app
        ;;
    health)
        health_check
        ;;
    help|*)
        show_help
        ;;
esac