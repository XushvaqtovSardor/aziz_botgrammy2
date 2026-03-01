#!/bin/bash

# Backup Sistemasini Test Qilish Scripti

set -e

echo "🧪 Backup tizimini test qilish boshlandi"
echo "========================================"
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

function test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAILED${NC}: $2"
    ((TESTS_FAILED++))
  fi
  echo ""
}

# Test 1: Docker containers ishlayaptimi?
echo "Test 1: Docker containerlarni tekshirish..."
if docker ps | grep -q aziz_database; then
  test_result 0 "Database container ishlayapti"
else
  test_result 1 "Database container ishlamayapti!"
  echo "Fix: docker compose up -d db"
  exit 1
fi

# Test 2: Backup papkasi mavjudmi?
echo "Test 2: Backup papkasini tekshirish..."
if [ -d "backups" ]; then
  test_result 0 "Backup papkasi mavjud"
else
  mkdir -p backups
  test_result 0 "Backup papkasi yaratildi"
fi

# Test 3: Database ulanishi
echo "Test 3: Database ulanishini tekshirish..."
if docker exec aziz_database pg_isready -U postgres >/dev/null 2>&1; then
  test_result 0 "Database ulanishi ishlayapti"
else
  test_result 1 "Database ulanishi xato!"
  exit 1
fi

# Test 4: Backup yaratish
echo "Test 4: Test backup yaratish..."
TEST_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_BACKUP="test_backup_${TEST_TIMESTAMP}.sql.gz"

docker exec aziz_database bash -c "
  PGPASSWORD=12345 pg_dump \
    -h localhost \
    -U postgres \
    -d aziz_db \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    2>&1 | gzip -9 > /backups/${TEST_BACKUP}
" >/dev/null 2>&1

if [ -f "backups/${TEST_BACKUP}" ]; then
  BACKUP_SIZE=$(du -h "backups/${TEST_BACKUP}" | cut -f1)
  test_result 0 "Test backup yaratildi (${BACKUP_SIZE})"
else
  test_result 1 "Test backup yaratilmadi!"
  exit 1
fi

# Test 5: Backup integrity
echo "Test 5: Backup fayl integrity test..."
if gzip -t "backups/${TEST_BACKUP}" 2>/dev/null; then
  test_result 0 "Backup fayli to'g'ri (integrity OK)"
else
  test_result 1 "Backup fayli buzilgan!"
  exit 1
fi

# Test 6: Backup hajmi
echo "Test 6: Backup hajmini tekshirish..."
FILE_SIZE=$(stat -f%z "backups/${TEST_BACKUP}" 2>/dev/null || stat -c%s "backups/${TEST_BACKUP}" 2>/dev/null || echo "0")
if [ "$FILE_SIZE" -gt 1024 ]; then
  test_result 0 "Backup hajmi yetarli ($(du -h "backups/${TEST_BACKUP}" | cut -f1))"
else
  test_result 1 "Backup hajmi juda kichik!"
  exit 1
fi

# Test 7: Backup ichida ma'lumotlar bormi?
echo "Test 7: Backup tarkibini tekshirish..."
BACKUP_CONTENT=$(gunzip -c "backups/${TEST_BACKUP}" | head -n 50)
if echo "$BACKUP_CONTENT" | grep -q "PostgreSQL database dump"; then
  test_result 0 "Backup fayl to'g'ri formatlangan"
else
  test_result 1 "Backup fayl formati noto'g'ri!"
  exit 1
fi

# Test 8: Database jadvallarini tekshirish
echo "Test 8: Database jadvallarini tekshirish..."
TABLE_COUNT=$(docker exec aziz_database psql -U postgres -d aziz_db -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
  test_result 0 "Database'da ${TABLE_COUNT} ta jadval mavjud"
else
  test_result 1 "Database'da jadvallar topilmadi!"
fi

# Test 9: Manual backup scripti
echo "Test 9: Manual backup scriptini tekshirish..."
if [ -x "scripts/manual-backup.sh" ]; then
  test_result 0 "manual-backup.sh executable"
elif [ -f "scripts/manual-backup.sh" ]; then
  chmod +x scripts/manual-backup.sh
  test_result 0 "manual-backup.sh executable qilindi"
else
  test_result 1 "manual-backup.sh topilmadi!"
fi

# Test 10: Manual restore scripti
echo "Test 10: Manual restore scriptini tekshirish..."
if [ -x "scripts/manual-restore.sh" ]; then
  test_result 0 "manual-restore.sh executable"
elif [ -f "scripts/manual-restore.sh" ]; then
  chmod +x scripts/manual-restore.sh
  test_result 0 "manual-restore.sh executable qilindi"
else
  test_result 1 "manual-restore.sh topilmadi!"
fi

# Testni tozalash
echo "🧹 Test backupni tozalash..."
rm -f "backups/${TEST_BACKUP}"
echo "✅ Tozalandi"
echo ""

# Natijalar
echo "========================================"
echo "📊 TEST NATIJALARI"
echo "========================================"
echo -e "${GREEN}✅ Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}❌ Failed: ${TESTS_FAILED}${NC}"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}🎉 BARCHA TESTLAR O'TDI!${NC}"
  echo ""
  echo "✅ Backup tizimi to'liq ishlayapti"
  echo ""
  echo "📝 Keyingi qadamlar:"
  echo "  1. Backup yaratish: ./scripts/manual-backup.sh"
  echo "  2. Restore qilish: ./scripts/manual-restore.sh <backup_file>"
  echo "  3. To'liq qo'llanma: cat BACKUP_QOLLANMA.md"
  echo ""
else
  echo ""
  echo -e "${RED}⚠️  BA'ZI TESTLAR XATOLIK BERDI!${NC}"
  echo ""
  echo "Xatolarni yuqoridagi natijalardan ko'ring."
  exit 1
fi
