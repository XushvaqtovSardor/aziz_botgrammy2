#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready..."
max_attempts=30
attempt=0

until pnpm prisma db push --skip-generate 2>/dev/null || [ $attempt -eq $max_attempts ]; do
  attempt=$((attempt+1))
  echo "⏳ Attempt $attempt/$max_attempts - Waiting for database..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Database connection failed after $max_attempts attempts"
  exit 1
fi

echo "✅ Database connection established"

echo "🔄 Running database migrations..."
pnpm prisma migrate deploy

echo "✅ Migrations completed"

echo "🚀 Starting application..."
exec node --max-old-space-size=512 dist/main
