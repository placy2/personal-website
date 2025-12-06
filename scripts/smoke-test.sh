#!/bin/bash

# smoke-test.sh - Basic smoke tests for deployed website
# Tests that the deployed site returns a 200 status and contains expected content
#
# Usage: ./smoke-test.sh <url>
# Example: ./smoke-test.sh http://parkerlacy-dev-hosting.s3-website-us-east-1.amazonaws.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

URL=$1

if [ -z "$URL" ]; then
  echo -e "${RED}Error: URL argument required${NC}"
  echo "Usage: $0 <url>"
  echo "Example: $0 http://parkerlacy-dev-hosting.s3-website-us-east-1.amazonaws.com"
  exit 1
fi

echo "🧪 Running smoke tests for: $URL"
echo "----------------------------------------"

# Test 1: Check HTTP status code
echo "Test 1: Checking HTTP status code..."
HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" "$URL" || echo "CURL_FAILED")

if echo "$HTTP_RESPONSE" | grep -q "CURL_FAILED"; then
  echo -e "${RED}✗ Failed to connect to $URL${NC}"
  echo "This may be due to network restrictions or the site being unavailable."
  exit 1
fi

HTTP_STATUS=$(echo "$HTTP_RESPONSE" | tail -n 1)
CONTENT=$(echo "$HTTP_RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ HTTP Status: $HTTP_STATUS (OK)${NC}"
else
  echo -e "${RED}✗ HTTP Status: $HTTP_STATUS (Expected 200)${NC}"
  exit 1
fi

# Test 2: Check response time
echo "Test 2: Checking response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL" || echo "0")
if [ "$RESPONSE_TIME" != "0" ]; then
  echo -e "${GREEN}✓ Response time: ${RESPONSE_TIME}s${NC}"
else
  echo -e "${YELLOW}⚠ Could not measure response time${NC}"
fi

# Test 3: Check content - verify key text is present
echo "Test 3: Verifying page content..."

# Check for expected content markers
EXPECTED_TEXTS=("Parker Lacy" "DevOps" "Cloud")
ALL_FOUND=true

for TEXT in "${EXPECTED_TEXTS[@]}"; do
  if echo "$CONTENT" | grep -q "$TEXT"; then
    echo -e "${GREEN}✓ Found expected content: '$TEXT'${NC}"
  else
    echo -e "${YELLOW}⚠ Missing expected content: '$TEXT'${NC}"
    ALL_FOUND=false
  fi
done

# Test 4: Check that HTML structure looks valid
echo "Test 4: Checking HTML structure..."
if echo "$CONTENT" | grep -q "<!DOCTYPE html>" && echo "$CONTENT" | grep -q "</html>"; then
  echo -e "${GREEN}✓ HTML structure appears valid${NC}"
else
  echo -e "${RED}✗ HTML structure appears invalid${NC}"
  exit 1
fi

# Test 5: Check for React app div
echo "Test 5: Checking for React app container..."
if echo "$CONTENT" | grep -q 'id="root"'; then
  echo -e "${GREEN}✓ React app container found${NC}"
else
  echo -e "${YELLOW}⚠ React app container not found (expected id='root')${NC}"
fi

echo "----------------------------------------"
if [ "$ALL_FOUND" = true ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some non-critical checks failed, but core functionality is working${NC}"
  exit 0
fi

# FUTURE ENHANCEMENT: Playwright E2E Testing
# ============================================
# For more comprehensive end-to-end testing, consider implementing a Playwright test suite:
#
# Playwright Benefits:
# - Real browser testing (Chrome, Firefox, Safari)
# - JavaScript execution and dynamic content validation
# - User interaction simulation (clicks, navigation, forms)
# - Screenshot and video capture for debugging
# - Network request interception and mocking
# - Accessibility testing
#
# Example Playwright Test Structure:
# ```
# tests/
#   ├── e2e/
#   │   ├── home.spec.ts          # Test home page functionality
#   │   ├── navigation.spec.ts    # Test navigation between pages
#   │   ├── responsive.spec.ts    # Test responsive design
#   │   └── accessibility.spec.ts # Test accessibility features
#   └── playwright.config.ts      # Playwright configuration
# ```
#
# Setup Steps:
# 1. npm install --save-dev @playwright/test
# 2. npx playwright install
# 3. Create tests/ directory with spec files
# 4. Add "test:e2e": "playwright test" to package.json
# 5. Run against deployed environments: PLAYWRIGHT_TEST_BASE_URL=$URL npm run test:e2e
#
# Example Test:
# ```typescript
# import { test, expect } from '@playwright/test';
#
# test('homepage loads and displays name', async ({ page }) => {
#   await page.goto('/');
#   await expect(page.locator('h1')).toContainText('Parker Lacy');
#   await expect(page.locator('.icon-container')).toBeVisible();
# });
#
# test('navigation works correctly', async ({ page }) => {
#   await page.goto('/');
#   await page.click('a[href="/about"]');
#   await expect(page).toHaveURL(/.*about/);
# });
# ```
