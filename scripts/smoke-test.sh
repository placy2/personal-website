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
if echo "$CONTENT" | grep -q "<!doctype html>" && echo "$CONTENT" | grep -q "</html>"; then
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

# Test 6: Crawlability regression guard (GH #169) - a classification crawler
# fetches HTML and never executes JavaScript, so the root cause of the site
# being blocked was an empty <div id="root"> and no meta description. These
# are hard failures: a regression here silently reintroduces the block.
echo "Test 6: Checking for crawlable content and metadata..."
# The description meta tag is formatted across multiple lines, and grep
# matches line-by-line — flatten to one line first so this works with both
# BSD grep (local/macOS) and GNU grep (CI) without relying on a
# multi-line-capable extension either one might lack.
FLAT_CONTENT=$(echo "$CONTENT" | tr '\n' ' ')

if echo "$FLAT_CONTENT" | grep -qE '<meta[[:space:]]+name="description"[[:space:]]+content="[^"]+"'; then
  echo -e "${GREEN}✓ meta description present${NC}"
else
  echo -e "${RED}✗ meta description missing — crawlers see no page description${NC}"
  exit 1
fi

if echo "$FLAT_CONTENT" | grep -qE '<div id="root"[^>]*></div>'; then
  echo -e "${RED}✗ #root is empty — page has no crawlable content without JavaScript${NC}"
  exit 1
else
  echo -e "${GREEN}✓ #root contains prerendered content${NC}"
fi

# Test 7: robots.txt exists, is served as plain text, and points to the sitemap
echo "Test 7: Checking robots.txt..."
ROBOTS_HEADERS=$(curl -s -D - -o /tmp/smoke-test-robots.txt "$URL/robots.txt")
ROBOTS_STATUS=$(echo "$ROBOTS_HEADERS" | head -n 1 | grep -oE '[0-9]{3}')
ROBOTS_CONTENT_TYPE=$(echo "$ROBOTS_HEADERS" | grep -i "^content-type:" | tr -d '\r')

if [ "$ROBOTS_STATUS" = "200" ] && echo "$ROBOTS_CONTENT_TYPE" | grep -qi "text/plain"; then
  echo -e "${GREEN}✓ /robots.txt: 200, $ROBOTS_CONTENT_TYPE${NC}"
else
  echo -e "${RED}✗ /robots.txt returned status '$ROBOTS_STATUS', content-type '$ROBOTS_CONTENT_TYPE' (expected 200, text/plain)${NC}"
  exit 1
fi

if grep -q "^Sitemap:" /tmp/smoke-test-robots.txt; then
  echo -e "${GREEN}✓ robots.txt references a sitemap${NC}"
else
  echo -e "${RED}✗ robots.txt has no Sitemap: line${NC}"
  exit 1
fi
rm -f /tmp/smoke-test-robots.txt

# Test 8: sitemap.xml exists and is served with an XML content type
echo "Test 8: Checking sitemap.xml..."
SITEMAP_HEADERS=$(curl -s -D - -o /dev/null "$URL/sitemap.xml")
SITEMAP_STATUS=$(echo "$SITEMAP_HEADERS" | head -n 1 | grep -oE '[0-9]{3}')
SITEMAP_CONTENT_TYPE=$(echo "$SITEMAP_HEADERS" | grep -i "^content-type:" | tr -d '\r')

if [ "$SITEMAP_STATUS" = "200" ] && echo "$SITEMAP_CONTENT_TYPE" | grep -qi "xml"; then
  echo -e "${GREEN}✓ /sitemap.xml: 200, $SITEMAP_CONTENT_TYPE${NC}"
else
  echo -e "${RED}✗ /sitemap.xml returned status '$SITEMAP_STATUS', content-type '$SITEMAP_CONTENT_TYPE' (expected 200, xml)${NC}"
  exit 1
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
