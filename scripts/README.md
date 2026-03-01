# 🛠️ Scripts Papkasi

Bu papkada database backup va restore scriptlari joylashgan.

## 📋 Fayllar

### Backup Scriptlari

- **`backup.sh`** - Docker container ichida ishlaydigan avtomatik backup scripti
- **`manual-backup.sh`** - Docker tashqaridan ishlatish uchun manual backup scripti

### Restore Scriptlari

- **`restore.sh`** - Docker container ichida ishlaydigan restore scripti
- **`manual-restore.sh`** - Docker tashqaridan ishlatish uchun manual restore scripti

### Test va Boshqa

- **`test-backup.sh`** - Backup sistemasini test qilish scripti
- **`setup.sh`** - Dastlabki sozlash scripti

## 🚀 Tezkor Foydalanish

### Backup Yaratish

```bash
# Development (local)
./scripts/manual-backup.sh
```

### Restore Qilish

```bash
# 1. Backuplarni ko'rish
ls -lht backups/

# 2. Restore qilish
./scripts/manual-restore.sh aziz_db_backup_20260223_143000.sql.gz

# 3. MUHIM: Botni qayta ishga tushirish
docker compose restart app
```

### Test Qilish

```bash
# Backup sistemasini test qilish
chmod +x scripts/test-backup.sh
./scripts/test-backup.sh
```

## 📖 To'liq Qo'llanma

To'liq va batafsil qo'llanma uchun o'qing:

```bash
cat ../BACKUP_QOLLANMA.md
```

Yoki:

```bash
cat RESTORE_GUIDE.md
```

## ⚠️ Muhim Eslatmalar

1. **Restore qilgandan keyin botni ALBATTA qayta ishga tushiring:**
   ```bash
   docker compose restart app
   ```

2. **Restore qilishdan oldin yangi backup yarating:**
   ```bash
   ./scripts/manual-backup.sh
   ```

3. **Backup fayllarni tekshiring:**
   ```bash
   gzip -t backups/aziz_db_backup_*.sql.gz
   ```

## 🆘 Yordam

Muammoga duch kelsangiz:

1. Test scriptini ishga tushiring:
   ```bash
   ./scripts/test-backup.sh
   ```

2. Loglarni tekshiring:
   ```bash
   docker logs aziz_database --tail 50
   docker logs aziz_bot --tail 50
   ```

3. To'liq qo'llanmani o'qing:
   ```bash
   cat ../BACKUP_QOLLANMA.md
   ```
