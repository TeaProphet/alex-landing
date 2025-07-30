# 🚀 One-Click VPS Deployment Guide

Deploy your fitness trainer landing page to any Ubuntu VPS in minutes!

## 📋 Prerequisites

- **VPS**: Ubuntu 20.04+ with 1vCPU, 2GB RAM minimum
- **Domain**: Point `fitness-trainer.online` to your VPS IP
- **Access**: SSH access to your VPS with sudo privileges

## 🎯 One-Click Deployment

### Method 1: Direct Download & Execute
```bash
# SSH into your VPS
ssh your-user@your-vps-ip

# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/alex-landing/master/deploy.sh | bash
```

### Method 2: Clone & Execute
```bash
# SSH into your VPS
ssh your-user@your-vps-ip

# Clone the repository
git clone https://github.com/YOUR_USERNAME/alex-landing.git
cd alex-landing

# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ What the Script Does

### 🔧 System Setup
- Updates Ubuntu packages
- Installs Docker & Docker Compose
- Installs Node.js 18
- Installs Nginx web server
- Installs Certbot for SSL certificates

### 🐳 Application Deployment
- Clones your project from GitHub
- Sets up Directus CMS with production configuration
- Builds React frontend for production
- Configures Nginx with reverse proxy
- Sets up SSL certificates with Let's Encrypt
- Creates systemd service for auto-startup

### 🔒 Security & Monitoring
- Configures firewall (UFW)
- Sets up log rotation
- Creates health monitoring with auto-restart
- Implements security headers
- Enables automatic SSL renewal

## 📋 Post-Deployment Information

After successful deployment, you'll find these details in `/opt/alex-landing/deployment-info.txt`:

- **Website**: https://fitness-trainer.online
- **Admin Panel**: https://fitness-trainer.online/admin
- **Admin Credentials**: Generated automatically
- **API Endpoints**: https://fitness-trainer.online/api/

## 🛠️ Management Commands

### View Application Status
```bash
# Check if services are running
sudo systemctl status alex-landing
docker ps

# View logs
cd /opt/alex-landing/backend
docker-compose -f docker-compose.prod.yml logs -f
```

### Update Application
```bash
cd /opt/alex-landing
git pull origin master
./deploy.sh
```

### Restart Services
```bash
# Restart backend only
cd /opt/alex-landing/backend
docker-compose -f docker-compose.prod.yml restart

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Management
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test automatic renewal
sudo certbot renew --dry-run
```

## 🏗️ Architecture Overview

```
[Internet] → [Nginx Reverse Proxy] → [React App (Static Files)]
                     ↓
            [Docker Container: Directus CMS]
                     ↓
               [SQLite Database]
```

### Port Configuration
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (main application)
- **1337**: Directus (internal, proxied through Nginx)

### File Structure on VPS
```
/opt/alex-landing/
├── backend/
│   ├── docker-compose.prod.yml
│   ├── .env
│   ├── database/
│   └── uploads/
├── frontend/
│   └── dist/
└── deployment-info.txt
```

## 🔧 Troubleshooting

### Common Issues

**1. Domain not accessible**
- Ensure DNS is pointing to your VPS IP
- Check firewall: `sudo ufw status`
- Verify Nginx: `sudo nginx -t && sudo systemctl status nginx`

**2. SSL certificate issues**
- Wait 5-10 minutes for DNS propagation
- Check certificate: `sudo certbot certificates`
- Manual renewal: `sudo certbot renew --force-renewal`

**3. Backend not responding**
- Check Docker: `docker ps`
- View logs: `docker-compose -f docker-compose.prod.yml logs`
- Restart: `docker-compose -f docker-compose.prod.yml restart`

**4. Out of memory (2GB RAM)**
- Check memory usage: `free -h`
- Restart services: `sudo systemctl restart alex-landing`
- Consider upgrading to 4GB RAM if issues persist

### Manual Health Check
```bash
# Test backend directly
curl http://localhost:1337/server/health

# Test through Nginx
curl https://fitness-trainer.online/api/server/health

# Check disk space
df -h
```

## 📊 Performance Optimization

### For 2GB RAM VPS
- Directus container limited to 512MB RAM
- Nginx configured with gzip compression
- Static assets cached for 1 year
- Database optimized for SQLite

### Monitoring
- Health checks every 5 minutes
- Auto-restart on failure
- Log rotation (7 days retention)
- SSL auto-renewal

## 🔄 Updates & Maintenance

### Regular Updates
```bash
# Weekly maintenance (run as cron job)
cd /opt/alex-landing
git pull
docker-compose -f backend/docker-compose.prod.yml pull
docker-compose -f backend/docker-compose.prod.yml up -d
```

### Backup
```bash
# Backup database and uploads
sudo tar -czf alex-landing-backup-$(date +%Y%m%d).tar.gz \
  /opt/alex-landing/backend/database \
  /opt/alex-landing/backend/uploads
```

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose -f /opt/alex-landing/backend/docker-compose.prod.yml logs`
2. Verify DNS settings for your domain
3. Ensure VPS has at least 2GB RAM
4. Check firewall and security groups

---

**🎉 Your fitness trainer landing page should now be live at https://fitness-trainer.online!**