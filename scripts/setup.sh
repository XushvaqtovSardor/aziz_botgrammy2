#!/bin/bash

# Quick Setup Script - Backup tizimini ishga tushirish

echo "🚀 Backup tizimini sozlamoqda..."

# 1. Backups papkasini yaratish
mkdir -p backups
echo "✅ Backups papkasi yaratildi"

# 2. Scriptlarga executable permission berish
chmod +x scripts/*.sh
echo "✅ Scriptlarga permission berildi"

# 3. Docker containerlarni rebuild qilish
echo "🔄 Docker containerlarni qayta ishga tushirish..."
docker compose down
docker compose up -d --build

echo ""
echo "✅ Backup tizimi muvaffaqiyatli sozlandi!"
echo ""
echo "📋 Keyingi qadamlar:"
echo "  1. Containerlar loglarini kuzatish: docker compose logs -f backup"
echo "  2. Manual backup: ./scripts/manual-backup.sh"
echo "  3. Backuplarni ko'rish: ls -lh backups/"
echo ""
echo "📖 To'liq qo'llanma: scripts/README.md"
