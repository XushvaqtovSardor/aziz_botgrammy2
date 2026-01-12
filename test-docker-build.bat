@echo off
REM Local Docker build test script for Windows

echo ============================================
echo Testing Docker Build Locally
echo ============================================
echo.

REM Check if .env.production exists
if not exist .env.production (
    echo Warning: .env.production not found
    echo Creating from example...
    copy .env.production.example .env.production
    echo Please edit .env.production with your values!
    echo.
    pause
)

echo Step 1: Cleaning old containers and images...
docker compose down -v
docker rmi aziz_bot_grammy-app 2>nul

echo.
echo Step 2: Building Docker image...
docker compose build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo Step 3: Starting services...
docker compose up -d

echo.
echo Step 4: Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo Step 5: Checking status...
docker compose ps

echo.
echo Step 6: Viewing recent logs...
docker compose logs --tail=50 app

echo.
echo ============================================
echo ✅ Test completed!
echo ============================================
echo.
echo Next steps:
echo   • View logs:     docker compose logs -f app
echo   • Health check:  curl http://localhost:3000/health
echo   • Stop all:      docker compose down
echo.
pause
