#!/bin/bash

# PostgreSQL Backup Script
# Ma'lumotlar bazasini zaxiralab, 180 kun davomida saqlab qoladi
# Bu script barcha jadvallar va Prisma migration tarixini to'liq saqlaydi

set -e

# Konfiguratsiya
BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-180}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="aziz_db_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Backup papkasini yaratish
mkdir -p "${BACKUP_DIR}"

echo "🔄 Backup boshlandi: $(date)"
echo "📁 Fayl: ${BACKUP_FILE}"

# PostgreSQL dump (SQL formatda va siqilgan holda)
# --clean: restore paytida eski obyektlarni avval o'chirish
# --if-exists: agar obyekt mavjud bo'lsa, xatolik bermaslik  
# MUHIM: verbose output stderr ga boradi, uni /dev/null ga yo'naltiramiz
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --verbose \
  2>/dev/null | gzip -9 > "${BACKUP_PATH}"

# Backup fayli hajmini tekshirish
if [ ! -f "${BACKUP_PATH}" ]; then
  echo "❌ Xatolik: Backup fayli yaratilmadi!"
  exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
FILE_SIZE_BYTES=$(stat -f%z "${BACKUP_PATH}" 2>/dev/null || stat -c%s "${BACKUP_PATH}" 2>/dev/null || echo "0")

# Backup fayli minimal hajmda ekanligini tekshirish (kamida 1KB)
if [ "$FILE_SIZE_BYTES" -lt 1024 ]; then
  echo "❌ Xatolik: Backup fayli juda kichik ($BACKUP_SIZE)! Ehtimol backup muvaffaqiyatsiz."
  exit 1
fi

echo "✅ Backup yaratildi: ${BACKUP_SIZE}"

# Backup integrity test
echo "🔍 Backup faylini tekshirish..."
if gzip -t "${BACKUP_PATH}" 2>/dev/null; then
  echo "✅ Backup fayli to'g'ri"
else
  echo "❌ Xatolik: Backup fayli buzilgan!"
  rm -f "${BACKUP_PATH}"
  exit 1
fi

# Eski backuplarni o'chirish (RETENTION_DAYS kundan eski)
echo "Eski backuplarni tozalash..."
if command -v find >/dev/null 2>&1; then
  # Avval sanab olamiz
  OLD_COUNT=$(find "${BACKUP_DIR}" -name "kino_db_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" 2>/dev/null | wc -l)
  if [ "$OLD_COUNT" -gt 0 ]; then
    # Keyin o'chiramiz (-exec rm ishlatamiz, -delete o'rniga)
    find "${BACKUP_DIR}" -name "kino_db_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \; 2>/dev/null || true
    echo "Ochirildi: ${OLD_COUNT} ta eski backup"
  fi
fi

# Mavjud backuplar sonini ko'rsatish
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "kino_db_backup_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "📊 Jami backuplar: ${BACKUP_COUNT} (${TOTAL_SIZE})"

# Eng so'nggi 5 ta backupni ko'rsatish
echo "📋 So'nggi backuplar:"
ls -lht "${BACKUP_DIR}"/kino_db_backup_*.sql.gz 2>/dev/null | head -5 || echo "Boshqa backuplar yo'q"

echo "🎉 Backup tugallandi: $(date)"
