#!/bin/bash

# Maintenance Script for Alexander Paskhalis Fitness Trainer Website

PROJECT_DIR="/var/www/fitness-trainer"
LOG_DIR="/var/log/fitness-trainer"

show_help() {
    echo "🔧 Fitness Trainer Website Maintenance Script"
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
    echo "📊 Application Status"
    echo "===================="
    echo ""
    
    echo "🔄 PM2 Status:"
    pm2 status
    echo ""
    
    echo "🌐 Nginx Status:"
    sudo systemctl status nginx --no-pager -l
    echo ""
    
    echo "💾 Disk Usage:"
    df -h / /var/www /var/log
    echo ""
    
    echo "🧠 Memory Usage:"
    free -h
    echo ""
    
    echo "🌡️  System Load:"
    uptime
}

restart_app() {
    echo "🔄 Restarting application..."
    
    # Restart PM2 process
    pm2 restart alex-backend
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    echo "✅ Application restarted successfully!"
    
    # Show status
    sleep 2
    pm2 status
}

show_logs() {
    echo "📋 Recent Application Logs"
    echo "=========================="
    echo ""
    
    echo "🔹 PM2 Logs (last 50 lines):"
    pm2 logs alex-backend --lines 50 --nostream
    echo ""
    
    echo "🔹 Nginx Error Log (last 20 lines):"
    sudo tail -n 20 /var/log/nginx/fitness-trainer-error.log 2>/dev/null || echo "No error log found"
    echo ""
    
    echo "🔹 Nginx Access Log (last 10 lines):"
    sudo tail -n 10 /var/log/nginx/fitness-trainer-access.log 2>/dev/null || echo "No access log found"
}

update_app() {
    echo "📦 Updating application..."
    
    cd $PROJECT_DIR
    
    # Backup current version
    echo "💾 Creating backup before update..."
    ./deploy/backup.sh
    
    # Pull latest changes (if using git)
    if [ -d ".git" ]; then
        echo "🔄 Pulling latest changes..."
        git pull origin main
    fi
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    cd backend && npm install --production && cd ..
    cd frontend && npm install && cd ..
    
    # Build applications
    echo "🔨 Building applications..."
    cd backend && npm run build && cd ..
    cd frontend && npm run build && cd ..
    
    # Copy frontend files
    echo "📁 Updating frontend files..."
    sudo rm -rf /var/www/html/fitness-trainer/*
    sudo cp -r frontend/dist/* /var/www/html/fitness-trainer/
    sudo chown -R www-data:www-data /var/www/html/fitness-trainer
    
    # Restart application
    restart_app
    
    echo "✅ Update completed successfully!"
}

run_backup() {
    echo "💾 Running backup..."
    $PROJECT_DIR/deploy/backup.sh
}

monitor_app() {
    echo "👁️  Real-time Monitoring (Press Ctrl+C to exit)"
    echo "=============================================="
    
    # Start monitoring in background
    pm2 monit &
    MONIT_PID=$!
    
    # Also show logs
    echo ""
    echo "📋 Live Logs:"
    pm2 logs alex-backend --lines 0 &
    LOGS_PID=$!
    
    # Wait for user interrupt
    trap "kill $MONIT_PID $LOGS_PID 2>/dev/null; exit 0" INT
    wait
}

cleanup() {
    echo "🧹 Cleaning up system..."
    
    # Clean PM2 logs
    echo "🔹 Cleaning PM2 logs..."
    pm2 flush
    
    # Clean old log files
    echo "🔹 Cleaning old log files..."
    sudo find /var/log/nginx -name "*.log" -mtime +30 -delete 2>/dev/null || true
    sudo find $LOG_DIR -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Clean temporary files
    echo "🔹 Cleaning temporary files..."
    sudo find /tmp -name "*.tmp" -mtime +7 -delete 2>/dev/null || true
    
    # Clean package caches
    echo "🔹 Cleaning package caches..."
    sudo apt autoremove -y
    sudo apt autoclean
    
    # Clean npm cache
    npm cache clean --force
    
    echo "✅ Cleanup completed!"
}

health_check() {
    echo "🏥 Running Health Checks"
    echo "======================="
    echo ""
    
    # Check if application is responding
    echo "🔹 Checking application response..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/api/health | grep -q "200\|404"; then
        echo "✅ Application is responding"
    else
        echo "❌ Application is not responding"
    fi
    
    # Check disk space
    echo "🔹 Checking disk space..."
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 80 ]; then
        echo "✅ Disk space OK ($DISK_USAGE%)"
    else
        echo "⚠️  Disk space warning ($DISK_USAGE%)"
    fi
    
    # Check memory usage
    echo "🔹 Checking memory usage..."
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEM_USAGE -lt 80 ]; then
        echo "✅ Memory usage OK ($MEM_USAGE%)"
    else
        echo "⚠️  Memory usage warning ($MEM_USAGE%)"
    fi
    
    # Check SSL certificate (if exists)
    echo "🔹 Checking SSL certificate..."
    if [ -f "/etc/letsencrypt/live/fitness-trainer.online/cert.pem" ]; then
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/fitness-trainer.online/cert.pem | cut -d= -f2)
        EXPIRY_DATE=$(date -d "$EXPIRY" +%s)
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            echo "✅ SSL certificate OK ($DAYS_LEFT days left)"
        else
            echo "⚠️  SSL certificate expires soon ($DAYS_LEFT days left)"
        fi
    else
        echo "ℹ️  No SSL certificate found"
    fi
    
    echo ""
    echo "Health check completed!"
}

# Main script logic
case $1 in
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
        run_backup
        ;;
    monitor)
        monitor_app
        ;;
    cleanup)
        cleanup
        ;;
    health)
        health_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac