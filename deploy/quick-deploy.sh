#!/bin/bash

# Ultra-Quick Deployment Script for Ubuntu VPS
# Repository: https://github.com/TeaProphet/alex-landing

set -e

SERVER_IP=""
USERNAME=""

echo "🚀 Alexander Paskhalis Fitness Trainer - Quick Deploy"
echo "====================================================="

# Get server details if not provided
if [ -z "$SERVER_IP" ]; then
    read -p "Enter your Ubuntu VPS IP address: " SERVER_IP
fi

if [ -z "$USERNAME" ]; then
    read -p "Enter your username: " USERNAME
fi

echo ""
echo "🎯 Deploying to: $USERNAME@$SERVER_IP"
echo "📋 Repository: https://github.com/TeaProphet/alex-landing"
echo ""

# Method selection
echo "Choose deployment method:"
echo "1) Git deployment (fastest, recommended)"
echo "2) Direct download and setup"
echo "3) Upload local files"
read -p "Enter choice (1-3): " METHOD

case $METHOD in
    1)
        echo "🚀 Using Git deployment..."
        ssh $USERNAME@$SERVER_IP "
            # Install git if needed
            sudo apt update && sudo apt install -y git
            
            # Setup directory
            sudo mkdir -p /var/www
            cd /var/www
            
            # Remove existing if present
            if [ -d 'fitness-trainer' ]; then
                sudo mv fitness-trainer fitness-trainer-backup-\$(date +%Y%m%d_%H%M%S)
            fi
            
            # Clone repository
            sudo git clone https://github.com/TeaProphet/alex-landing.git fitness-trainer
            sudo chown -R $USER:$USER fitness-trainer
            cd fitness-trainer
            
            # Make scripts executable
            chmod +x deploy/*.sh
            
            # Run deployment
            echo '🔧 Running deployment...'
            ./deploy/deploy.sh
            
            echo '✅ Git deployment completed!'
            echo '📋 Next steps:'
            echo '1. Run: ./deploy/setup-nginx.sh'
            echo '2. Edit and run: ./deploy/setup-ssl.sh'
        "
        ;;
        
    2)
        echo "📦 Using direct download..."
        ssh $USERNAME@$SERVER_IP "
            # Download and extract
            cd /tmp
            wget -O alex-landing.zip https://github.com/TeaProphet/alex-landing/archive/refs/heads/main.zip
            unzip -q alex-landing.zip
            
            # Setup directory
            sudo mkdir -p /var/www
            sudo rm -rf /var/www/fitness-trainer
            sudo mv alex-landing-main /var/www/fitness-trainer
            sudo chown -R $USER:$USER /var/www/fitness-trainer
            
            # Deploy
            cd /var/www/fitness-trainer
            chmod +x deploy/*.sh
            ./deploy/deploy.sh
            
            echo '✅ Download deployment completed!'
        "
        ;;
        
    3)
        echo "📡 Uploading local files..."
        
        # Create archive excluding unnecessary files
        echo "📦 Creating archive..."
        tar -czf /tmp/alex-landing-upload.tar.gz \
            --exclude=node_modules \
            --exclude=.git \
            --exclude="*.log" \
            --exclude=dist \
            --exclude=build \
            .
        
        # Upload and extract
        echo "📡 Uploading to server..."
        scp /tmp/alex-landing-upload.tar.gz $USERNAME@$SERVER_IP:/tmp/
        
        ssh $USERNAME@$SERVER_IP "
            cd /var/www
            sudo rm -rf fitness-trainer
            sudo mkdir -p fitness-trainer
            cd fitness-trainer
            sudo tar -xzf /tmp/alex-landing-upload.tar.gz
            sudo chown -R $USER:$USER .
            chmod +x deploy/*.sh
            ./deploy/deploy.sh
            rm /tmp/alex-landing-upload.tar.gz
        "
        
        rm /tmp/alex-landing-upload.tar.gz
        echo "✅ Upload deployment completed!"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to server: ssh $USERNAME@$SERVER_IP"
echo "2. Setup Nginx: cd /var/www/fitness-trainer && ./deploy/setup-nginx.sh"
echo "3. Setup SSL: ./deploy/setup-ssl.sh (edit email first)"
echo "4. Point domain fitness-trainer.online to server IP: $SERVER_IP"
echo ""
echo "🌐 Your website will be available at:"
echo "   http://$SERVER_IP (after Nginx setup)"
echo "   https://fitness-trainer.online (after DNS + SSL)"