#!/bin/bash

# Backend API Test Script
# Tests the backend API endpoints directly

API_BASE="https://api.binarymisfits.info"

echo "🔍 Testing Backend API at $API_BASE"
echo "=================================================="

# Test 1: Health check (challenges endpoint without auth)
echo "1. Testing Challenges API (no auth required)..."
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$API_BASE/api/challenges/")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_status" = "200" ]; then
    echo "✅ Challenges API: SUCCESS (Status: $http_status)"
    echo "📊 Response length: $(echo "$body" | wc -c) characters"
else
    echo "❌ Challenges API: FAILED (Status: $http_status)"
    echo "📄 Response: $body"
fi

echo ""

# Test 2: Test login endpoint
echo "2. Testing Login API structure..."
response=$(curl -s -w "HTTP_STATUS:%{http_code}" -X POST "$API_BASE/api/auth/signin/" \
    -H "Content-Type: application/json" \
    -d '{"register_number":"test","password":"test"}')
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_status" = "400" ] || [ "$http_status" = "401" ]; then
    echo "✅ Login API: ACCESSIBLE (Status: $http_status - expected for invalid credentials)"
else
    echo "⚠️  Login API: Status $http_status"
fi
echo "📄 Response: $body"

echo ""

# Test 3: Test CORS headers
echo "3. Testing CORS headers..."
cors_headers=$(curl -s -I -X OPTIONS "$API_BASE/api/challenges/" | grep -i "access-control")
if [ -n "$cors_headers" ]; then
    echo "✅ CORS headers present:"
    echo "$cors_headers"
else
    echo "⚠️  No CORS headers found"
fi

echo ""

# Test 4: Test SSL certificate
echo "4. Testing SSL certificate..."
ssl_info=$(curl -s -I "$API_BASE/api/challenges/" | head -1)
echo "📋 SSL Response: $ssl_info"

echo ""
echo "=================================================="
echo "🏁 Backend API test complete!"
echo ""
echo "💡 If you have a valid token, test authenticated endpoints:"
echo "   curl -H \"Authorization: Token YOUR_TOKEN\" $API_BASE/api/auth/me/"