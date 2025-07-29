#!/bin/bash

# SSL Setup Script for fitness-trainer.online using Let's Encrypt
# Compatible with: Ubuntu 20.04+, AlmaLinux 8+, Rocky Linux 8+

set -e

DOMAIN="fitness-trainer.online"
EMAIL="your-email@example.com"  # Change this to your email

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID=$ID
fi

echo "🔒 Setting up SSL certificate for $DOMAIN..."
echo "Operating System: $NAME"

# Check if domain is pointing to this server
echo "🔍 Checking if domain points to this server..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  Warning: Domain $DOMAIN does not point to this server"
    echo "   Server IP: $SERVER_IP"
    echo "   Domain IP: $DOMAIN_IP"
    echo ""
    echo "Please update your DNS records first:"
    echo "   Type: A"
    echo "   Name: @"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 3600"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Stop Nginx temporarily
echo "⏸️  Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Update Nginx configuration for HTTPS
    echo "🔧 Updating Nginx configuration for HTTPS..."
    
    # Backup original config (handle different nginx config paths)
    if [[ "$OS_ID" == "almalinux" ]] || [[ "$OS_ID" == "rocky" ]] || [[ "$OS_ID" == "rhel" ]] || [[ "$OS_ID" == "centos" ]]; then
        # RHEL-based systems store configs in /etc/nginx/conf.d/
        sudo cp /etc/nginx/conf.d/fitness-trainer.online.conf /etc/nginx/conf.d/fitness-trainer.online.conf.bak 2>/dev/null || \
        sudo cp /etc/nginx/sites-available/fitness-trainer.online /etc/nginx/sites-available/fitness-trainer.online.bak 2>/dev/null || true
    else
        # Debian-based systems use sites-available
        sudo cp /etc/nginx/sites-available/fitness-trainer.online /etc/nginx/sites-available/fitness-trainer.online.bak
    fi
    
    # Create HTTPS-enabled Nginx config
    cat > /tmp/nginx-ssl.conf << 'EOL'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name fitness-trainer.online www.fitness-trainer.online;
    return 301 https://fitness-trainer.online$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name fitness-trainer.online www.fitness-trainer.online;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/fitness-trainer.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fitness-trainer.online/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS (optional)
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=static:10m rate=30r/s;
    
    # Root directory for frontend (using hosting provider's structure)
    root /var/www/fitness-trainer.online;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/atom+xml image/svg+xml;
    
    # Frontend - Serve React SPA
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            limit_req zone=static burst=50 nodelay;
        }
        
        # Security for HTML files
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # Backend API - Proxy to Strapi
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:1337/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Strapi Admin Panel
    location /admin {
        proxy_pass http://127.0.0.1:1337/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve uploaded images from Strapi
    location /uploads/ {
        alias /var/www/fitness-trainer.online/backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        
        # Image optimization headers
        add_header Vary Accept-Encoding;
        
        # Security
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            return 403;
        }
    }
    
    # Favicon and manifest
    location ~* ^/(favicon\.ico|apple-touch-icon\.png|icon-.*\.png|manifest\.json|robots\.txt|sitemap\.xml)$ {
        root /var/www/fitness-trainer.online;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Security - Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~* \.(env|ini|conf|bak|old|tmp)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Custom error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    # Logging
    access_log /var/log/nginx/fitness-trainer-access.log;
    error_log /var/log/nginx/fitness-trainer-error.log;
}
EOL
    
    # Replace Nginx config with SSL version (handle different paths)
    if [[ "$OS_ID" == "almalinux" ]] || [[ "$OS_ID" == "rocky" ]] || [[ "$OS_ID" == "rhel" ]] || [[ "$OS_ID" == "centos" ]]; then
        # RHEL-based systems - try both locations
        if [ -f /etc/nginx/conf.d/fitness-trainer.online.conf ]; then
            sudo mv /tmp/nginx-ssl.conf /etc/nginx/conf.d/fitness-trainer.online.conf
        else
            sudo mv /tmp/nginx-ssl.conf /etc/nginx/sites-available/fitness-trainer.online
        fi
    else
        # Debian-based systems
        sudo mv /tmp/nginx-ssl.conf /etc/nginx/sites-available/fitness-trainer.online
    fi
    
    # Test configuration
    echo "🧪 Testing Nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        # Start Nginx
        echo "🚀 Starting Nginx..."
        sudo systemctl start nginx
        
        # Setup automatic renewal
        echo "🔄 Setting up automatic SSL renewal..."
        (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx") | sudo crontab -
        
        echo "✅ SSL setup completed successfully!"
        echo ""
        echo "🎉 Your website is now secured with HTTPS:"
        echo "   https://fitness-trainer.online"
        echo "   https://fitness-trainer.online/admin"
        echo ""
        echo "🔄 SSL certificate will auto-renew every 60 days"
        
    else
        echo "❌ Nginx configuration test failed"
        echo "Restoring backup..."
        if [[ "$OS_ID" == "almalinux" ]] || [[ "$OS_ID" == "rocky" ]] || [[ "$OS_ID" == "rhel" ]] || [[ "$OS_ID" == "centos" ]]; then
            # RHEL-based systems - restore from appropriate location
            if [ -f /etc/nginx/conf.d/fitness-trainer.online.conf.bak ]; then
                sudo mv /etc/nginx/conf.d/fitness-trainer.online.conf.bak /etc/nginx/conf.d/fitness-trainer.online.conf
            else
                sudo mv /etc/nginx/sites-available/fitness-trainer.online.bak /etc/nginx/sites-available/fitness-trainer.online 2>/dev/null || true
            fi
        else
            sudo mv /etc/nginx/sites-available/fitness-trainer.online.bak /etc/nginx/sites-available/fitness-trainer.online
        fi
        sudo systemctl start nginx
        exit 1
    fi
    
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Starting Nginx again..."
    sudo systemctl start nginx
    exit 1
fi