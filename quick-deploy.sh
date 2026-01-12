#!/bin/bash

# Quick deployment script for updating the bot
# Usage: ./quick-deploy.sh [message]

set -e

DEPLOY_MESSAGE="${1:-Quick update}"
DROPLET_IP="165.232.136.50"
DROPLET_USER="root"
SSH_KEY="droplet_2"
PROJECT_PATH="/opt/aziz_bot"

echo "🚀 Quick Deploy: $DEPLOY_MESSAGE"
echo "Target: $DROPLET_USER@$DROPLET_IP"
echo ""

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    exit 1
fi

# Git commit and push (optional)
if [ -d .git ]; then
    read -p "Commit and push changes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "$DEPLOY_MESSAGE" || echo "No changes to commit"
        git push origin main
        echo "✅ Pushed to GitHub"
    fi
fi

# Deploy to droplet
echo ""
echo "📡 Deploying to droplet..."

ssh -i "$SSH_KEY" "$DROPLET_USER@$DROPLET_IP" << 'ENDSSH'
    set -e
    cd /opt/aziz_bot
    
    echo "📥 Pulling latest changes..."
    git pull origin main
    
    echo "🔄 Restarting services..."
    docker-compose restart app
    
    echo "⏳ Waiting for app to be ready..."
    sleep 5
    
    echo "📊 Service status:"
    docker-compose ps
    
    echo ""
    echo "✅ Deployment completed!"
ENDSSH

echo ""
echo "🎉 Quick deploy finished!"
echo "View logs: ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP 'docker-compose -f $PROJECT_PATH/docker-compose.yml logs -f --tail=50 app'"
