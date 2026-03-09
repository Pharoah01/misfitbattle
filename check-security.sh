#!/bin/bash
# ============================================
# Security Check Script - Pre-Push Verification
# ============================================

echo "🔒 Misfits-Battle Security Check"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: .env files
echo "1️⃣  Checking for .env files..."
if git ls-files | grep -E "\.env$|\.env\.local|\.env\.production" > /dev/null; then
    echo -e "${RED}❌ CRITICAL: .env files found in Git!${NC}"
    git ls-files | grep -E "\.env$|\.env\."
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No .env files in Git${NC}"
fi
echo ""

# Check 2: Database files
echo "2️⃣  Checking for database files..."
if git ls-files | grep -E "db\.sqlite3|\.db$" > /dev/null; then
    echo -e "${RED}❌ CRITICAL: Database files found in Git!${NC}"
    git ls-files | grep -E "db\.sqlite3|\.db$"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No database files in Git${NC}"
fi
echo ""

# Check 3: SSH keys
echo "3️⃣  Checking for SSH/private keys..."
if git ls-files | grep -E "\.pem$|\.key$|\.p12$|\.pfx$" > /dev/null; then
    echo -e "${RED}❌ CRITICAL: Private keys found in Git!${NC}"
    git ls-files | grep -E "\.pem$|\.key$"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No private keys in Git${NC}"
fi
echo ""

# Check 4: Secrets in staged files
echo "4️⃣  Checking staged files for secrets..."
if git diff --cached | grep -i -E "password|secret_key|api_key|token.*=.*['\"]" > /dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Possible secrets in staged changes!${NC}"
    echo "Review these lines:"
    git diff --cached | grep -i -E "password|secret_key|api_key|token.*=.*['\"]" | head -5
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No obvious secrets in staged files${NC}"
fi
echo ""

# Check 5: .gitignore exists
echo "5️⃣  Checking .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore && grep -q "db\.sqlite3" .gitignore; then
        echo -e "${GREEN}✅ .gitignore properly configured${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: .gitignore may be incomplete${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ CRITICAL: .gitignore not found!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 6: Example files exist
echo "6️⃣  Checking for .env.example files..."
if [ -f "backend/.env.example" ] && [ -f "frontend/.env.example" ]; then
    echo -e "${GREEN}✅ .env.example files exist${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: .env.example files missing${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 7: Files to be committed
echo "7️⃣  Files staged for commit:"
if git diff --cached --name-only | wc -l | grep -q "^0$"; then
    echo -e "${YELLOW}⚠️  No files staged${NC}"
else
    git diff --cached --name-only
fi
echo ""

# Summary
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo -e "Errors: ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ CRITICAL ISSUES FOUND - DO NOT PUSH!${NC}"
    echo "Fix the errors above before pushing to GitHub."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS FOUND - Review before pushing${NC}"
    echo "Review the warnings above."
    exit 0
else
    echo -e "${GREEN}✅ All checks passed - Safe to push!${NC}"
    exit 0
fi
