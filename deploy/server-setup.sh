#!/bin/bash

# VPS Server Setup Script for Alexander Paskhalis Fitness Trainer Website
# Run this script on a fresh Ubuntu 20.04/22.04 VPS

set -e

echo "🚀 Setting up VPS for Alexander Paskhalis Fitness Trainer Website..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally
echo "🔄 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/fitness-trainer
sudo chown -R $USER:$USER /var/www/fitness-trainer

# Create logs directory
sudo mkdir -p /var/log/fitness-trainer
sudo chown -R $USER:$USER /var/log/fitness-trainer

# Setup UFW firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create deployment user (optional)
echo "👤 Creating deployment user..."
sudo useradd -m -s /bin/bash deploy || echo "User 'deploy' already exists"
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo chown -R deploy:deploy /home/deploy/.ssh

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your project files to /var/www/fitness-trainer"
echo "2. Run the deployment script"
echo "3. Configure your domain DNS to point to this server IP"
echo "4. Run SSL setup script"