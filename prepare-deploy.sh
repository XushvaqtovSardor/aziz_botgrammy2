#!/bin/bash

# Quick deployment script for Digital Ocean
# Run this on your local machine to prepare for deployment

echo "🚀 Preparing project for Digital Ocean deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with required variables."
    echo "See .env.example for reference."
    exit 1
fi

# Check required environment variables
echo "📋 Checking environment variables..."
REQUIRED_VARS=("BOT_TOKEN" "DATABASE_URL" "DB_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing required variables in .env:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Check if database password is still default
if grep -q "your_strong_password" .env; then
    echo -e "${YELLOW}⚠️  Warning: Database password is still default!${NC}"
    echo "Please update DB_PASSWORD in .env file before deploying."
    exit 1
fi

# Clean unnecessary files
echo "🧹 Cleaning unnecessary files..."
rm -rf node_modules/.cache
rm -rf dist
rm -rf logs/combined-*.log logs/debug-*.log

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs

# Verify Docker files
echo "🐳 Verifying Docker configuration..."
if [ ! -f docker-compose.yml ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found!${NC}"
    exit 1
fi

if [ ! -f Dockerfile ]; then
    echo -e "${RED}❌ Error: Dockerfile not found!${NC}"
    exit 1
fi

# Build test
echo "🔨 Testing Docker build..."
if ! docker compose config > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: docker-compose.yml has syntax errors!${NC}"
    docker compose config
    exit 1
fi

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "📦 Project is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push changes to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push origin main"
echo ""
echo "2. On your Digital Ocean droplet:"
echo "   ssh root@YOUR_DROPLET_IP"
echo "   cd /opt/apps"
echo "   git clone YOUR_REPO_URL"
echo "   cd aziz_kino_bot_withgrammy"
echo "   cp .env.example .env"
echo "   nano .env  # Configure your settings"
echo "   docker compose up -d"
echo ""
echo "3. Read full deployment guide:"
echo "   cat DIGITAL_OCEAN_DEPLOY.md"
echo ""
