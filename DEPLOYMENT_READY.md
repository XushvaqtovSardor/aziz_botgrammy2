# 🚀 READY TO DEPLOY!

## ✅ Tayyor Fayllar

### 🐳 Docker
- ✅ `Dockerfile` - Optimized multi-stage build
- ✅ `docker-compose.yml` - Full stack (app + postgres)
- ✅ `docker-entrypoint.sh` - Smart startup script
- ✅ `.dockerignore` - Optimized build context

### 📜 Deploy Scripts
- ✅ `deploy.sh` - Production deployment
- ✅ `quick-deploy.sh` - Fast restart
- ✅ `test-docker.bat` - Windows test script

### 🤖 GitHub Actions
- ✅ `.github/workflows/deploy.yml` - Auto deploy workflow

### 📚 Documentation
- ✅ `DEPLOY_GUIDE.md` - Digital Ocean qo'llanma (O'zbekcha)
- ✅ `GITHUB_ACTIONS.md` - CI/CD sozlash
- ✅ `DOCKER_DESKTOP.md` - Local test qo'llanma
- ✅ `README.md` - Updated with badges

### ⚙️ Configuration
- ✅ `.env.example` - Complete example
- ✅ `.gitignore` - SSH keys protected
- ✅ `Makefile` - Useful commands

---

## 🎯 3 Xil Deploy Usuli

### 1️⃣ Manual Deploy (Dropletda)

```bash
# Dropletga SSH
ssh root@YOUR_IP

# Clone yoki pull
git clone https://github.com/XushvaqtovSardor/aziz_botgrammy2.git
cd aziz_botgrammy2

# .env sozlash
cp .env.example .env
nano .env

# Deploy!
chmod +x deploy.sh
./deploy.sh
```

### 2️⃣ GitHub Actions (Avtomatik) ⭐ TAVSIYA

```bash
# 1. GitHub Secrets qo'shish
Settings → Secrets → Actions:
  - SSH_HOST = YOUR_IP
  - SSH_USER = root
  - SSH_KEY = (private key)

# 2. Push = Deploy!
git add .
git commit -m "Auto deploy test"
git push origin main

# 3. GitHub Actions tab da kuzating
```

### 3️⃣ Windows Local Test

```bash
# Docker Desktop ni ishga tushiring
# CMD/PowerShell da:
cd d:\c_p\aziz_bot_grammy
test-docker.bat
```

---

## 📋 Pre-Deploy Checklist

### Dropletda:

- [ ] Docker o'rnatilgan
- [ ] Docker Compose o'rnatilgan
- [ ] Port 3000 ochiq (firewall)
- [ ] `.env` fayl to'ldirilgan
- [ ] Git configured

### GitHub da:

- [ ] Repository public/private
- [ ] Secrets qo'shilgan (SSH_HOST, SSH_USER, SSH_KEY)
- [ ] `.github/workflows/deploy.yml` mavjud
- [ ] Main branch protected (optional)

### Local da:

- [ ] `.env` fayl mavjud
- [ ] Docker Desktop ishlab turipti
- [ ] Git configured

---

## 🔥 Quick Commands

### Droplet Management

```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Full rebuild
docker-compose down && docker-compose up -d --build

# Backup database
docker exec aziz_bot_postgres pg_dump -U azizbot aziz_bot_db > backup.sql

# Clean up
docker system prune -a
```

### GitHub Actions

```bash
# View workflows
https://github.com/XushvaqtovSardor/aziz_botgrammy2/actions

# Manual trigger
Actions → Deploy to Digital Ocean → Run workflow
```

### Make Commands

```bash
make docker-up       # Start containers
make docker-down     # Stop containers
make docker-logs     # View logs
make deploy          # Run deploy.sh
make backup-db       # Backup database
```

---

## 🐛 Troubleshooting

### Container ishlamayapti
```bash
docker-compose ps -a
docker logs aziz_bot_app --tail 100
docker-compose restart
```

### Port band
```bash
lsof -ti:3000 | xargs kill -9
docker-compose down
docker-compose up -d
```

### Database connection error
```bash
docker-compose restart postgres
docker-compose logs postgres
```

### GitHub Actions failed
```bash
# Check logs on GitHub
# Verify secrets are correct
# Test SSH manually:
ssh -i droplet_2 root@YOUR_IP
```

### Out of disk space
```bash
docker system prune -a
docker volume prune
rm -rf /root/backups/old_*
```

---

## 🎉 Success Indicators

### Dropletda:
```bash
$ docker-compose ps
NAME                 STATUS         PORTS
aziz_bot_app         Up (healthy)   0.0.0.0:3000->3000/tcp
aziz_bot_postgres    Up (healthy)   5432/tcp
```

### Web Panel:
- ✅ http://YOUR_IP:3000/admin/ ochiladi
- ✅ http://YOUR_IP:3000/health returns `{"status":"ok"}`

### Bot:
- ✅ Telegram bot javob beradi
- ✅ `/start` komanda ishlaydi
- ✅ Admin panel ochiladi

### GitHub Actions:
- ✅ Workflow badge yashil (README.md da)
- ✅ Latest deployment successful

---

## 📞 URLs

- 🌐 **Web Panel:** http://YOUR_IP:3000/admin/
- 🔍 **Health Check:** http://YOUR_IP:3000/health
- 🤖 **Bot:** https://t.me/YOUR_BOT_USERNAME
- 📊 **GitHub Actions:** https://github.com/XushvaqtovSardor/aziz_botgrammy2/actions
- ⚙️ **Secrets:** https://github.com/XushvaqtovSardor/aziz_botgrammy2/settings/secrets/actions

---

## 🎓 Next Steps

1. ✅ **Test local** - `test-docker.bat`
2. ✅ **Setup GitHub Actions** - Add secrets
3. ✅ **First deploy** - Push to main
4. ✅ **Monitor** - Check logs and status
5. ✅ **Configure bot** - Add channels, content
6. ✅ **Setup monitoring** - Grafana (optional)

---

## 💡 Pro Tips

1. **Backup regularly:**
   ```bash
   # Cron job
   0 2 * * * docker exec aziz_bot_postgres pg_dump -U azizbot aziz_bot_db > /root/backups/daily_$(date +\%Y\%m\%d).sql
   ```

2. **Monitor logs:**
   ```bash
   # Tail logs continuously
   docker-compose logs -f --tail=50
   ```

3. **Health checks:**
   ```bash
   # Add to cron
   */5 * * * * curl -f http://localhost:3000/health || systemctl restart docker
   ```

4. **GitHub Actions badge:**
   Add to README for status visibility

5. **Use .env properly:**
   Never commit sensitive data!

---

**🎊 Hammasi tayyor! Deploy qiling va test qiling!**

Documentation:
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)
- [DOCKER_DESKTOP.md](./DOCKER_DESKTOP.md)
