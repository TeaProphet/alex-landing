#!/bin/bash

# Smart file sync script using rsync
# Much faster than SCP - only uploads changed files

SERVER_USER="your-username"
SERVER_IP="your-server-ip" 
SERVER_PATH="/var/www/fitness-trainer"

echo "🔄 Syncing files to server using rsync..."

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo "❌ rsync not found. Installing..."
    sudo apt update && sudo apt install -y rsync
fi

# Sync files with progress and smart exclusions  
rsync -avz --progress --stats \
    --exclude=node_modules \
    --exclude=.git \
    --exclude="*.log" \
    --exclude=dist \
    --exclude=build \
    --exclude=.env \
    --exclude=".DS_Store" \
    --exclude=".vscode" \
    --exclude="Thumbs.db" \
    --delete \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -eq 0 ]; then
    echo "✅ File sync completed successfully!"
    echo ""
    echo "🔄 Running deployment on server..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && ./deploy/deploy.sh"
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment completed!"
        echo "🌐 Your website should be updated at: https://fitness-trainer.online"
    else
        echo "❌ Deployment failed. Check server logs."
    fi
else
    echo "❌ File sync failed. Check connection and credentials."
fi