#!/bin/bash

# Bot Status Checker Script
# This script checks if the bot is running and responding properly

echo "🔍 Checking Bot Status..."
echo "================================"

# Check if process is running
echo ""
echo "📊 Process Status:"
if pgrep -f "node.*dist/main" > /dev/null; then
    echo "✅ Bot process is running"
    ps aux | grep "node.*dist/main" | grep -v grep
else
    echo "❌ Bot process is NOT running"
fi

# Check database connection
echo ""
echo "🗄️  Database Status:"
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set"
else
    echo "⚠️  DATABASE_URL is not set in environment"
fi

# Check bot token
echo ""
echo "🤖 Bot Configuration:"
if [ -n "$BOT_TOKEN" ]; then
    echo "✅ BOT_TOKEN is set"
else
    echo "❌ BOT_TOKEN is not set"
fi

# Check if port 3000 is listening
echo ""
echo "🌐 Network Status:"
if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "✅ Application is listening on port 3000"
elif ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "✅ Application is listening on port 3000"
else
    echo "❌ Application is NOT listening on port 3000"
fi

# Check recent logs for errors
echo ""
echo "📋 Recent Errors (last 10 lines):"
if [ -f "logs/error-$(date +%Y-%m-%d).log" ]; then
    tail -n 10 "logs/error-$(date +%Y-%m-%d).log" 2>/dev/null || echo "No error logs found for today"
else
    echo "No error log file found for today"
fi

# Check if bot is responding to Telegram API
echo ""
echo "🌐 Health Check Endpoint:"
curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health || echo "❌ Health endpoint not responding"

echo ""
echo "================================"
echo "✅ Status check complete!"
