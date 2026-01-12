#!/bin/bash

# Payment & Premium Integration - Test Script
# This script helps test the payment integration

echo "🎯 Payment & Premium Integration Test Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL=${API_URL:-"http://localhost:3000"}
TELEGRAM_ID=${TELEGRAM_ID:-"123456789"}

echo "📍 API URL: $API_URL"
echo "👤 Test Telegram ID: $TELEGRAM_ID"
echo ""

# Test 1: Health Check
echo "🔍 Test 1: Health Check"
echo "----------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/")
if [ $response -eq 200 ] || [ $response -eq 404 ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not responding (HTTP $response)${NC}"
    exit 1
fi
echo ""

# Test 2: Create Payment
echo "🔍 Test 2: Create Payment"
echo "------------------------"
payment_response=$(curl -s -X POST "$API_URL/payment/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"telegramId\": \"$TELEGRAM_ID\",
    \"amount\": 50000,
    \"duration\": 30
  }")

echo "Response: $payment_response"

payment_id=$(echo $payment_response | grep -o '"paymentId":[0-9]*' | grep -o '[0-9]*')
if [ -n "$payment_id" ]; then
    echo -e "${GREEN}✅ Payment created with ID: $payment_id${NC}"
else
    echo -e "${RED}❌ Failed to create payment${NC}"
    echo "Response: $payment_response"
fi
echo ""

# Test 3: Check Payment Status
if [ -n "$payment_id" ]; then
    echo "🔍 Test 3: Check Payment Status"
    echo "-------------------------------"
    status_response=$(curl -s "$API_URL/payment/status/$payment_id")
    echo "Response: $status_response"
    
    status=$(echo $status_response | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$status" = "PENDING" ]; then
        echo -e "${GREEN}✅ Payment status is PENDING${NC}"
    else
        echo -e "${YELLOW}⚠️ Payment status: $status${NC}"
    fi
    echo ""
fi

# Test 4: Process Payment (Test Webhook)
if [ -n "$payment_id" ]; then
    echo "🔍 Test 4: Process Payment (Simulate Success)"
    echo "---------------------------------------------"
    webhook_response=$(curl -s -X POST "$API_URL/payment/webhook/test" \
      -H "Content-Type: application/json" \
      -d "{
        \"paymentId\": $payment_id,
        \"status\": \"success\"
      }")
    
    echo "Response: $webhook_response"
    
    if echo $webhook_response | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Payment processed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to process payment${NC}"
    fi
    echo ""
fi

# Test 5: Check Premium Status
echo "🔍 Test 5: Check Premium Status"
echo "-------------------------------"
premium_response=$(curl -s "$API_URL/payment/premium-status/$TELEGRAM_ID")
echo "Response: $premium_response"

if echo $premium_response | grep -q '"isPremium":true'; then
    echo -e "${GREEN}✅ User has premium${NC}"
else
    echo -e "${YELLOW}⚠️ User does not have premium${NC}"
fi
echo ""

# Test 6: Get Payment History
echo "🔍 Test 6: Get Payment History"
echo "------------------------------"
history_response=$(curl -s "$API_URL/payment/history/$TELEGRAM_ID")
echo "Response: $history_response"

payment_count=$(echo $history_response | grep -o '"id"' | wc -l)
echo -e "${GREEN}✅ Found $payment_count payment(s)${NC}"
echo ""

# Summary
echo "=========================================="
echo "🎉 Test Summary"
echo "=========================================="
echo "API URL: $API_URL"
echo "Telegram ID: $TELEGRAM_ID"
if [ -n "$payment_id" ]; then
    echo "Payment ID: $payment_id"
fi
echo ""
echo "✅ All tests completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test in Telegram bot: /premium"
echo "2. Test payment creation: /buy_premium"
echo "3. Check bot notifications"
echo "4. Verify premium features work"
echo ""
echo "For more info, see:"
echo "- PAYMENT_QUICKSTART.md"
echo "- PAYMENT_INTEGRATION.md"
echo ""
