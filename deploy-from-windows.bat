@echo off
REM Windows batch file to deploy to production server

echo ================================================
echo Deploying to Production Server
echo ================================================
echo.

REM Set your server details
set SERVER_USER=root
set SERVER_IP=YOUR_SERVER_IP_HERE
set REMOTE_PATH=/root/aziz_botgrammy2

echo Step 1: Uploading .env.production file...
scp .env.production %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%/.env.production
if %errorlevel% neq 0 (
    echo Error uploading .env.production file
    pause
    exit /b 1
)

echo.
echo Step 2: Connecting to server and deploying...
ssh %SERVER_USER%@%SERVER_IP% "cd %REMOTE_PATH% && chmod +x deploy-production.sh && ./deploy-production.sh"

echo.
echo ================================================
echo Deployment completed!
echo ================================================
echo.
pause
