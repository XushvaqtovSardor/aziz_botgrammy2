#!/bin/bash
# Local test script - Build va ishlatib ko'rish uchun

set -e

echo "🧪 Testing Docker Build Locally..."
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found, using example..."
    cp .env.production.example .env.production
    echo "❗ Please edit .env.production with your values!"
fi

echo "1️⃣ Cleaning old containers and images..."
docker compose down -v 2>/dev/null || true
docker rmi aziz_bot_grammy-app 2>/dev/null || true

echo ""
echo "2️⃣ Building Docker image..."
docker compose build --no-cache

echo ""
echo "3️⃣ Starting services..."
docker compose up -d

echo ""
echo "4️⃣ Waiting for services to start..."
sleep 15

echo ""
echo "5️⃣ Checking status..."
docker compose ps

echo ""
echo "6️⃣ Viewing logs..."
docker compose logs app

echo ""
echo "✅ Test completed!"
echo ""
echo "📝 Next steps:"
echo "  • Check logs:    docker compose logs -f app"
echo "  • Health check:  curl http://localhost:3000/health"
echo "  • Stop:          docker compose down"
