#!/bin/bash

# Quick deployment script for Digital Ocean Droplet
# Run this on your droplet after initial setup

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Aziz Kino Bot - Droplet Setup       ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (or use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}📦 Step 1: Installing required packages...${NC}"
apt update
apt install -y docker.io docker-compose-plugin git

echo -e "${GREEN}🐳 Step 2: Starting Docker...${NC}"
systemctl start docker
systemctl enable docker

echo -e "${GREEN}🔥 Step 3: Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo "y" | ufw enable

echo -e "${GREEN}📂 Step 4: Setting up application directory...${NC}"
mkdir -p /opt/apps
cd /opt/apps

# Check if already cloned
if [ -d "aziz_kino_bot_withgrammy" ]; then
    echo -e "${YELLOW}⚠️  Directory exists. Pulling latest changes...${NC}"
    cd aziz_kino_bot_withgrammy
    git pull origin main
else
    echo -e "${GREEN}📥 Cloning repository...${NC}"
    git clone https://github.com/XushvaqtovSardor/aziz_kino_bot_withgrammy.git
    cd aziz_kino_bot_withgrammy
fi

# Setup .env if not exists
if [ ! -f .env ]; then
    echo -e "${GREEN}📝 Creating .env file...${NC}"
    cp .env.example .env
    
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration:${NC}"
    echo "   - BOT_TOKEN"
    echo "   - DB_PASSWORD"
    echo "   - WEB_PANEL_URL"
    echo ""
    read -p "Press Enter to edit .env file now..."
    nano .env
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo -e "${GREEN}🔨 Step 5: Building Docker images...${NC}"
docker compose build

echo -e "${GREEN}🚀 Step 6: Starting services...${NC}"
docker compose up -d

echo -e "${GREEN}⏳ Waiting for database to be ready...${NC}"
sleep 10

echo -e "${GREEN}🗄️  Step 7: Running database migrations...${NC}"
docker compose exec -T app npx prisma migrate deploy

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Deployment Complete!        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker compose ps
echo ""
echo -e "${BLUE}📝 View logs:${NC}"
echo "   docker compose logs -f app"
echo ""
echo -e "${BLUE}🔧 Manage services:${NC}"
echo "   docker compose restart    # Restart all"
echo "   docker compose down       # Stop all"
echo "   docker compose up -d      # Start all"
echo ""
echo -e "${BLUE}🌐 Access your bot:${NC}"
echo "   Bot: https://t.me/YOUR_BOT_USERNAME"
echo "   Web Panel: http://$(curl -s ifconfig.me):3000/admin/"
echo ""
echo -e "${GREEN}🎉 Setup complete! Your bot should now be running.${NC}"
