#!/bin/bash

# Environment Variables Checker
# Checks if all required environment variables are set

echo "🔍 Checking Environment Variables..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Required variables
REQUIRED_VARS=(
    "BOT_TOKEN"
    "DATABASE_URL"
)

# Optional but recommended variables
OPTIONAL_VARS=(
    "NODE_ENV"
    "PORT"
    "BOT_USERNAME"
    "WEB_PANEL_URL"
    "PAYME_MERCHANT_ID"
    "PAYME_SECRET_KEY"
    "CLICK_MERCHANT_ID"
    "CLICK_SECRET_KEY"
)

all_good=true

echo ""
echo "📋 Required Variables:"
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✅ $var is set${NC}"
    else
        echo -e "${RED}❌ $var is NOT set${NC}"
        all_good=false
    fi
done

echo ""
echo "📋 Optional Variables:"
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✅ $var is set${NC}"
    else
        echo -e "${YELLOW}⚠️  $var is not set (optional)${NC}"
    fi
done

echo ""
echo "===================================="

if [ "$all_good" = true ]; then
    echo -e "${GREEN}✅ All required environment variables are set!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some required variables are missing!${NC}"
    echo ""
    echo "Please set missing variables in your .env file or export them:"
    echo "  export BOT_TOKEN=your_token_here"
    echo "  export DATABASE_URL=your_database_url"
    exit 1
fi
