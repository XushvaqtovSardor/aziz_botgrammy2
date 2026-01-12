#!/bin/bash

# 🚀 Quick Production Deploy Script
# Bu skript server da ishlatiladi

set -e

echo "================================================"
echo "🚀 Aziz Kino Bot - Production Deployment"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create .env.production file first."
    exit 1
fi

# Check if BOT_TOKEN is set
if ! grep -q "^BOT_TOKEN=.*[^=]$" .env.production; then
    echo -e "${RED}❌ Error: BOT_TOKEN is not set in .env.production!${NC}"
    echo "Please set BOT_TOKEN in .env.production file."
    exit 1
fi

echo -e "${GREEN}✅ Configuration file found${NC}"
echo ""

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker compose down || true

echo ""
echo "🗑️  Cleaning old images..."
docker compose down --rmi local || true

echo ""
echo "🏗️  Building new Docker image..."
docker compose build --no-cache

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Checking service status..."
docker compose ps

echo ""
echo "================================================"
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo "================================================"
echo ""
echo "📝 Useful commands:"
echo "  • View logs:        docker compose logs -f app"
echo "  • Check status:     docker compose ps"
echo "  • Restart app:      docker compose restart app"
echo "  • Stop all:         docker compose down"
echo ""
echo "🌐 Access points:"
echo "  • Health check:     curl http://localhost:3000/health"
echo "  • Admin panel:      http://YOUR_SERVER_IP:3000/admin/"
echo ""

# Show last 20 lines of logs
echo "📋 Recent logs:"
echo "================================================"
docker compose logs --tail=20 app
