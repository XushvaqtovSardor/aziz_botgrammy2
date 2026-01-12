@echo off
REM Windows uchun Docker test scripti
REM Bu script Docker Desktop bilan ishlaydi

echo ================================
echo Docker Desktop Test - Aziz Bot
echo ================================
echo.

REM Docker ishlayaptimi tekshirish
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker topilmadi!
    echo Iltimos Docker Desktop ni o'rnating va ishga tushiring
    pause
    exit /b 1
)

echo [OK] Docker topildi
echo.

REM Docker Desktop ishlab turiptimi?
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop ishlamayapti!
    echo Iltimos Docker Desktop ni ishga tushiring
    pause
    exit /b 1
)

echo [OK] Docker Desktop ishlab turipti
echo.

REM .env faylini tekshirish
if not exist .env (
    echo WARNING: .env fayl topilmadi
    echo .env.example dan .env yaratilmoqda...
    copy .env.example .env
    echo.
    echo DIQQAT: .env faylni to'ldiring:
    echo   - BOT_TOKEN
    echo   - DATABASE_URL
    echo.
    notepad .env
)

echo [OK] .env fayl mavjud
echo.

REM Containerlarni to'xtatish
echo Eski containerlarni to'xtatish...
docker-compose down 2>nul

REM Build qilish
echo.
echo Docker image build qilinmoqda...
echo Bu 2-5 daqiqa davom etishi mumkin...
echo.
docker-compose build --no-cache

if errorlevel 1 (
    echo.
    echo ERROR: Build muvaffaqiyatsiz!
    pause
    exit /b 1
)

echo.
echo [OK] Build muvaffaqiyatli
echo.

REM Start qilish
echo Containerlarni ishga tushirish...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ERROR: Start muvaffaqiyatsiz!
    pause
    exit /b 1
)

echo.
echo [OK] Containerlar ishga tushdi
echo.

REM Status
echo Container holati:
docker-compose ps
echo.

REM Loglar
echo Loglarni ko'rish uchun:
echo   docker-compose logs -f
echo.

REM Web panel
echo Web panel:
echo   http://localhost:3000/admin/
echo.

REM Health check
echo Health check:
timeout /t 5 /nobreak >nul
curl http://localhost:3000/health 2>nul
if errorlevel 1 (
    echo WARNING: Health check muvaffaqiyatsiz
    echo Bot ishga tushishini kutish kerak (30 sekund)
) else (
    echo [OK] Bot ishlab turipti!
)

echo.
echo ================================
echo Test tugadi!
echo ================================
echo.
echo Foydali komandalar:
echo   docker-compose logs -f        - Loglarni ko'rish
echo   docker-compose restart        - Qayta ishga tushirish
echo   docker-compose down           - To'xtatish
echo   docker-compose ps             - Status
echo.

pause
