# 🔐 GitHub Actions - Avtomatik Deploy

Bu qo'llanma GitHub Actions orqali avtomatik deploy sozlash uchun.

## 📝 Nima Qiladi?

Har safar `main` branchga push qilganingizda:
1. ✅ Avtomatik Digital Ocean dropletga ulanadi
2. ✅ Yangi kodni pull qiladi
3. ✅ Database backup yaratadi
4. ✅ Docker imagelarni rebuild qiladi
5. ✅ Containerlarni qayta ishga tushiradi
6. ✅ Health check qiladi

## 🔧 Sozlash

### 1. GitHub Secrets Qo'shish

GitHub repository sahifangizga o'ting:
```
https://github.com/XushvaqtovSardor/aziz_botgrammy2/settings/secrets/actions
```

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Kerakli Secrets:

| Secret Name | Qiymat | Tavsif |
|------------|--------|---------|
| `SSH_HOST` | `142.93.22.81` | Digital Ocean droplet IP |
| `SSH_USER` | `root` | SSH username |
| `SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | SSH private key |
| `SSH_PORT` | `22` | SSH port (optional, default 22) |

### 2. SSH Key Olish

#### Windows da (PowerShell):

```powershell
# Agar droplet_2 faylingiz bor bo'lsa
Get-Content d:\c_p\aziz_bot_grammy\droplet_2 | Set-Clipboard
```

Yoki faylni ochib to'liq nusxalang:
```
notepad d:\c_p\aziz_bot_grammy\droplet_2
```

#### Dropletda yangi key yaratish:

Agar sizda SSH key bo'lmasa, dropletda yaratish mumkin:

```bash
# Dropletga ulanish
ssh root@142.93.22.81

# Yangi SSH key pair yaratish
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy -N ""

# Private key ni ko'rish (buni GitHub Secrets ga qo'yish kerak)
cat ~/.ssh/github_deploy

# Public key ni authorized_keys ga qo'shish
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Secrets Qo'shish

#### SSH_HOST
```
142.93.22.81
```

#### SSH_USER
```
root
```

#### SSH_KEY (to'liq private key)
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
...
(butun keyni qo'ying)
...
-----END OPENSSH PRIVATE KEY-----
```

**MUHIM:** 
- Private key ni to'liq nusxalang (boshi va oxiri bilan)
- Hech qanday extra space yoki newline qo'shmang
- Faqat key o'zini qo'ying

### 4. .env Faylni Dropletda Yaratish

**BU MUHIM!** Dropletda `.env` fayl bo'lishi kerak:

```bash
# Dropletga ulanish
ssh root@142.93.22.81

# Proyekt papkasiga o'tish
cd /root/aziz_botgrammy2

# .env yaratish
nano .env
```

`.env` ga yozing:
```env
# Bot
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_USERNAME=aziz_kino_bot

# Database
DATABASE_URL=postgresql://azizbot:securepassword@postgres:5432/aziz_bot_db?schema=public
POSTGRES_USER=azizbot
POSTGRES_PASSWORD=qwerty123strongpassword
POSTGRES_DB=aziz_bot_db

# Server
NODE_ENV=production
PORT=3000
WEB_PANEL_URL=http://142.93.22.81:3000/admin/

# Payme (agar kerak bo'lsa)
PAYME_MERCHANT_ID=your_id
PAYME_KEY=your_key
```

CTRL+X, Y, Enter bosib saqlang.

## 🚀 Ishlatish

### Avtomatik Deploy

```bash
# Kodni o'zgartiring
git add .
git commit -m "New feature"
git push origin main
```

Bu avtomatik ishga tushadi! 🎉

### GitHub Actions ni Ko'rish

1. GitHub repository ga o'ting
2. **Actions** tab ni oching
3. Har bir deploy ning loglarini ko'rish mumkin

### Manual Deploy (agar kerak bo'lsa)

GitHub da:
1. **Actions** → **Deploy to Digital Ocean**
2. **Run workflow** → **Run workflow**

## 📊 Monitoring

### GitHub Actions Logs

```
https://github.com/XushvaqtovSardor/aziz_botgrammy2/actions
```

Bu yerda:
- ✅ Muvaffaqiyatli deploylar
- ❌ Xatoliklar
- 📋 To'liq loglar

### Real-time Logs (Dropletda)

```bash
ssh root@142.93.22.81
cd /root/aziz_botgrammy2
docker-compose logs -f
```

## 🐛 Muammolarni Hal Qilish

### ❌ SSH Connection Failed

**Xato:** `Permission denied` yoki `Connection refused`

**Yechim:**
1. SSH_HOST to'g'ri ekanini tekshiring
2. SSH_KEY to'liq nusxalanganini tekshiring
3. Dropletda test qiling:
   ```bash
   ssh -i droplet_2 root@142.93.22.81
   ```

### ❌ .env file not found

**Xato:** `.env file not found`

**Yechim:**
Dropletda `.env` yarating (yuqoridagi ko'rsatmalarga qarang)

### ❌ Docker build failed

**Xato:** `docker-compose build` muvaffaqiyatsiz

**Yechim:**
1. Dropletda disk space tekshiring:
   ```bash
   df -h
   docker system df
   ```
2. Tozalash:
   ```bash
   docker system prune -a
   ```

### ❌ Port already in use

**Xato:** `port 3000 already in use`

**Yechim:**
```bash
# Dropletda
docker-compose down
docker ps -a  # Barcha containerlar
lsof -ti:3000 | xargs kill -9  # Port ni bo'shatish
```

## 🔒 Security Best Practices

### 1. SSH Key ni xavfsiz saqlash

- ❌ SSH key ni hech qachon commit qilmang
- ✅ Faqat GitHub Secrets da saqlang
- ✅ `.gitignore` da `droplet_*` qo'shilgan

### 2. .env faylni himoyalash

- ❌ `.env` ni hech qachon commit qilmang
- ✅ Faqat dropletda saqlang
- ✅ `.gitignore` da `.env` bor

### 3. Secrets rotate qilish

Har 3-6 oyda:
1. Yangi SSH key yarating
2. GitHub Secrets ni yangilang
3. Eski keyni o'chiring

## 📈 Workflow Features

### ✅ Avtomatik Features

- 🔄 Database backup (har deploy da)
- 🗑️ Eski Docker imagelarni tozalash
- 📊 Container status check
- 🔍 Health check
- 📋 Deploy loglari
- ⏰ Backup rotation (faqat oxirgi 5 ta)

### ⚡ Manual Trigger

GitHub Actions → Run workflow → Run

Bu foydali:
- Test qilish uchun
- Hotfix deploy uchun
- Rollback qilish uchun (eski commitga)

## 🎯 Advanced Usage

### Branch lar bo'yicha deploy

Agar `dev` branch ham kerak bo'lsa, `.github/workflows/deploy.yml` da:

```yaml
on:
  push:
    branches:
      - main
      - dev  # Qo'shing
```

### Specific files o'zgarganda deploy

Faqat muhim fayllar o'zgarganda:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'docker-compose.yml'
```

### Notification qo'shish

Telegram yoki email notification:

```yaml
- name: Send notification
  if: success()
  run: |
    curl -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
      -d chat_id=$CHAT_ID \
      -d text="✅ Deploy successful!"
```

## 📝 Workflow Status Badge

README.md ga badge qo'shing:

```markdown
![Deploy Status](https://github.com/XushvaqtovSardor/aziz_botgrammy2/actions/workflows/deploy.yml/badge.svg)
```

## ✅ Checklist

Deploy sozlash uchun:

- [ ] GitHub Secrets qo'shildi (SSH_HOST, SSH_USER, SSH_KEY)
- [ ] Dropletda `.env` fayl yaratildi
- [ ] SSH key test qilindi
- [ ] `.github/workflows/deploy.yml` fayli mavjud
- [ ] Birinchi push qilindi va test qilindi
- [ ] GitHub Actions logs tekshirildi
- [ ] Web panel ishlayapti

## 🎉 Tayyor!

Endi har safar:
```bash
git push origin main
```

Avtomatik deploy bo'ladi! 🚀

---

**Muhim linklar:**
- 📦 GitHub Actions: https://github.com/XushvaqtovSardor/aziz_botgrammy2/actions
- ⚙️ Secrets: https://github.com/XushvaqtovSardor/aziz_botgrammy2/settings/secrets/actions
- 🌐 Web Panel: http://142.93.22.81:3000/admin/
