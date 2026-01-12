# 🚀 Quick Start Guide

## Local Test (Development)

### 1. Prerequisites
```bash
# Check if you have these installed
node --version    # Should be 20+
pnpm --version    # Should be 8+
docker --version  # Any recent version
```

### 2. Setup Environment
```bash
# Copy example file
cp .env.production.example .env.production

# Edit with your values
# Minimum required:
#   - BOT_TOKEN (from @BotFather)
#   - BOT_USERNAME
#   - POSTGRES_PASSWORD (any strong password)
```

### 3. Build and Run
```bash
# Windows
test-docker-build.bat

# Linux/Mac
chmod +x test-docker-build.sh
./test-docker-build.sh
```

Or manually:
```bash
docker compose build
docker compose up -d
docker compose logs -f app
```

---

## Production Deployment

### Option A: One Command Deploy

**On your server:**
```bash
cd /root/aziz_botgrammy2
chmod +x deploy-production.sh
./deploy-production.sh
```

### Option B: Step by Step

**1. Prepare .env.production locally**
```bash
# Edit these values:
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_USERNAME=your_bot
POSTGRES_PASSWORD=YourStrongPassword123!
DATABASE_URL=postgresql://azizbot:YourStrongPassword123!@postgres:5432/aziz_bot_db?schema=public
WEB_PANEL_URL=http://YOUR_SERVER_IP:3000/admin/
```

**2. Upload to server**
```bash
# From Windows (Git Bash or PowerShell)
scp .env.production root@YOUR_SERVER_IP:/root/aziz_botgrammy2/
```

**3. Deploy on server**
```bash
# SSH to server
ssh root@YOUR_SERVER_IP

# Go to project directory
cd /root/aziz_botgrammy2

# Deploy
docker compose down
docker compose build --no-cache
docker compose up -d

# Check logs
docker compose logs -f app
```

---

## Useful Commands

### Docker Operations
```bash
# Build fresh
docker compose build --no-cache

# Start services
docker compose up -d

# Stop services
docker compose down

# View logs (follow)
docker compose logs -f app

# View logs (last 100 lines)
docker compose logs --tail=100 app

# Check status
docker compose ps

# Restart app
docker compose restart app
```

### Troubleshooting
```bash
# Check environment variables
docker compose exec app env | grep BOT_TOKEN
docker compose exec app env | grep DATABASE_URL

# Enter container
docker compose exec app sh

# Check database connection (inside container)
docker compose exec app sh
pnpm prisma db push

# View PostgreSQL logs
docker compose logs postgres

# Check health
curl http://localhost:3000/health
```

### Database Operations
```bash
# Backup database
docker compose exec postgres pg_dump -U azizbot aziz_bot_db > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T postgres psql -U azizbot aziz_bot_db < backup.sql

# Connect to PostgreSQL
docker compose exec postgres psql -U azizbot -d aziz_bot_db
```

---

## Common Issues

### ❌ Build fails: "prisma/schema.prisma: file not found"
**Solution:** Make sure you're building from project root and prisma/ folder exists.

### ❌ App exits with code 1
**Solutions:**
1. Check BOT_TOKEN is set: `docker compose exec app env | grep BOT_TOKEN`
2. Check DATABASE_URL is correct: `docker compose exec app env | grep DATABASE_URL`
3. View detailed logs: `docker compose logs app`

### ❌ Database connection fails
**Solutions:**
1. Check postgres is running: `docker compose ps`
2. Check DATABASE_URL uses `postgres` as host (not `localhost`)
3. Wait longer - postgres may still be starting
4. Check password matches in both POSTGRES_PASSWORD and DATABASE_URL

### ❌ Port already in use
**Solution:**
```bash
# Change port in docker-compose.yml:
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_TOKEN` | ✅ Yes | - | Telegram bot token from @BotFather |
| `BOT_USERNAME` | ✅ Yes | - | Bot username (without @) |
| `POSTGRES_USER` | ⚠️ | azizbot | Database username |
| `POSTGRES_PASSWORD` | ✅ Yes | - | Database password |
| `POSTGRES_DB` | ⚠️ | aziz_bot_db | Database name |
| `DATABASE_URL` | ✅ Yes | - | Full PostgreSQL connection string |
| `WEB_PANEL_URL` | ⚠️ | localhost | Admin panel URL |
| `NODE_ENV` | ⚠️ | production | Environment (production/development) |
| `PORT` | ⚠️ | 3000 | Application port |
| `LOG_LEVEL` | ❌ | info | Logging level |
| `PAYME_*` | ❌ | - | Payment gateway credentials |

---

## Health Checks

### Application Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T10:30:00.000Z",
  "service": "aziz-kino-bot"
}
```

### Docker Health
```bash
docker compose ps
```

All services should show "healthy" or "running".

---

## Getting Help

1. **Check logs first:** `docker compose logs app`
2. **Check environment:** `docker compose exec app env`
3. **Check container status:** `docker compose ps`
4. **Read full guide:** [PRODUCTION_DEPLOY.md](./PRODUCTION_DEPLOY.md)

---

**Happy Coding! 🎉**
