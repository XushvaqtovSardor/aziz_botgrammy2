#!/bin/bash
# ODDIY FIX

echo "🔧 Database Fix..."

# Stop app
docker compose stop app

# Rebuild and start
docker compose build app
docker compose up -d app

# Wait and show logs
sleep 8
docker compose logs --tail=30 app

echo ""
echo "✅ Tayyor! /start yuboring Telegram'da"
