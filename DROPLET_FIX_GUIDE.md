# Digital Ocean Droplet - Web Panel Tuzatish

IP: `142.93.22.81`

## 1. Dropletga ulanish

```bash
ssh root@142.93.22.81
```

## 2. Hozirgi holatni tekshirish

```bash
# Docker containerlarni tekshirish
docker ps -a

# App loglarini ko'rish
docker logs aziz_bot_app --tail 100

# Postgres loglarini ko'rish
docker logs aziz_bot_postgres --tail 50

# Port 3000 ishlab turganini tekshirish
netstat -tulpn | grep 3000
# yoki
ss -tulpn | grep 3000
```

## 3. Web panelni test qilish

```bash
# Localhost dan test
curl http://localhost:3000/admin/

# API endpoint test
curl http://localhost:3000/api/admin/stats

# Health check
curl http://localhost:3000/health
```

## 4. Agar ishlamasa - Muammolarni tuzatish

### 4.1. Container restart
```bash
cd /root/aziz_bot_grammy  # yoki qayerda joylashgan bo'lsa
docker-compose down
docker-compose up -d
docker logs -f aziz_bot_app
```

### 4.2. .env faylni tekshirish
```bash
cd /root/aziz_bot_grammy
cat .env

# .env faylda quyidagilar bo'lishi kerak:
# PORT=3000
# NODE_ENV=production
# DATABASE_URL=postgresql://azizbot:PASSWORD@postgres:5432/aziz_bot_db?schema=public
```

### 4.3. Firewall tekshirish
```bash
# UFW statusni tekshirish
sudo ufw status

# Port 3000 ni ochish (agar yopiq bo'lsa)
sudo ufw allow 3000/tcp
sudo ufw reload
```

### 4.4. Nginx agar ishlatilsa
```bash
# Nginx statusni tekshirish
sudo systemctl status nginx

# Nginx configni tekshirish
sudo nginx -t

# Nginx loglarini ko'rish
sudo tail -f /var/log/nginx/error.log
```

## 5. To'liq qayta deploy qilish

```bash
cd /root/aziz_bot_grammy

# Eski containerlarni to'xtatish va o'chirish
docker-compose down -v

# Yangi kod olish (agar git ishlatilsa)
git pull origin main

# .env faylni yangilash
nano .env
# Quyidagilarni tekshiring:
# - BOT_TOKEN to'g'ri
# - DATABASE_URL to'g'ri
# - PORT=3000

# Build va ishga tushirish
docker-compose build --no-cache
docker-compose up -d

# Loglarni kuzatish
docker-compose logs -f app
```

## 6. Database migration (agar kerak bo'lsa)

```bash
# Container ichida migration run qilish
docker exec -it aziz_bot_app npx prisma migrate deploy

# Yoki container ichiga kirish
docker exec -it aziz_bot_app sh
npx prisma migrate deploy
exit
```

## 7. Web panelga kirish

Browser ochib:
```
http://142.93.22.81:3000/admin/
```

Admin panel login:
1. Telegram botga `/admin` buyrug'ini yuboring
2. Bot sizga login link beradi
3. Linkni bosing va web panelga kiring

## 8. Monitoring va Debug

### Real-time loglar
```bash
# App loglar
docker logs -f aziz_bot_app

# Postgres loglar  
docker logs -f aziz_bot_postgres

# Barcha servislar
docker-compose logs -f
```

### Disk space tekshirish
```bash
df -h
docker system df
```

### Memory va CPU
```bash
htop
# yoki
docker stats
```

## 9. Umumiy muammolar va yechimlar

### Muammo: "Connection refused"
**Yechim:**
```bash
# Container ishlab turganini tekshiring
docker ps | grep aziz_bot_app

# Agar yo'q bo'lsa
docker-compose up -d

# Loglarni tekshiring
docker logs aziz_bot_app
```

### Muammo: "502 Bad Gateway" (Nginx bilan)
**Yechim:**
```bash
# App container ishlab turganini tekshiring
docker ps

# App portini tekshiring
docker port aziz_bot_app

# Nginx configni to'g'rilash
sudo nano /etc/nginx/sites-available/aziz_bot
# upstream { server localhost:3000; }
sudo nginx -t
sudo systemctl restart nginx
```

### Muammo: "Database connection error"
**Yechim:**
```bash
# Postgres container ishlab turganini tekshiring
docker ps | grep postgres

# Database ga ulanish test
docker exec -it aziz_bot_postgres psql -U azizbot -d aziz_bot_db

# Container ichidan connection test
docker exec -it aziz_bot_app sh
echo $DATABASE_URL
# postgresql://azizbot:PASSWORD@postgres:5432/aziz_bot_db?schema=public
exit
```

### Muammo: Web panel ochiladi lekin statistika ko'rinmaydi
**Yechim:**
```bash
# API endpointlarni test qilish
curl http://localhost:3000/api/admin/stats

# Browser console da xatoliklarni tekshirish (F12)
# Network tabda API requestlarni ko'ring
```

## 10. SSL (HTTPS) qo'shish (ixtiyoriy)

Agar domain name bo'lsa:

```bash
# Certbot o'rnatish
sudo apt install certbot python3-certbot-nginx

# SSL sertifikat olish
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## 11. Yangi o'zgarishlarni deploy qilish

```bash
cd /root/aziz_bot_grammy

# Yangi kodni olish
git pull origin main

# Rebuild va restart
docker-compose build app
docker-compose up -d

# Loglarni tekshirish
docker logs -f aziz_bot_app
```

## 12. Backup

```bash
# Database backup
docker exec aziz_bot_postgres pg_dump -U azizbot aziz_bot_db > backup_$(date +%Y%m%d).sql

# Backup restore
cat backup_20260111.sql | docker exec -i aziz_bot_postgres psql -U azizbot -d aziz_bot_db
```

## Yordam

Agar muammo hal bo'lmasa:
1. `/root/aziz_bot_grammy/logs` papkasidagi loglarni tekshiring
2. `docker-compose logs app` output ini ko'ring  
3. Browser console (F12) da xatoliklarni tekshiring
