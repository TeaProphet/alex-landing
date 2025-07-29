# 🚀 VPS Deployment Guide for Alexander Paskhalis Fitness Trainer Website

## 📋 Prerequisites

- **VPS Server**: Ubuntu 20.04+, AlmaLinux 8+, Rocky Linux 8+, or RHEL 8+ with root access
- **Domain**: `fitness-trainer.online` pointed to your server IP
- **Server Specs**: Minimum 1GB RAM, 20GB storage
- **Email**: For SSL certificate registration

## 🎯 Quick Deployment Steps

### 1. Server Setup
```bash
# Upload project files to server
scp -r alex-landing/ user@your-server-ip:/tmp/

# SSH into server
ssh user@your-server-ip

# Move project to hosting provider's preserved directory
sudo mv /tmp/alex-landing/* /var/www/fitness-trainer.online/
cd /var/www/fitness-trainer.online

# Make scripts executable
chmod +x deploy/*.sh

# Run server setup
sudo ./deploy/server-setup.sh
```

### 2. Deploy Application
```bash
# Run deployment script
./deploy/deploy.sh
```

### 3. Configure Nginx
```bash
# Setup Nginx configuration
cd deploy
./setup-nginx.sh
```

### 4. Setup SSL (HTTPS)
```bash
# Edit SSL script with your email
nano setup-ssl.sh
# Change: EMAIL="your-email@example.com"

# Run SSL setup
./setup-ssl.sh
```

## 📁 Script Overview

### Core Deployment Scripts
- **`server-setup.sh`** - Initial server configuration and package installation
- **`deploy.sh`** - Application deployment and PM2 setup
- **`setup-nginx.sh`** - Nginx web server configuration
- **`setup-ssl.sh`** - SSL certificate setup with Let's Encrypt

### Configuration Files
- **`nginx.conf`** - Nginx server configuration for your domain
- **`ecosystem.config.js`** - PM2 process management configuration

### Maintenance Scripts
- **`backup.sh`** - Database and files backup script
- **`maintenance.sh`** - Complete maintenance toolkit

## 🔧 Environment Configuration

### Backend Environment (`.env`)
```bash
NODE_ENV=production
PORT=1337
HOST=0.0.0.0

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data/data.db

# Security Keys (GENERATE NEW ONES!)
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here
TRANSFER_TOKEN_SALT=your-transfer-token-salt-here
JWT_SECRET=your-jwt-secret-here
```

### Frontend Environment (`.env.production`)
```bash
VITE_API_URL=https://fitness-trainer.online/api
VITE_STRAPI_URL=https://fitness-trainer.online
```

## 🌐 DNS Configuration

Point your domain to the server:
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: CNAME
Name: www
Value: fitness-trainer.online
TTL: 3600
```

## 🔄 Daily Operations

### Application Management
```bash
# Check status
./deploy/maintenance.sh status

# Restart application
./deploy/maintenance.sh restart

# View logs
./deploy/maintenance.sh logs

# Real-time monitoring
./deploy/maintenance.sh monitor
```

### Maintenance Tasks
```bash
# Create backup
./deploy/maintenance.sh backup

# Run health checks
./deploy/maintenance.sh health

# Clean up system
./deploy/maintenance.sh cleanup

# Update application
./deploy/maintenance.sh update
```

### PM2 Commands
```bash
# View processes
pm2 status

# View logs
pm2 logs alex-backend

# Restart
pm2 restart alex-backend

# Monitor
pm2 monit
```

## 📊 Monitoring & Logs

### Log Locations
- **Project Directory**: `/var/www/fitness-trainer.online/`
- **Application Logs**: `/var/log/fitness-trainer/`
- **Nginx Logs**: `/var/log/nginx/fitness-trainer-*.log`
- **PM2 Logs**: `~/.pm2/logs/`

### Health Monitoring
```bash
# Check application health
curl https://fitness-trainer.online/api/health

# Check SSL certificate status
openssl x509 -enddate -noout -in /etc/letsencrypt/live/fitness-trainer.online/cert.pem
```

## 🛡️ Security Features

- **Firewall**: UFW configured for SSH and HTTP/HTTPS only
- **SSL/TLS**: Let's Encrypt certificates with auto-renewal
- **Rate Limiting**: Nginx rate limiting for API and static files
- **Security Headers**: HSTS, XSS Protection, Content-Type Options
- **File Permissions**: Proper ownership and permissions set

## 🔧 Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   pm2 logs alex-backend
   cd /var/www/fitness-trainer/backend
   node dist/index.js  # Test direct run
   ```

2. **Nginx configuration errors**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

4. **Database connection issues**
   ```bash
   ls -la /var/www/fitness-trainer/backend/data/
   chmod 755 /var/www/fitness-trainer/backend/data/
   ```

### Emergency Recovery
```bash
# Restore from backup
cd /var/backups/fitness-trainer
ls -la  # Find latest backup
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
# Follow restore instructions in backup_info.txt
```

## 📈 Performance Optimization

- **Nginx**: Gzip compression, static file caching
- **Database**: SQLite with optimized queries
- **Images**: Automatic resizing and optimization by Strapi
- **CDN**: Consider adding Cloudflare for global performance

## 💰 Cost Estimation

**VPS Hosting** (monthly):
- **DigitalOcean**: $6-12/month (1-2GB RAM)
- **Linode**: $5-10/month (1-2GB RAM)
- **Vultr**: $6-12/month (1-2GB RAM)

**Additional Costs**: None (SSL is free with Let's Encrypt)

## 🎉 Post-Deployment Checklist

- [ ] Website loads at `https://fitness-trainer.online`
- [ ] Admin panel accessible at `https://fitness-trainer.online/admin`
- [ ] All images and content display properly
- [ ] Contact forms and social media links work
- [ ] SSL certificate is valid and auto-renewing
- [ ] Backups are running daily
- [ ] Monitoring is set up

Your Alexander Paskhalis Fitness Trainer website is now live and professional! 💪