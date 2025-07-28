#!/bin/bash

# Git-based deployment setup (run once on server)
# This is the FASTEST way to deploy updates

echo "🚀 Setting up Git-based deployment..."

PROJECT_DIR="/var/www/fitness-trainer"
REPO_URL="https://github.com/yourusername/alex-landing.git"  # Change this!

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo apt update
    sudo apt install -y git
fi

# Setup deployment directory
echo "📁 Setting up deployment directory..."
sudo mkdir -p /var/www
cd /var/www

# If directory exists, backup and remove
if [ -d "fitness-trainer" ]; then
    echo "💾 Backing up existing installation..."
    sudo mv fitness-trainer fitness-trainer-backup-$(date +%Y%m%d_%H%M%S)
fi

# Clone repository
echo "📡 Cloning repository..."
sudo git clone $REPO_URL fitness-trainer

# Set ownership
sudo chown -R $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR

# Make scripts executable
chmod +x deploy/*.sh

# Create git deployment hook
echo "🔗 Creating deployment hook..."
cat > .git/hooks/post-merge << 'EOL'
#!/bin/bash
echo "🔄 Running post-merge deployment..."
cd /var/www/fitness-trainer
./deploy/deploy.sh
EOL

chmod +x .git/hooks/post-merge

# Create quick deployment script
cat > deploy-update.sh << 'EOL'
#!/bin/bash
echo "🚀 Deploying latest changes..."
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Git pull successful, running deployment..."
    ./deploy/deploy.sh
else
    echo "❌ Git pull failed"
    exit 1
fi
EOL

chmod +x deploy-update.sh

echo "✅ Git deployment setup completed!"
echo ""
echo "📋 To deploy updates from now on, just run:"
echo "   ssh user@server 'cd /var/www/fitness-trainer && ./deploy-update.sh'"
echo ""
echo "🎯 Or create an alias for super quick updates:"
echo "   alias deploy='ssh user@server \"cd /var/www/fitness-trainer && ./deploy-update.sh\"'"
echo ""
echo "📝 Don't forget to:"
echo "1. Change REPO_URL in this script to your actual repository"
echo "2. Push your code to the Git repository first"
echo "3. Set up SSH keys for passwordless access"