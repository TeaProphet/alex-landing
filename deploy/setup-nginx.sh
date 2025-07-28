#!/bin/bash

# Nginx Setup Script for fitness-trainer.online

set -e

echo "🌐 Setting up Nginx for fitness-trainer.online..."

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/fitness-trainer.online

# Create symlink to enable site
sudo ln -sf /etc/nginx/sites-available/fitness-trainer.online /etc/nginx/sites-enabled/

# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    
    echo "✅ Nginx configured successfully!"
    echo ""
    echo "📋 Your website should now be accessible at:"
    echo "   http://fitness-trainer.online"
    echo "   http://fitness-trainer.online/admin (Strapi admin)"
    echo ""
    echo "📋 Next steps:"
    echo "1. Point your domain DNS to this server's IP address"
    echo "2. Run SSL setup script to enable HTTPS"
    
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration and try again"
    exit 1
fi