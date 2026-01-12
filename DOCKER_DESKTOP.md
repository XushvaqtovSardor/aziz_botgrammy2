# 🐳 Docker Desktop bilan Local Test

Bu qo'llanma Windows kompyuteringizda Docker Desktop ishlatib botni test qilish uchun.

## 📋 Kerakli Dasturlar

1. **Docker Desktop** - https://www.docker.com/products/docker-desktop/
2. **Git** (agar clone qilmoqchi bo'lsangiz)

## 🚀 Tez Boshlash

### 1. Docker Desktop ni o'rnatish va ishga tushirish

1. Docker Desktop ni yuklab oling va o'rnating
2. Docker Desktop ni oching
3. Statusni tekshiring - Docker icon tray da yashil bo'lishi kerak

### 2. Proyektni tayyorlash

PowerShell yoki CMD ni oching:

```bash
cd d:\c_p\aziz_bot_grammy
```

### 3. .env faylni sozlash

```bash
# .env yaratish
copy .env.example .env

# .env ni edit qilish (Notepad yoki VS Code da)
notepad .env
```

`.env` faylda eng muhim qatorlar:

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
DATABASE_URL=postgresql://azizbot:securepassword@postgres:5432/aziz_bot_db?schema=public
POSTGRES_PASSWORD=securepassword
PORT=3000
```

### 4. Test qilish (Automatic)

Windows uchun bat file:

```bash
test-docker.bat
```

Bu script avtomatik:
- ✅ Docker borligini tekshiradi
- ✅ .env yaratadi (agar yo'q bo'lsa)
- ✅ Build qiladi
- ✅ Ishga tushiradi
- ✅ Test qiladi

### 5. Manual Start

Agar manual boshqarmoqchi bo'lsangiz:

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Status
docker-compose ps

# Logs
docker-compose logs -f
```

## 📊 Tekshirish

### Container ishlayaptimi?

```bash
docker ps
```

Natija:
```
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
abc123...      aziz_bot_app       Up 2 mins      0.0.0.0:3000->3000/tcp   aziz_bot_app
def456...      postgres:16        Up 2 mins      5432/tcp                 aziz_bot_postgres
```

### Web panelni ochish

Brauzerda: http://localhost:3000/admin/

### Health check

Brauzerda: http://localhost:3000/health

Yoki PowerShell da:
```powershell
curl http://localhost:3000/health
```

### Loglarni ko'rish

```bash
# Barcha loglar
docker-compose logs -f

# Faqat app
docker logs -f aziz_bot_app

# Faqat database
docker logs -f aziz_bot_postgres
```

## 🛠️ Foydali Komandalar

### Restart

```bash
docker-compose restart
```

### To'xtatish

```bash
docker-compose down
```

### To'liq tozalash (database ham)

```bash
docker-compose down -v
docker system prune -a
```

### Yangi build

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Container ichiga kirish

```bash
# App container
docker exec -it aziz_bot_app sh

# Database container
docker exec -it aziz_bot_postgres psql -U azizbot -d aziz_bot_db
```

### Container statistikasi

```bash
docker stats
```

## 🐛 Muammolarni Hal Qilish

### Port band (3000)

Agar port 3000 band bo'lsa:

**PowerShell** (Admin sifatida):
```powershell
# Port 3000 ishlatayotgan processni topish
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# O'chirish
Stop-Process -Id <PROCESS_ID> -Force
```

Yoki `.env` da `PORT=3001` qilib o'zgartiring.

### Docker Desktop ishlamayapti

1. Docker Desktop ni qayta ishga tushiring
2. WSL 2 o'rnatilganini tekshiring
3. Virtualization enabled ekanini tekshiring (BIOS)

### Build xatosi

```bash
# Cache tozalash
docker system prune -a

# Qayta build
docker-compose build --no-cache
```

### Database ulanmayapti

```bash
# Database containerini restart
docker-compose restart postgres

# Yoki to'liq restart
docker-compose down
docker-compose up -d
```

### Memory to'lib ketdi

Docker Desktop Settings:
1. Settings → Resources → Advanced
2. Memory ni 4GB yoki ko'proq qiling
3. Apply & Restart

## 🎯 VS Code Integration

### Docker Extension

1. VS Code da Docker extension o'rnating
2. Left sidebar da Docker icon paydo bo'ladi
3. Containerlarni GUI dan boshqarish mumkin

### Useful keybindings

- `Ctrl+Shift+P` → "Docker: Compose Up"
- `Ctrl+Shift+P` → "Docker: Compose Down"
- `Ctrl+Shift+P` → "Docker: View Logs"

## 📝 Development Workflow

1. Kodni o'zgartirish
2. Docker ni restart qilish:
   ```bash
   docker-compose restart app
   ```
   
   Yoki rebuild:
   ```bash
   docker-compose up -d --build
   ```

3. Loglarni kuzatish:
   ```bash
   docker-compose logs -f app
   ```

## ✅ Production ga o'tish

Local da test qilganingizdan keyin:

1. Kodni GitHub ga push qiling
2. Digital Ocean dropletda:
   ```bash
   cd /root/aziz_botgrammy2
   git pull origin main
   ./deploy.sh
   ```

3. Batafsil: `DEPLOY_GUIDE.md` ga qarang

## 🆘 Yordam

Agar qiynalayotgan bo'lsangiz:

1. Docker Desktop loglarini tekshiring
2. `docker-compose logs -f` ga qarang
3. `.env` faylni tekshiring
4. Docker Desktop ni restart qiling

---

**Tayyor!** Bot local da ishlab turipti 🎉
