#!/bin/bash

# Quick Upload Script for VPS deployment
# Much faster than SCP for regular updates

SERVER_USER="your-username"
SERVER_IP="your-server-ip"
SERVER_PATH="/var/www/fitness-trainer"

echo "🚀 Quick upload to VPS server..."

if [ "$1" = "git" ]; then
    echo "📡 Using Git deployment (fastest for updates)..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && git pull origin main && ./deploy/deploy.sh"
    
elif [ "$1" = "rsync" ]; then
    echo "🔄 Using Rsync (smart sync)..."
    rsync -avz --progress \
        --exclude node_modules \
        --exclude .git \
        --exclude "*.log" \
        --exclude dist \
        --exclude build \
        ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/
    
    echo "🔄 Running deployment on server..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && ./deploy/deploy.sh"
    
elif [ "$1" = "compress" ]; then
    echo "📦 Compressing and uploading..."
    
    # Create compressed archive excluding unnecessary files
    tar -czf /tmp/alex-landing.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude="*.log" \
        --exclude=dist \
        --exclude=build \
        .
    
    echo "📡 Uploading compressed file..."
    scp /tmp/alex-landing.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
    
    echo "📂 Extracting on server..."
    ssh $SERVER_USER@$SERVER_IP "
        cd /var/www && 
        sudo rm -rf fitness-trainer && 
        tar -xzf /tmp/alex-landing.tar.gz && 
        sudo mv alex-landing fitness-trainer && 
        cd fitness-trainer && 
        ./deploy/deploy.sh
    "
    
    # Cleanup
    rm /tmp/alex-landing.tar.gz
    
else
    echo "❌ Usage: $0 [git|rsync|compress]"
    echo ""
    echo "Options:"
    echo "  git      - Use Git pull (fastest for updates)"
    echo "  rsync    - Sync only changed files" 
    echo "  compress - Compress and upload everything"
    echo ""
    echo "Examples:"
    echo "  $0 git      # Fastest for code updates"
    echo "  $0 rsync    # Good for mixed changes"
    echo "  $0 compress # First-time upload"
    exit 1
fi

echo "✅ Upload completed!"