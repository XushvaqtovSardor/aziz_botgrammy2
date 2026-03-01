#!/bin/bash

# Manual Restore Script (Docker-dan tashqarida ishlatish uchun)
# Bu script Docker container ichida restore qiladi

set -e

if [ -z "$1" ]; then
  echo "❌ Xatolik: Backup fayl nomi ko'rsatilmagan!"
  echo ""
  echo "📖 Foydalanish:"
  echo "  ./manual-restore.sh <backup_fayl_nomi>"
  echo ""
  echo "  Misol:"
  echo "  ./manual-restore.sh aziz_db_backup_20260222_100000.sql.gz"
  echo ""
  echo "🗂️  Mavjud backuplar:"
  ls -lht backups/aziz_db_backup_*.sql.gz 2>/dev/null | head -10 || echo "Backuplar topilmadi"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "backups/${BACKUP_FILE}" ]; then
  echo "❌ Xatolik: Backup fayl topilmadi: backups/${BACKUP_FILE}"
  echo ""
  echo "🗂️  Mavjud  backuplar:"
  ls -lht backups/aziz_db_backup_*.sql.gz 2>/dev/null | head -10 || echo "Backuplar topilmadi"
  exit 1
fi

# Docker container ishlayotganini tekshirish
if ! docker ps | grep -q aziz_database; then
  echo "❌ Xatolik: aziz_database container ishlamayapti!"
  echo ""
  echo "Container ishga tushirish:"
  echo "  docker compose up -d db"
  exit 1
fi

# Backup fayl integrity test
echo "🔍 Backup faylini tekshirish..."
if ! gzip -t "backups/${BACKUP_FILE}" 2>/dev/null; then
  echo "❌ Xatolik: Backup fayli buzilgan yoki noto'g'ri format!"
  exit 1
fi
echo "✅ Backup fayli to'g'ri"

BACKUP_SIZE=$(du -h "backups/${BACKUP_FILE}" | cut -f1)

echo ""
echo "⚠️  DIQQAT: Bu amal bazadagi hamma ma'lumotlarni o'chiradi!"
echo "📁 Restore qilinadigan fayl: ${BACKUP_FILE} (${BACKUP_SIZE})"
echo ""
read -p "Davom etishni xohlaysizmi? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo "❌ Bekor qilindi"
  exit 1
fi

echo "🔄 Restore boshlandi: $(date)"

# Container ichida restore qilish
docker exec -i aziz_database /bin/bash <<EOF
set -e

echo "🔌 Database connectionlarni yopish..."
PGPASSWORD=12345 psql -h localhost -U postgres -d postgres -c \
  "SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE datname = 'aziz_db' AND pid <> pg_backend_pid();" >/dev/null 2>&1

echo "🗑️  Mavjud bazani o'chirish..."
PGPASSWORD=12345 psql -h localhost -U postgres -d postgres -c \
  "DROP DATABASE IF EXISTS aziz_db;" >/dev/null 2>&1

echo "📦 Yangi baza yaratish..."
PGPASSWORD=12345 psql -h localhost -U postgres -d postgres -c \
  "CREATE DATABASE aziz_db;" >/dev/null 2>&1

echo "📥 Ma'lumotlarni tiklash..."
gunzip -c "/backups/${BACKUP_FILE}" | PGPASSWORD=12345 psql \
  -h localhost \
  -U postgres \
  -d aziz_db \
  -q \
  -v ON_ERROR_STOP=1

if [ \$? -ne 0 ]; then
  echo "❌ Restore jarayonida xatolik!"
  exit 1
fi

echo "✅ Restore tugallandi"

# Statistika
echo ""
echo "📊 Statistika:"
TABLE_COUNT=\$(PGPASSWORD=12345 psql -h localhost -U postgres -d aziz_db -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
echo "  • Jadvallar soni: \${TABLE_COUNT}"

USER_COUNT=\$(PGPASSWORD=12345 psql -h localhost -U postgres -d aziz_db -t -c \
  "SELECT COUNT(*) FROM \\\"User\\\";" 2>/dev/null | tr -d ' ' || echo "0")
echo "  • Foydalanuvchilar: \${USER_COUNT}"

DB_SIZE=\$(PGPASSWORD=12345 psql -h localhost -U postgres -d aziz_db -t -c \
  "SELECT pg_size_pretty(pg_database_size('aziz_db'));" | tr -d ' ')
echo "  • Database hajmi: \${DB_SIZE}"
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 Manual restore muvaffaqiyatli tugallandi: $(date)"
  echo ""
  echo "⚠️  ESLATMA: Botni qayta ishga tushirish tavsiya etiladi"
  echo ""
  echo "Bot qayta ishga tushirish:"
  echo "  docker compose restart app"
  echo ""
  echo "Yoki to'liq qayta build:"
  echo "  docker compose down"
  echo "  docker compose up -d"
else
  echo ""
  echo "❌ Restore xatoligi!"
  exit 1
fi
