# 🚀 Deployment Guide for Alexander Paskhalis Fitness Trainer Website

## 📋 Pre-Deployment Checklist

✅ **Files Created:**
- `railway.json` - Railway deployment configuration
- `package.json` - Root package with deployment scripts
- `Dockerfile` - Docker container configuration
- `.dockerignore` - Docker ignore file
- `frontend/.env.production` - Production environment variables
- Environment variables configured in code

## 🎯 Recommended Deployment: Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize
```bash
railway login
railway init
```

### Step 3: Deploy
```bash
railway up
```

### Step 4: Configure Environment Variables
In Railway dashboard, set:
```
NODE_ENV=production
PORT=1337
STRAPI_URL=https://your-app-name.railway.app
DATABASE_URL=file:./data.db
```

## 🌐 Alternative: Vercel + Railway Split

### Frontend (Vercel)
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Backend (Railway)
```bash
cd backend
railway init --name alex-landing-backend
railway up
```

## 🖥️ VPS Deployment (DigitalOcean/Linode)

### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo-url
cd alex-landing
```

### Build & Run
```bash
# Install dependencies
npm run install:all

# Build both apps
npm run build

# Start with PM2
pm2 start backend/dist/index.js --name "alex-backend"
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name fitness-trainer.online;
    
    # Serve frontend
    location / {
        root /path/to/alex-landing/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:1337/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Serve uploaded images
    location /uploads/ {
        root /path/to/alex-landing/backend/public;
    }
}
```

## 🔧 Environment Variables Setup

### Production Variables Needed:
```bash
# Backend (.env)
NODE_ENV=production
PORT=1337
DATABASE_URL=file:./data.db
JWT_SECRET=your-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret
API_TOKEN_SALT=your-api-token-salt
TRANSFER_TOKEN_SALT=your-transfer-token-salt

# Frontend (.env.production) - Already created
VITE_API_URL=http://fitness-trainer.online/api
VITE_STRAPI_URL=http://fitness-trainer.online
```

## 📡 Domain Configuration

### Point Domain to Hosting:
1. **Railway**: Get app URL from dashboard
2. **Vercel**: Get deployment URL
3. **VPS**: Point A record to server IP

### Update DNS Records:
```
Type: A
Name: @
Value: Your-Server-IP-Address
TTL: 3600

Type: CNAME  
Name: www
Value: fitness-trainer.online
TTL: 3600
```

## 🔄 Deployment Commands

### Development
```bash
npm run dev           # Run both frontend and backend in dev mode
npm run dev:backend   # Run only backend in dev mode
npm run dev:frontend  # Run only frontend in dev mode
```

### Production
```bash
npm run build         # Build both apps
npm run start         # Start production server
```

### Individual Services
```bash
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only
npm run start:backend   # Start backend only
```

## 🚨 Important Notes

1. **Database**: Currently using SQLite - will work for small scale
2. **File Storage**: Images stored locally - consider cloud storage for scale
3. **SSL**: Enable HTTPS in production (automatic with Railway/Vercel)
4. **Backups**: Backup `/backend/public/uploads/` and database regularly

## 🎉 Post-Deployment

1. Test all functionality on live site
2. Update Strapi admin panel content
3. Test contact forms and social media links
4. Monitor performance and errors
5. Set up SSL certificate (if VPS)

Your fitness trainer website is now ready for production! 💪