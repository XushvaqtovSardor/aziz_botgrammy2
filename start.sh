#!/bin/bash

# Production Start Script with Logging
# This script starts the bot and captures all initialization logs

echo "🚀 Starting Aziz Kino Bot..."
echo "===================================="

# Check environment variables first
echo "📋 Checking environment variables..."
bash check-env.sh
if [ $? -ne 0 ]; then
    echo "❌ Environment check failed. Please fix the issues above."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo "🔧 Building application..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  Migration failed or no pending migrations"
fi

echo ""
echo "🚀 Starting application..."
echo "📋 Logs will be saved to logs/ directory"
echo "📊 Monitor with: tail -f logs/combined-$(date +%Y-%m-%d).log"
echo ""

# Start the application
NODE_ENV=production pnpm run start:prod 2>&1 | tee -a logs/startup-$(date +%Y-%m-%d-%H-%M-%S).log
