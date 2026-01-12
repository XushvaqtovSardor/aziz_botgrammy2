#!/bin/bash

# Quick deployment script for Digital Ocean Droplet
# Usage: ./quick-deploy.sh

set -e

echo "🚀 Quick Deploy - Aziz Bot"
echo "=========================="

# Check .env
if [ ! -f .env ]; then
  echo "❌ .env fayl topilmadi!"
  echo "Iltimos .env.example dan .env yarating"
  exit 1
fi

# Stop containers
echo "⏹️  Containerlarni to'xtatish..."
docker-compose down 2>/dev/null || true

# Remove old images
echo "🗑️  Eski imagelarni tozalash..."
docker image prune -f

# Build and start
echo "🔨 Build va start..."
docker-compose up -d --build

# Wait for services
echo "⏳ Servislar ishga tushishini kutish..."
sleep 10

# Check status
echo ""
echo "📊 Status:"
docker-compose ps

echo ""
echo "✅ Deploy tugadi!"
echo ""
echo "Foydali komandalar:"
echo "  docker-compose logs -f          # Loglarni ko'rish"
echo "  docker-compose restart          # Restart"
echo "  docker-compose down             # To'xtatish"
echo ""

# Get server IP
if [ -f .env ]; then
    SERVER_IP=$(grep WEB_PANEL_URL .env | cut -d'/' -f3 | cut -d':' -f1)
    if [ ! -z "$SERVER_IP" ] && [ "$SERVER_IP" != "YOUR_IP" ]; then
        echo "🌐 Web panel: http://$SERVER_IP:3000/admin/"
    else
        echo "🌐 Web panel: http://YOUR_IP:3000/admin/"
    fi
fi

# Show logs
read -p "Loglarni ko'rasizmi? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f --tail=50
fi
    
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
