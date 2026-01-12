#!/bin/bash
set -e

echo "================================================"
echo "🚀 Aziz Kino Bot - Production Startup"
echo "================================================"

# Check required environment variables
if [ -z "$BOT_TOKEN" ]; then
  echo "❌ ERROR: BOT_TOKEN is not set!"
  echo "Please set BOT_TOKEN in .env.production file"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

echo "✅ Environment variables validated"
echo "📦 Node version: $(node --version)"
echo "📦 PNPM version: $(pnpm --version)"
echo "🌍 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"

# Wait for database to be ready
echo "" 
echo "🔄 Waiting for PostgreSQL database..."
max_attempts=60
attempt=0

until pnpm prisma db push --skip-generate 2>&1 | tee /tmp/prisma_output.log || [ $attempt -eq $max_attempts ]; do
  attempt=$((attempt+1))
  echo "⏳ Attempt $attempt/$max_attempts - Database not ready yet..."
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database connection failed after $max_attempts attempts"
    echo "📄 Last error:"
    cat /tmp/prisma_output.log
    exit 1
  fi
  sleep 2
done

echo "✅ Database connection established successfully!"
echo ""

# Optional: Run migrations if needed (uncomment for first deployment)
# echo "📊 Running database migrations..."
# pnpm prisma migrate deploy

echo "================================================"
echo "🚀 Starting NestJS application..."
echo "================================================"
echo ""

# Start the application with error handling
exec node --max-old-space-size=512 dist/main.js 2>&1
