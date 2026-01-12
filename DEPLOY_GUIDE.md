# 🚀 Digital Ocean Deploy Qo'llanma

Bu qo'llanma Aziz Bot ni Digital Ocean dropletga deploy qilish uchun.

## 📋 Talablar

- Digital Ocean droplet (Ubuntu 20.04+)
- Docker va Docker Compose o'rnatilgan
- Git o'rnatilgan
- Telegram bot token

## 🔧 1. Dropletni Tayyorlash

### SSH orqali ulanish
```bash
ssh root@YOUR_DROPLET_IP
```

### Docker o'rnatish
```bash
# Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose o'rnatish
apt-get update
apt-get install -y docker-compose

# Docker avtomatik ishga tushishi
systemctl enable docker
systemctl start docker
```

## 📦 2. Proyektni Clone Qilish

```bash
cd /root
git clone https://github.com/YOUR_USERNAME/aziz_botgrammy2.git
cd aziz_botgrammy2
```

## ⚙️ 3. Environment Variables Sozlash

### .env fayl yaratish
```bash
cp .env.example .env
nano .env
```

### .env faylga quyidagilarni yozing:
```env
# Bot ma'lumotlari
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_USERNAME=aziz_kino_bot

# Database (o'zgartirmang!)
DATABASE_URL=postgresql://azizbot:securepassword@postgres:5432/aziz_bot_db?schema=public
POSTGRES_USER=azizbot
POSTGRES_PASSWORD=qwerty123strong_password
POSTGRES_DB=aziz_bot_db

# Server
NODE_ENV=production
PORT=3000
WEB_PANEL_URL=http://142.93.22.81:3000/admin/

# Payme (agar kerak bo'lsa)
PAYME_MERCHANT_ID=your_merchant_id
PAYME_KEY=your_key
```

**CTRL+X**, keyin **Y**, keyin **Enter** bosing saqlash uchun.

## 🚀 4. Deploy Qilish

### Birinchi marta deploy qilish
```bash
chmod +x deploy.sh
./deploy.sh
```

### Yoki qisqa yo'l
```bash
docker-compose up -d --build
```

## 📊 5. Holatni Tekshirish

### Containerlar ishlayaptimi?
```bash
docker ps
```

Natija:
```
CONTAINER ID   IMAGE                    STATUS         PORTS                    NAMES
abc123...      aziz_bot_app             Up 2 mins      0.0.0.0:3000->3000/tcp   aziz_bot_app
def456...      postgres:16-alpine       Up 2 mins      0.0.0.0:5432->5432/tcp   aziz_bot_postgres
```

### Loglarni ko'rish
```bash
# Barcha loglar
docker-compose logs -f

# Faqat app loglari
docker logs -f aziz_bot_app

# Faqat database loglari  
docker logs -f aziz_bot_postgres
```

### Web panelni tekshirish
```bash
curl http://localhost:3000/health
```

Yoki brauzerda: `http://YOUR_DROPLET_IP:3000/admin/`

## 🔄 6. Yangilash (Update)

Kodni yangilash uchun:

```bash
cd /root/aziz_botgrammy2
git pull origin main
docker-compose down
docker-compose up -d --build
```

Yoki deploy scriptni ishlatish:
```bash
./deploy.sh
```

## 🛑 7. To'xtatish va O'chirish

### Containerlarni to'xtatish
```bash
docker-compose down
```

### Barcha ma'lumotlarni o'chirish (database ham)
```bash
docker-compose down -v
```

### Restart qilish
```bash
docker-compose restart
```

## 🐛 8. Muammolarni Hal Qilish

### Container ishlamayapti
```bash
docker ps -a  # Barcha containerlar
docker logs aziz_bot_app --tail 100  # Xatoliklarni ko'rish
```

### Database ulanmayapti
```bash
# Postgres ishlayaptimi?
docker exec -it aziz_bot_postgres psql -U azizbot -d aziz_bot_db

# Agar ishlamasa
docker-compose down
docker-compose up -d postgres
sleep 10
docker-compose up -d app
```

### Port band
```bash
# Port 3000 bandmi?
netstat -tulpn | grep 3000

# Agar boshqa process ishlatsa
lsof -ti:3000 | xargs kill -9
```

### Memory to'lib ketdi
```bash
# Docker cacheni tozalash
docker system prune -a

# Container restart
docker-compose restart app
```

## 🔥 9. Firewall Sozlash

```bash
# UFW o'rnatish
apt-get install -y ufw

# Port 3000 ochish
ufw allow 3000/tcp
ufw allow 22/tcp  # SSH uchun
ufw enable
ufw status
```

## 📱 10. Foydali Komandalar

```bash
# Container ichiga kirish
docker exec -it aziz_bot_app sh

# Database ichiga kirish
docker exec -it aziz_bot_postgres psql -U azizbot -d aziz_bot_db

# Container statistikasi (CPU, Memory)
docker stats

# Disk space
df -h
docker system df

# Backup yaratish
docker exec aziz_bot_postgres pg_dump -U azizbot aziz_bot_db > backup.sql

# Backup qayta tiklash
docker exec -i aziz_bot_postgres psql -U azizbot -d aziz_bot_db < backup.sql
```

## ✅ Tayyor!

Bot ishga tushdi! 🎉

- 🤖 Telegram bot: `@your_bot_username`
- 🌐 Web panel: `http://YOUR_IP:3000/admin/`
- 📊 Health check: `http://YOUR_IP:3000/health`

## 📞 Yordam

Agar muammo bo'lsa:
1. Loglarni tekshiring: `docker-compose logs -f`
2. Container holatini tekshiring: `docker ps -a`
3. `.env` faylni tekshiring: `cat .env`
