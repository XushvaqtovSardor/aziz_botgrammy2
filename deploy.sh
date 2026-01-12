#!/bin/bash

# Digital Ocean deployment script for Aziz Bot
# Usage: ./deploy.sh [OPTIONS]
# Options:
#   --skip-build    Skip Docker image rebuild
#   --no-logs       Don't tail logs after deployment

set -e

SKIP_BUILD=false
NO_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --no-logs)
      NO_LOGS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "🚀 Starting deployment..."
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please create .env file from .env.example"
  exit 1
fi

# Load environment variables
echo "📝 Loading environment variables..."
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
REQUIRED_VARS=("BOT_TOKEN" "DATABASE_URL")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Required variable $var is not set!"
    exit 1
  fi
done

echo "✅ Environment variables loaded"

# Create backup of database
if docker ps | grep -q aziz_bot_postgres; then
  echo "💾 Creating database backup..."
  mkdir -p backups
  BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
  docker exec aziz_bot_postgres pg_dump -U "${POSTGRES_USER:-azizbot}" "${POSTGRES_DB:-aziz_bot_db}" > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Backup skipped (no existing database)"
  if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup saved: $BACKUP_FILE"
  fi
fi

# Pull latest changes if git repo
if [ -d .git ]; then
  echo "📥 Pulling latest code..."
  git pull origin main || echo "⚠️  Git pull skipped"
fi

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down

# Clean up old images if not skipping build
if [ "$SKIP_BUILD" = false ]; then
  echo "🗑️  Removing old images..."
  docker image prune -f
  
  # Build new images
  echo "🔨 Building new images..."
  echo "This may take a few minutes..."
  docker-compose build --no-cache
  echo "✅ Build completed"
else
  echo "⏭️  Skipping build..."
fi

# Start database first
echo "🗄️  Starting database..."
docker-compose up -d postgres

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
retries=0
max_retries=30
while ! docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-azizbot}" >/dev/null 2>&1; do
  retries=$((retries + 1))
  if [ $retries -ge $max_retries ]; then
    echo "❌ Database failed to start after $max_retries attempts"
    exit 1
  fi
  echo "Waiting... ($retries/$max_retries)"
  sleep 2
done
echo "✅ Database is ready"

# Start all services
echo "▶️  Starting all services..."
docker-compose up -d

# Wait for app to be healthy
echo "⏳ Waiting for application to be healthy..."
sleep 5
retries=0
max_retries=20
while ! docker-compose ps | grep aziz_bot_app | grep -q "healthy\|Up"; do
  retries=$((retries + 1))
  if [ $retries -ge $max_retries ]; then
    echo "⚠️  Application health check timeout"
    break
  fi
  echo "Waiting for app... ($retries/$max_retries)"
  sleep 3
done

# Show status
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "✅ Deployment completed successfully!"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "🌐 Web Panel: http://YOUR_IP:3000/admin/"
echo "🔍 Health Check: http://YOUR_IP:3000/health"

# Show logs
if [ "$NO_LOGS" = false ]; then
  echo ""
  echo "📋 Showing logs (Ctrl+C to exit)..."
  echo "-----------------------------------"
  docker-compose logs -f --tail=50
fi
