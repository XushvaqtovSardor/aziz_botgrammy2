#!/bin/bash

# PostgreSQL Restore Script
# Backup faylidan ma'lumotlar bazasini tiklaydi

set -e

BACKUP_DIR="/backups"

# Parametrlarni tekshirish
if [ -z "$1" ]; then
  echo "❌ Xatolik: Backup fayl nomi ko'rsatilmagan!"
  echo ""
  echo "📖 Foydalanish:"
  echo "  ./restore.sh <backup_fayl_nomi>"
  echo ""
  echo "🗂️  Mavjud backuplar:"
  ls -lht "${BACKUP_DIR}"/aziz_db_backup_*.sql.gz 2>/dev/null | head -10 || echo "Backuplar topilmadi"
  exit 1
fi

BACKUP_FILE="$1"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Fayl mavjudligini tekshirish
if [ ! -f "${BACKUP_PATH}" ]; then
  echo "❌ Xatolik: Backup fayl topilmadi: ${BACKUP_PATH}"
  echo ""
  echo "🗂️  Mavjud backuplar:"
  ls -lht "${BACKUP_DIR}"/aziz_db_backup_*.sql.gz 2>/dev/null | head -10 || echo "Backuplar topilmadi"
  exit 1
fi

# Backup fayl integrity test
echo "🔍 Backup faylini tekshirish..."
if ! gzip -t "${BACKUP_PATH}" 2>/dev/null; then
  echo "❌ Xatolik: Backup fayli buzilgan yoki noto'g'ri format!"
  exit 1
fi
echo "✅ Backup fayli to'g'ri"

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)

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

# Barcha connectionlarni yopish
echo "🔌 Database connectionlarni yopish..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d postgres <<-EOSQL
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();
EOSQL

# Bazani tozalash va qayta yaratish
echo "🗑️  Mavjud bazani o'chirish..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d postgres -c \
  "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

echo "📦 Yangi baza yaratish..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d postgres -c \
  "CREATE DATABASE ${POSTGRES_DB};"

# Backupdan ma'lumotlarni tiklash
echo "📥 Ma'lumotlarni tiklash..."
gunzip -c "${BACKUP_PATH}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${PGHOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -q \
  -v ON_ERROR_STOP=1

if [ $? -ne 0 ]; then
  echo "❌ Restore jarayonida xatolik!"
  exit 1
fi

echo "✅ Restore tugallandi: $(date)"

# Statistika
echo ""
echo "📊 Statistika:"
TABLE_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
echo "  • Jadvallar soni: ${TABLE_COUNT}"

USER_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c \
  "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ' || echo "0")
echo "  • Foydalanuvchilar: ${USER_COUNT}"

DB_SIZE=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c \
  "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB}'));" | tr -d ' ')
echo "  • Database hajmi: ${DB_SIZE}"

echo ""
echo "🎉 Muvaffaqiyatli tiklandi!"
echo ""
echo "⚠️  ESLATMA: Bot qayta ishga tushirilganda Prisma migratsiyalari avtomatik tekshiriladi."
