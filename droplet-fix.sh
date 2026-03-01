#!/bin/bash

# DROPLETDA TEZKOR TUZATISH SCRIPTI
# Bu scriptni Dropletda ishga tushiring

set -e

echo "🔧 Backup Scriptlarni Tuzatish"
echo "==============================="
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "1️⃣  Git pull..."
git pull origin main

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Git pull xatosi!${NC}"
  echo ""
  echo "Manual pull qilish:"
  echo "  git fetch origin"
  echo "  git reset --hard origin/main"
  exit 1
fi

echo -e "${GREEN}✅ Kod yangilandi${NC}"
echo ""

echo "2️⃣  Scriptlarga permission berish..."
chmod +x scripts/*.sh

echo -e "${GREEN}✅ Permissions berildi${NC}"
echo ""

echo "3️⃣  Eski backuplarni o'chirish..."
BACKUP_COUNT=$(ls backups/aziz_db_backup_*.sql.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Eski backuplar topildi: ${BACKUP_COUNT} ta${NC}"
  echo ""
  read -p "Eski (buzilgan) backuplarni o'chirish? (yes/no): " -r
  echo
  
  if [[ $REPLY =~ ^[Yy]es$ ]]; then
    rm -f backups/aziz_db_backup_*.sql.gz
    echo -e "${GREEN}✅ Eski backuplar o'chirildi${NC}"
  else
    echo -e "${YELLOW}ℹ️  Backuplar saqlanib qoldi${NC}"
  fi
else
  echo -e "${GREEN}✅ Backuplar papkasi bo'sh${NC}"
fi

echo ""

echo "4️⃣  Yangi backup yaratish..."
./scripts/manual-backup.sh

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Backup muvaffaqiyatli yaratildi!${NC}"
  echo ""
  
  # Verify backup
  LATEST_BACKUP=$(ls -t backups/aziz_db_backup_*.sql.gz 2>/dev/null | head -1)
  
  if [ -n "$LATEST_BACKUP" ]; then
    echo "📦 Yangi backup:"
    ls -lh "$LATEST_BACKUP"
    echo ""
    
    echo "🔍 Integrity test..."
    if gzip -t "$LATEST_BACKUP" 2>/dev/null; then
      echo -e "${GREEN}✅ Backup fayli to'g'ri${NC}"
      
      echo ""
      echo "🔍 Tarkibini tekshirish..."
      FIRST_LINES=$(gunzip -c "$LATEST_BACKUP" 2>/dev/null | head -n 20)
      
      if echo "$FIRST_LINES" | grep -q "PostgreSQL database dump"; then
        if echo "$FIRST_LINES" | grep -q "pg_dump: last built-in OID" || \
           echo "$FIRST_LINES" | grep -q "pg_dump: creating"; then
          echo -e "${RED}❌ XATO: Backup hali ham buzilgan!${NC}"
          echo ""
          echo "Muammo: Verbose output SQL ichida."
          echo "Yechim: scripts/backup.sh va scripts/manual-backup.sh fayllarini manual tuzating:"
          echo "  '2>&1' ni '2>/dev/null' ga o'zgartiring"
        else
          echo -e "${GREEN}✅ Backup tarkibi to'g'ri!${NC}"
          echo ""
          echo -e "${GREEN}🎉 BACKUP TIZIMI ISHLAYAPTI!${NC}"
        fi
      else
        echo -e "${RED}❌ Backup formati noto'g'ri${NC}"
      fi
    else
      echo -e "${RED}❌ Backup fayli buzilgan${NC}"
    fi
  fi
else
  echo -e "${RED}❌ Backup yaratishda xatolik!${NC}"
  exit 1
fi

echo ""
echo "==============================="
echo -e "${GREEN}✅ TAYYOR!${NC}"
echo ""
echo "📝 Keyingi qadamlar:"
echo "  1. Test restore (ixtiyoriy)"
echo "  2. Bot loglarini tekshirish: docker compose logs -f app"
echo "  3. Avtomatik backup ishlayotganini kuzatish"
echo ""
