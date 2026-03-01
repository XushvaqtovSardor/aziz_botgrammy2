#!/bin/bash

# Buzilgan backuplarni tozalash va yangi backup yaratish scripti

set -e

echo "🧹 Buzilgan Backuplarni Tozalash va Yangi Backup Yaratish"
echo "=========================================================="
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
NC='\033[0m'

# Docker container tekshirish
if ! docker ps | grep -q kino_database; then
  echo -e "${RED}❌ kino_database container ishlamayapti!${NC}"
  echo ""
  echo "Container ishga tushirish:"
  echo "  docker compose up -d db"
  exit 1
fi

echo "📊 Hozirgi holatni tekshirish..."
echo ""

# Backuplar soni
BACKUP_COUNT=$(ls backups/kino_db_backup_*.sql.gz 2>/dev/null | wc -l)
echo "📦 Mavjud backuplar: ${BACKUP_COUNT} ta"

if [ "$BACKUP_COUNT" -gt 0 ]; then
  TOTAL_SIZE=$(du -sh backups/ 2>/dev/null | cut -f1)
  echo "💾 Jami hajm: ${TOTAL_SIZE}"
  echo ""
  
  echo -e "${YELLOW}⚠️  Barcha eski backuplar o'chiriladi!${NC}"
  echo ""
  echo "So'nggi backuplar:"
  ls -lht backups/kino_db_backup_*.sql.gz | head -5
  echo ""
  
  read -p "Barcha eski backuplarni o'chirish va yangi backup yaratish? (yes/no): " -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Bekor qilindi"
    exit 0
  fi
  
  echo "🗑️  Eski backuplarni o'chirish..."
  rm -f backups/kino_db_backup_*.sql.gz
  echo -e "${GREEN}✅ O'chirildi${NC}"
  echo ""
fi

echo "🔧 Database holatini tekshirish..."
echo ""

# Database connectionni tekshirish
if ! docker exec kino_database pg_isready -U postgres >/dev/null 2>&1; then
  echo -e "${RED}❌ Database ulanishi xato!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Database ishlayapti${NC}"
echo ""

# Database jadvallarini tekshirish
TABLE_COUNT=$(docker exec kino_database psql -U postgres -d kino_db -t -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo "0")

echo "📊 Hozirgi jadvallar soni: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Database bo'sh! Prisma migrationsni ishga tushirish tavsiya etiladi.${NC}"
  echo ""
  echo "Prisma migrations:"
  echo "  docker compose exec app npx prisma migrate deploy"
  echo ""
  read -p "Prisma migrationsni avtomatik ishga tushirish? (yes/no): " -r
  echo
  
  if [[ $REPLY =~ ^[Yy]es$ ]]; then
    echo "🔄 Prisma migrationsni ishga tushirish..."
    docker compose exec app npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Migrations muvaffaqiyatli${NC}"
    else
      echo -e "${RED}❌ Migrations xatosi${NC}"
      echo ""
      echo "Bot containerini qayta ishga tushiring:"
      echo "  docker compose restart app"
      exit 1
    fi
  else
    echo ""
    echo -e "${YELLOW}ℹ️  Migrations o'tkazilmadi. Backup yaratishdan oldin database to'ldiring.${NC}"
  fi
fi

echo ""
echo "📦 Yangi backup yaratish..."
echo ""

# Yangi backup yaratish
if [ -f "./scripts/manual-backup.sh" ]; then
  ./scripts/manual-backup.sh
  
  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Muvaffaqiyat!${NC}"
    echo ""
    echo "📋 Yangi backup:"
    ls -lht backups/kino_db_backup_*.sql.gz | head -1
    echo ""
    
    # Backup integrity test
    LATEST_BACKUP=$(ls -t backups/kino_db_backup_*.sql.gz | head -1)
    echo "🔍 Backup integrity test..."
    if gzip -t "$LATEST_BACKUP" 2>/dev/null; then
      echo -e "${GREEN}✅ Backup fayli to'g'ri${NC}"
      
      # Backup ichidagi contentni tekshirish
      echo ""
      echo "🔍 Backup tarkibini tekshirish..."
      CONTENT_TEST=$(gunzip -c "$LATEST_BACKUP" | head -n 20)
      
      if echo "$CONTENT_TEST" | grep -q "PostgreSQL database dump"; then
        if echo "$CONTENT_TEST" | grep -q "pg_dump: last built-in OID" || \
           echo "$CONTENT_TEST" | grep -q "pg_dump: creating"; then
          echo -e "${RED}❌ XATOLIK: Backup faylida hali ham verbose output bor!${NC}"
          echo ""
          echo "Scripts yangilanmagan. Quyidagi komandani bajaring:"
          echo "  git pull"
          echo "  ./scripts/fix-backups.sh"
        else
          echo -e "${GREEN}✅ Backup tarkibi to'g'ri (faqat SQL)${NC}"
          echo ""
          echo -e "${GREEN}🎉 Backup tizimi to'liq ishlayapti!${NC}"
        fi
      else
        echo -e "${RED}❌ Backup formati noto'g'ri!${NC}"
      fi
    else
      echo -e "${RED}❌ Backup fayli buzilgan!${NC}"
    fi
  else
    echo -e "${RED}❌ Backup yaratishda xatolik!${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ manual-backup.sh topilmadi!${NC}"
  exit 1
fi

echo ""
echo "=========================================================="
echo -e "${GREEN}✅ Tayyor!${NC}"
echo ""
echo "📝 Keyingi qadamlar:"
echo "  1. Yangi backupni test qilish (ixtiyoriy)"
echo "  2. Bot ishlayotganini tekshirish"
echo "  3. Production serverga deploy qilish"
echo ""
