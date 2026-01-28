# 🐛 Bot Debugging Guide

## Serverda Bot Ishlamasa (Bot Javob Bermayotgan Bo'lsa)

### 1. Loglarni Tekshirish

```bash
# Barcha loglarni ko'rish
tail -f logs/combined-$(date +%Y-%m-%d).log

# Faqat errorlarni ko'rish
tail -f logs/error-$(date +%Y-%m-%d).log

# Debug loglar (development mode)
tail -f logs/debug-$(date +%Y-%m-%d).log
```

### 2. Status Tekshirish

```bash
# Status check skriptini ishlatish
bash check-bot-status.sh

# Yoki qo'lda tekshirish
curl http://localhost:3000/health
```

### 3. Asosiy Muammolar va Yechimlar

#### ❌ Bot Token Muammosi
**Belgi:** `BOT_TOKEN is not defined in environment variables`

**Yechim:**
```bash
# .env faylni tekshiring
cat .env | grep BOT_TOKEN

# Agar bo'sh bo'lsa, qo'shing
echo "BOT_TOKEN=your_bot_token_here" >> .env

# Serverni qayta ishga tushiring
pnpm run start:prod  # yoki docker compose restart app
```

#### ❌ Database Connection Muammosi
**Belgi:** `Database connection failed` yoki `P1001: Can't reach database`

**Yechim:**
```bash
# Database URL ni tekshiring
echo $DATABASE_URL

# PostgreSQL ishlatyaptimi tekshiring
sudo systemctl status postgresql
# yoki docker bilan
docker ps | grep postgres

# Database connection test
npx prisma db pull

# Agar database yo'q bo'lsa, yarating
npx prisma migrate deploy
```

#### ❌ Bot API ga Ulanish Muammosi
**Belgi:** `Failed to start Grammy Bot` yoki `connect ETIMEDOUT`

**Yechim:**
```bash
# Internet ulanishni tekshiring
ping api.telegram.org

# Proxy kerakmi? VPN kerakmi?
# Agar Telegram bloklansan:
# 1. VPN ishlatish
# 2. Proxy sozlash
# 3. Telegram bot API ni local server sifatida sozlash
```

#### ❌ Port 3000 Band
**Belgi:** `EADDRINUSE: address already in use :::3000`

**Yechim:**
```bash
# Qaysi process 3000 portni ishlatayotganini topish
lsof -i :3000
# yoki
netstat -tuln | grep 3000

# Process ni to'xtatish (PID ni topgandan keyin)
kill -9 <PID>

# Yoki boshqa port ishlatish
PORT=3001 pnpm run start:prod
```

#### ❌ Memory/Performance Muammosi
**Belgi:** Bot sekin ishlaydi, yoki crash bo'ladi

**Yechim:**
```bash
# Memory usage tekshirish
free -h
docker stats  # Docker bilan

# Node process memory limit oshirish
node --max-old-space-size=1024 dist/main

# PM2 bilan restart (production)
pm2 restart aziz-bot --update-env
```

### 4. Production Deploy Tekshiruvi

#### Docker Deploy
```bash
# Container status
docker compose ps

# Container logs
docker compose logs -f app

# Container ichiga kirish
docker compose exec app sh

# Environment variables tekshirish
docker compose exec app env | grep BOT_TOKEN

# Restart qilish
docker compose restart app

# Rebuild va restart
docker compose up -d --build
```

#### PM2 Deploy
```bash
# PM2 status
pm2 status

# Logs
pm2 logs aziz-bot

# Restart
pm2 restart aziz-bot

# Memory/CPU monitoring
pm2 monit

# Environment variables tekshirish
pm2 env 0
```

### 5. Telegram Bot Status Tekshirish

```bash
# Bot username olish (API orqali)
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# Webhook status (agar webhook ishlatilsa)
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Bot ma'lumotlari
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
```

### 6. Log Darajalari

Loglar 4 xil level da yoziladi:

1. **ERROR** - Kritik xatolar
2. **WARN** - Ogohlantirishlar
3. **INFO** - Oddiy ma'lumotlar
4. **DEBUG** - Debug ma'lumotlari (faqat development)

#### Log Level o'zgartirish

```bash
# Production (faqat error)
NODE_ENV=production pnpm run start:prod

# Development (barcha loglar)
NODE_ENV=development pnpm run start:dev
```

### 7. Realtime Monitoring

```bash
# Barcha loglarni realtime kuzatish
tail -f logs/combined-*.log logs/error-*.log

# Faqat errorlar
watch -n 1 'tail -20 logs/error-$(date +%Y-%m-%d).log'

# Process monitoring
watch -n 2 'ps aux | grep node'
```

### 8. Common Error Messages

| Error Message | Sabab | Yechim |
|--------------|-------|--------|
| `BOT_TOKEN is not defined` | Token yo'q | .env fayldagi BOT_TOKEN ni tekshiring |
| `Database connection failed` | DB ulanmayapti | DATABASE_URL va PostgreSQL ni tekshiring |
| `Failed to start Grammy Bot` | Telegram API ga ulanmayapti | Internet va firewall tekshiring |
| `EADDRINUSE` | Port band | Boshqa port ishlating yoki procesni to'xtating |
| `Cannot find module` | Dependencies yo'q | `pnpm install` qiling |
| `Nest application successfully started` lekin bot javob bermaydi | Handler register bo'lmagan | Loglarni tekshiring, handler initialization loglarni qidiring |

### 9. Handler Registration Tekshiruvi

Agar bot start bo'ldi lekin javob bermasa, handlelar ro'yxatdan o'tganini tekshiring:

```bash
# Loglardan qidirish
grep "Handler" logs/combined-$(date +%Y-%m-%d).log

# Kutilayotgan output:
# ✅ UserHandler initialized successfully
# ✅ AdminHandler initialized successfully
# ✅ All user handlers registered successfully
```

### 10. Telegram Bot Status Dashboard

Botingiz haqida to'liq ma'lumot olish uchun:

```bash
# Health check endpoint
curl http://localhost:3000/health | jq

# Expected output:
{
  "status": "ok",
  "timestamp": "2026-01-28T...",
  "service": "aziz-kino-bot",
  "environment": "production",
  "botToken": "SET",
  "database": "SET"
}
```

### 11. Quick Fix Commands

```bash
# Tezkor restart
pm2 restart all  # PM2 bilan
# yoki
docker compose restart  # Docker bilan

# Loglarni tozalash
rm -rf logs/*.log

# Dependencies ni qayta o'rnatish
rm -rf node_modules package-lock.json
pnpm install

# Database ni reset qilish (EHTIYOT!)
npx prisma migrate reset
npx prisma migrate deploy

# Full rebuild
pnpm run build
pnpm run start:prod
```

### 12. Support

Agar muammo hal bo'lmasa:

1. **Loglarni yig'ing:**
   ```bash
   tar -czf bot-logs-$(date +%Y%m%d).tar.gz logs/
   ```

2. **Environment info:**
   ```bash
   node --version
   npm --version
   cat /etc/os-release
   ```

3. **Bot status:**
   ```bash
   bash check-bot-status.sh > bot-status.txt
   ```

4. Bu fayllarni developer bilan bo'lishing!

---

## Debug Mode ni Yoqish

Development environmentda to'liq debug loglarini yoqish:

```bash
# .env faylga qo'shing
NODE_ENV=development
LOG_LEVEL=debug

# Restart qiling
pnpm run start:dev
```

Bu sizga quyidagilarni ko'rsatadi:
- Har bir update kelganda log
- Har bir handler chaqirilganda log
- Har bir database queryda log
- Har bir API callda log

---

**Eslatma:** Production environmentda `LOG_LEVEL=error` ishlatish tavsiya etiladi, chunki debug loglar juda ko'p joy egallaydi.
