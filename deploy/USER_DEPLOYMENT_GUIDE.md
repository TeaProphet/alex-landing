# 🚀 USER-LEVEL DEPLOYMENT GUIDE (NO SUDO REQUIRED)

**Alexander Paskhalis Fitness Trainer Website**  
**Repository**: https://github.com/TeaProphet/alex-landing  
**Compatible OS**: Ubuntu 20.04+, AlmaLinux 8+, Rocky Linux 8+, RHEL 8+  
**Requirements**: Node.js, NPM, Git (no root access needed)

## ✨ **Key Features**
- ✅ **No sudo privileges required**
- ✅ **Runs entirely in user space**
- ✅ **User-owned directories and processes**
- ✅ **PM2 process management**
- ✅ **Automatic builds and deployment**
- ✅ **Built-in backup system**

## 📋 **Prerequisites**

Make sure these are installed (ask your system admin if needed):
```bash
# Check if you have the required tools
node --version    # Should show v18.x or higher
npm --version     # Should show npm version
git --version     # Should show git version
```

If missing, install them:
```bash
# For Ubuntu/Debian
sudo apt install nodejs npm git

# For AlmaLinux/Rocky Linux/RHEL
sudo dnf install nodejs npm git

# Or use Node Version Manager (no sudo)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## 🚀 **Quick Deployment**

### Method 1: Direct Download & Run
```bash
# Download the deployment script
wget https://raw.githubusercontent.com/TeaProphet/alex-landing/main/deploy/user-deploy.sh
chmod +x user-deploy.sh

# Run deployment (no sudo needed!)
./user-deploy.sh
```

### Method 2: Git Clone & Run
```bash
# Clone the repository
git clone https://github.com/TeaProphet/alex-landing.git
cd alex-landing/deploy

# Run user-level deployment
./user-deploy.sh
```

## 📁 **Directory Structure (User Space)**

After deployment, your files will be organized as:
```
$HOME/
├── fitness-trainer/                 # Main project
│   ├── backend/                    # Strapi CMS
│   ├── frontend/                   # React app source
│   └── deploy/                     # Deployment scripts
├── www/
│   └── fitness-trainer.online/     # Web files (served by web server)
├── logs/                           # Application logs
└── backups/                        # Automatic backups
```

## 🎯 **What the Script Does**

### ✅ **Setup (Steps 1-3)**
- Checks prerequisites (Node.js, NPM, Git)
- Installs PM2 process manager (user-level)
- Creates user directory structure

### ✅ **Application Deployment (Steps 4-5)**
- Clones/updates GitHub repository
- Generates secure environment variables
- Installs dependencies and builds application
- Sets up database and uploads directories

### ✅ **Service Management (Steps 6-7)**
- Starts backend with PM2 (port 3000)
- Optionally starts frontend server (port 3001)
- Saves PM2 configuration for auto-restart

### ✅ **Final Configuration (Step 8)**
- Shows application status and URLs
- Provides management commands
- Lists important file paths

## 🌐 **After Deployment**

Your application will be accessible at:
- **Backend API**: http://localhost:3000
- **Strapi Admin**: http://localhost:3000/admin
- **Frontend** (if enabled): http://localhost:3001
- **Static Files**: `~/www/fitness-trainer.online/`

## 🛠️ **Management Commands**

```bash
cd ~/fitness-trainer/deploy

# Check application status
./user-maintenance.sh status

# View logs
./user-maintenance.sh logs

# Restart application
./user-maintenance.sh restart

# Update application
./user-maintenance.sh update

# Create backup
./user-maintenance.sh backup
# or
./user-backup.sh

# Monitor in real-time
./user-maintenance.sh monitor

# Health check
./user-maintenance.sh health

# Clean up old files
./user-maintenance.sh cleanup
```

## 🔄 **PM2 Process Management**

Direct PM2 commands:
```bash
# Check processes
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Monitor
pm2 monit

# Save configuration
pm2 save
```

## 🌐 **Web Server Integration**

Since this runs in user space, you'll need to configure your web server to serve the files:

### Nginx Configuration Example:
```nginx
server {
    listen 80;
    server_name fitness-trainer.online;
    
    # Serve static files
    root /home/username/www/fitness-trainer.online;
    index index.html;
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Admin panel proxy
    location /admin {
        proxy_pass http://localhost:3000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Uploads
    location /uploads/ {
        alias /home/username/fitness-trainer/backend/public/uploads/;
    }
}
```

### Apache Configuration Example:
```apache
<VirtualHost *:80>
    ServerName fitness-trainer.online
    DocumentRoot /home/username/www/fitness-trainer.online
    
    # Proxy API requests
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
    
    # Proxy admin panel
    ProxyPass /admin http://localhost:3000/admin
    ProxyPassReverse /admin http://localhost:3000/admin
    
    # Serve uploads
    Alias /uploads /home/username/fitness-trainer/backend/public/uploads
</VirtualHost>
```

## 💾 **Backup System**

Automatic backups include:
- ✅ SQLite database
- ✅ Uploaded files
- ✅ Configuration files
- ✅ Frontend build
- ✅ PM2 process configuration

Backups are stored in `~/backups/` and automatically cleaned (keeps 30 days).

## 🔄 **Updates**

To update your application:
```bash
cd ~/fitness-trainer/deploy
./user-maintenance.sh update
```

This will:
1. Pull latest code from Git
2. Install new dependencies
3. Rebuild application
4. Deploy updated files
5. Restart services

## 🆘 **Troubleshooting**

### Common Issues:

1. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Change port in backend/.env
   nano ~/fitness-trainer/backend/.env
   # Edit: PORT=3001
   
   # Restart
   pm2 restart all
   ```

2. **Permission denied:**
   ```bash
   # Fix file permissions
   chmod 755 ~/fitness-trainer/backend/public/uploads
   chmod 755 ~/fitness-trainer/backend/data
   ```

3. **Database issues:**
   ```bash
   # Check database file
   ls -la ~/fitness-trainer/backend/data/data.db
   
   # Restore from backup if needed
   cp ~/backups/latest/database.db ~/fitness-trainer/backend/data/
   ```

4. **Frontend not loading:**
   ```bash
   # Check if build exists
   ls -la ~/www/fitness-trainer.online/
   
   # Rebuild if needed
   cd ~/fitness-trainer/frontend
   npm run build
   cp -r dist/* ~/www/fitness-trainer.online/
   ```

## 🎉 **Advantages of User-Level Deployment**

- ✅ **No root access required**
- ✅ **Isolated from system services**
- ✅ **Easy to manage and maintain**
- ✅ **Perfect for shared hosting**
- ✅ **Quick deployment and updates**
- ✅ **Full control over your application**

## 📞 **Support**

If you encounter issues:
1. Check `pm2 logs` for application errors
2. Run `./user-maintenance.sh health` for diagnostics
3. Check that all ports are available
4. Ensure file permissions are correct

Your Alexander Paskhalis fitness trainer website will run smoothly in user space without any root privileges needed! 🚀