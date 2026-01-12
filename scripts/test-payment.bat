@echo off
REM Payment & Premium Integration - Test Script (Windows)
REM This script helps test the payment integration

echo ========================================
echo Payment ^& Premium Integration Test
echo ========================================
echo.

set API_URL=http://localhost:3000
set TELEGRAM_ID=123456789

echo API URL: %API_URL%
echo Test Telegram ID: %TELEGRAM_ID%
echo.

REM Test 1: Create Payment
echo [Test 1] Creating Payment...
echo ----------------------------
curl -X POST "%API_URL%/payment/create" ^
  -H "Content-Type: application/json" ^
  -d "{\"telegramId\": \"%TELEGRAM_ID%\", \"amount\": 50000, \"duration\": 30}"
echo.
echo.

REM Test 2: Process Payment
echo [Test 2] Processing Payment (ID: 1)...
echo --------------------------------------
curl -X POST "%API_URL%/payment/webhook/test" ^
  -H "Content-Type: application/json" ^
  -d "{\"paymentId\": 1, \"status\": \"success\"}"
echo.
echo.

REM Test 3: Check Premium Status
echo [Test 3] Checking Premium Status...
echo -----------------------------------
curl "%API_URL%/payment/premium-status/%TELEGRAM_ID%"
echo.
echo.

REM Test 4: Get Payment History
echo [Test 4] Getting Payment History...
echo -----------------------------------
curl "%API_URL%/payment/history/%TELEGRAM_ID%"
echo.
echo.

REM Test 5: Check Payment Status
echo [Test 5] Checking Payment Status...
echo -----------------------------------
curl "%API_URL%/payment/status/1"
echo.
echo.

echo ========================================
echo Tests Completed!
echo ========================================
echo.
echo Next steps:
echo 1. Open Telegram and send /premium to your bot
echo 2. Try /buy_premium command
echo 3. Check bot notifications
echo.
echo For detailed docs, see:
echo - PAYMENT_QUICKSTART.md
echo - PAYMENT_INTEGRATION.md
echo.
pause
