#!/bin/bash

# Deployment Script for Alexander Paskhalis Fitness Trainer Website
# Run this after uploading your project files to the server

set -e

PROJECT_DIR="/var/www/fitness-trainer"
BACKUP_DIR="/var/backups/fitness-trainer"
LOG_FILE="/var/log/fitness-trainer/deploy.log"

echo "🚀 Starting deployment..." | tee -a $LOG_FILE

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Navigate to project directory
cd $PROJECT_DIR

# Create environment files
echo "📝 Creating environment files..."

# Backend environment
cat > backend/.env << EOL
NODE_ENV=production
PORT=1337
HOST=0.0.0.0

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db

# Secrets (CHANGE THESE IN PRODUCTION!)
APP_KEYS=generate-new-app-keys-here
API_TOKEN_SALT=generate-new-api-token-salt-here
ADMIN_JWT_SECRET=generate-new-admin-jwt-secret-here
TRANSFER_TOKEN_SALT=generate-new-transfer-token-salt-here
JWT_SECRET=generate-new-jwt-secret-here

# File Upload
UPLOAD_DIR=./public/uploads
EOL

# Frontend environment (production)
cat > frontend/.env.production << EOL
VITE_API_URL=http://fitness-trainer.online/api
VITE_STRAPI_URL=http://fitness-trainer.online
EOL

# Install dependencies
echo "📦 Installing dependencies..." | tee -a $LOG_FILE

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install --production
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Build applications
echo "🔨 Building applications..." | tee -a $LOG_FILE

# Build backend
cd backend
npm run build
cd ..

# Build frontend
cd frontend
npm run build
cd ..

# Create data directory for SQLite
mkdir -p backend/data
chmod 755 backend/data

# Create uploads directory
mkdir -p backend/public/uploads
chmod 755 backend/public/uploads

# Set proper permissions
echo "🔐 Setting permissions..." | tee -a $LOG_FILE
sudo chown -R $USER:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR
sudo chmod -R 775 backend/public/uploads
sudo chmod -R 775 backend/data

# Copy built frontend to Nginx directory
echo "📁 Setting up frontend files..." | tee -a $LOG_FILE
sudo rm -rf /var/www/html/fitness-trainer
sudo mkdir -p /var/www/html/fitness-trainer
sudo cp -r frontend/dist/* /var/www/html/fitness-trainer/
sudo chown -R www-data:www-data /var/www/html/fitness-trainer

# Start application with PM2
echo "🔄 Starting application with PM2..." | tee -a $LOG_FILE

# Stop existing PM2 processes
pm2 stop alex-backend || true
pm2 delete alex-backend || true

# Start backend with PM2
cd backend
pm2 start dist/index.js --name "alex-backend" --env production
pm2 save
cd ..

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Deployment completed successfully!" | tee -a $LOG_FILE
echo "📊 Application status:" | tee -a $LOG_FILE
pm2 status | tee -a $LOG_FILE

echo ""
echo "🌐 Your website should be accessible at:"
echo "   Backend API: http://your-server-ip:1337"
echo "   Admin Panel: http://your-server-ip:1337/admin"
echo ""
echo "📋 Next steps:"
echo "1. Configure Nginx with the provided config"
echo "2. Set up SSL certificate"
echo "3. Update DNS to point to this server"