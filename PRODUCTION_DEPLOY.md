# 🚀 Production Deployment Guide

## Boshlash uchun qadam-baqadam yo'riqnoma

### 1️⃣ .env.production faylini tayyorlash

`.env.production` faylini ochib, quyidagi qiymatlarni to'ldiring:

```bash
# 🤖 Bot konfiguratsiyasi (BotFather dan oling)
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
BOT_USERNAME=your_bot_username

# 🗄️ Database parolini o'zgartiring (kuchli parol ishlating!)
POSTGRES_PASSWORD=SecurePass2026!@#

# 🌐 Server IP manzilingizni qo'ying
WEB_PANEL_URL=http://161.35.172.239:3000/admin/
```

### 2️⃣ Fayllarni serverga yuklash

```bash
# Local kompyuterdan (Windows PowerShell yoki Git Bash)
scp .env.production root@YOUR_SERVER_IP:/root/aziz_botgrammy2/.env.production

# Yoki faylni ochib, copy-paste qiling
```

### 3️⃣ Serverga ulanish va deploy qilish

```bash
# SSH orqali serverga kirish
ssh root@YOUR_SERVER_IP

# Loyiha papkasiga o'tish
cd /root/aziz_botgrammy2

# Eski containerlarni to'xtatish va o'chirish
docker compose down

# Yangi image yaratish
docker compose build --no-cache

# Containerlarni ishga tushirish
docker compose up -d

# Loglarni kuzatish
docker compose logs -f app
```

### 4️⃣ Tekshirish

```bash
# Container holatini tekshirish
docker compose ps

# App loglarini ko'rish
docker compose logs app

# Database loglarini ko'rish  
docker compose logs postgres

# Health check
curl http://localhost:3000/health
```

### 5️⃣ Muammolarni hal qilish

#### Agar bot ishlamasa:

```bash
# Container ichiga kirish
docker compose exec app sh

# Environment variables ni tekshirish
env | grep BOT_TOKEN
env | grep DATABASE_URL

# Prisma holatini tekshirish
pnpm prisma db push

# Exit from container
exit
```

#### Database muammolari:

```bash
# PostgreSQL container ga kirish
docker compose exec postgres psql -U azizbot -d aziz_bot_db

# Database jadvallarini ko'rish
\dt

# Exit from psql
\q
```

#### Containerlarni qayta ishga tushirish:

```bash
# Hammani to'xtatish
docker compose down

# Volume larni ham o'chirish (DIQQAT: Ma'lumotlar o'chadi!)
docker compose down -v

# Qayta ishga tushirish
docker compose up -d
```

### 6️⃣ Foydali buyruqlar

```bash
# Real-time loglar
docker compose logs -f app

# Oxirgi 100 ta log
docker compose logs --tail=100 app

# Container holatini tekshirish
docker compose ps

# Resource usage
docker stats

# Containerlarni restart qilish
docker compose restart app

# Faqat app ni rebuild qilish
docker compose up -d --build app
```

### 7️⃣ Backup olish

```bash
# Database backup
docker compose exec postgres pg_dump -U azizbot aziz_bot_db > backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v aziz_bot_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d).tar.gz /data
```

## 🔧 Muhim sozlamalar

### Environment Variables

| Variable | Tavsif | Majburiy |
|----------|--------|----------|
| `BOT_TOKEN` | Telegram bot token | ✅ Ha |
| `BOT_USERNAME` | Bot username (@siz) | ✅ Ha |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Ha |
| `POSTGRES_PASSWORD` | Database paroli | ✅ Ha |
| `WEB_PANEL_URL` | Admin panel URL | ✅ Ha |
| `PAYME_*` | To'lov sozlamalari | ❌ Yo'q |

### Portlar

- **3000**: Web panel va Bot API
- **5432**: PostgreSQL (tashqaridan faqat development uchun)

### Xavfsizlik

1. **Parollarni o'zgartiring**: Default parollarni ishlatmang!
2. **Firewall**: Faqat kerakli portlarni oching
3. **SSL/TLS**: Production da HTTPS ishlating (nginx bilan)
4. **Backup**: Muntazam backup oling

## 📊 Monitoring

### Docker Stats

```bash
# Resource usage
docker stats aziz_bot_app aziz_bot_postgres

# Continuous monitoring
watch -n 2 'docker stats --no-stream'
```

### Logs Location

- **App logs**: `./logs/` papkada
- **Docker logs**: `docker compose logs app`

## 🆘 Yordam

Agar muammo yuzaga kelsa:
1. Loglarni tekshiring: `docker compose logs app`
2. Environment variables ni tekshiring
3. Database connection ni tekshiring
4. Bot tokenni tekshiring (BotFather da)

---

**Muvaffaqiyatli deploy! 🎉**
