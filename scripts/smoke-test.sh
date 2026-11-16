#!/bin/bash

# smoke-test.sh - Basic smoke tests for deployed website
# Tests that the deployed site returns a 200 status and contains expected content
#
# Usage: ./smoke-test.sh <url> [s3-direct-url]
#   s3-direct-url  the bucket's REST URL (terraform output -raw s3_direct_url).
#                  When given, the bucket must refuse direct reads (403).
# Example: ./smoke-test.sh https://d1234abcd.cloudfront.net https://parkerlacy-dev-hosting.s3.us-east-1.amazonaws.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

URL=$1
S3_DIRECT_URL=${2:-}

if [ -z "$URL" ]; then
  echo -e "${RED}Error: URL argument required${NC}"
  echo "Usage: $0 <url> [s3-direct-url]"
  echo "Example: $0 https://d1234abcd.cloudfront.net"
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
EXPECTED_TEXTS=("Parker Lacy" "DevOps" "Platform")
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

# Test 9: every route in the sitemap serves its own prerendered page, with a
# 200 and no redirect. A CloudFront Function rewrites /<path> to
# /<path>/index.html (the S3 REST origin has no index document). If that
# breaks, routes 404 or fall back to the home page's HTML, and link previews
# for /work/<slug> show the wrong title and description. No -L: a sitemap must
# not list a URL that redirects (e.g. /projects, which 301s to /work).
echo "Test 9: Checking each sitemap route serves its own page..."
SITEMAP_LOCS=$(curl -s "$URL/sitemap.xml" | grep -oE '<loc>[^<]+</loc>' | sed -E 's#</?loc>##g')

if [ -z "$SITEMAP_LOCS" ]; then
  echo -e "${RED}✗ sitemap.xml lists no routes${NC}"
  exit 1
fi

for LOC in $SITEMAP_LOCS; do
  # Locs use the canonical domain; swap it for the URL under test.
  ROUTE_PATH="/${LOC#*://*/}"
  [ "$LOC" = "${LOC#*://*/}" ] && ROUTE_PATH="/"
  [ "$ROUTE_PATH" = "/" ] && continue

  ROUTE_RESPONSE=$(curl -s -w "\n%{http_code}" "${URL%/}$ROUTE_PATH")
  ROUTE_STATUS=$(echo "$ROUTE_RESPONSE" | tail -n 1)
  ROUTE_BODY=$(echo "$ROUTE_RESPONSE" | sed '$d' | tr '\n' ' ')

  if [ "$ROUTE_STATUS" != "200" ]; then
    echo -e "${RED}✗ $ROUTE_PATH returned $ROUTE_STATUS (expected 200)${NC}"
    exit 1
  fi
  if echo "$ROUTE_BODY" | grep -qF "data-prerendered-route=\"$ROUTE_PATH\""; then
    echo -e "${GREEN}✓ $ROUTE_PATH serves its own prerendered page${NC}"
  else
    echo -e "${RED}✗ $ROUTE_PATH served another route's HTML (routing rewrite broken?)${NC}"
    exit 1
  fi
done

# Test 10: unknown paths return a real 404, not the home page with a 200 (GH
# #169). A 404->200 fallback tells crawlers every mistyped URL is a duplicate
# of the home page. No -L: CloudFront passes S3's 404 through, with index.html
# as the body (custom_error_response) so the app can render "Page not found".
# A 403 here means the bucket policy lost s3:ListBucket for CloudFront.
echo "Test 10: Checking an unknown path returns 404..."
BAD_PATH="/smoke-test-definitely-not-a-real-page-$RANDOM"
BAD_HEADERS=$(curl -s -D - -o /dev/null "${URL%/}$BAD_PATH")
BAD_STATUS=$(echo "$BAD_HEADERS" | head -n 1 | grep -oE '[0-9]{3}')
BAD_CONTENT_TYPE=$(echo "$BAD_HEADERS" | grep -i "^content-type:" | tr -d '\r')

if [ "$BAD_STATUS" = "404" ]; then
  echo -e "${GREEN}✓ $BAD_PATH: 404${NC}"
else
  echo -e "${RED}✗ $BAD_PATH returned $BAD_STATUS (expected 404 — is a 404->200 fallback back, or did CloudFront lose s3:ListBucket?)${NC}"
  exit 1
fi

if echo "$BAD_CONTENT_TYPE" | grep -qi "text/html"; then
  echo -e "${GREEN}✓ 404 body is the HTML app shell ($BAD_CONTENT_TYPE)${NC}"
else
  echo -e "${RED}✗ 404 body is '$BAD_CONTENT_TYPE', not HTML (custom_error_response missing?)${NC}"
  exit 1
fi

# Test 11: Cache-Control on an HTML page and on a hashed asset. These are set
# per object by scripts/upload-site.sh; a wrong value either serves stale pages
# (HTML) or throws away long-lived caching (assets).
echo "Test 11: Checking Cache-Control headers..."
header_value() { grep -i "^$1:" | head -n 1 | cut -d: -f2- | sed -e 's/^[[:space:]]*//' | tr -d '\r'; }

HOME_HEADERS=$(curl -s -D - -o /dev/null "$URL")
HOME_CACHE=$(echo "$HOME_HEADERS" | header_value cache-control)
if [ "$HOME_CACHE" = "no-cache" ]; then
  echo -e "${GREEN}✓ HTML Cache-Control: $HOME_CACHE${NC}"
else
  echo -e "${RED}✗ HTML Cache-Control is '$HOME_CACHE' (expected 'no-cache')${NC}"
  exit 1
fi

ASSET_PATH=$(echo "$CONTENT" | grep -oE '/assets/[A-Za-z0-9._-]+\.(js|css)' | head -n 1)
if [ -z "$ASSET_PATH" ]; then
  echo -e "${RED}✗ Home page references no /assets/*.js or *.css file${NC}"
  exit 1
fi
ASSET_HEADERS=$(curl -s -D - -o /dev/null "${URL%/}$ASSET_PATH")
ASSET_STATUS=$(echo "$ASSET_HEADERS" | head -n 1 | grep -oE '[0-9]{3}')
ASSET_CACHE=$(echo "$ASSET_HEADERS" | header_value cache-control)
if [ "$ASSET_STATUS" = "200" ] && [ "$ASSET_CACHE" = "public, max-age=31536000, immutable" ]; then
  echo -e "${GREEN}✓ $ASSET_PATH: 200, Cache-Control: $ASSET_CACHE${NC}"
else
  echo -e "${RED}✗ $ASSET_PATH returned '$ASSET_STATUS', Cache-Control '$ASSET_CACHE' (expected 200, 'public, max-age=31536000, immutable')${NC}"
  exit 1
fi

# Test 12: the retired /projects route 301s to /work (CloudFront Function).
echo "Test 12: Checking /projects redirects to /work..."
for OLD_PATH in /projects /projects/; do
  REDIRECT_HEADERS=$(curl -s -D - -o /dev/null "${URL%/}$OLD_PATH")
  REDIRECT_STATUS=$(echo "$REDIRECT_HEADERS" | head -n 1 | grep -oE '[0-9]{3}')
  REDIRECT_LOCATION=$(echo "$REDIRECT_HEADERS" | header_value location)
  case "$REDIRECT_LOCATION" in
    /work | */work) LOCATION_OK=true ;;
    *) LOCATION_OK=false ;;
  esac
  if [ "$REDIRECT_STATUS" = "301" ] && [ "$LOCATION_OK" = true ]; then
    echo -e "${GREEN}✓ $OLD_PATH: 301 -> $REDIRECT_LOCATION${NC}"
  else
    echo -e "${RED}✗ $OLD_PATH returned '$REDIRECT_STATUS' -> '$REDIRECT_LOCATION' (expected 301 -> /work)${NC}"
    exit 1
  fi
done

# Test 13: the bucket itself is private (only CloudFront can read it).
if [ -n "$S3_DIRECT_URL" ]; then
  echo "Test 13: Checking the bucket refuses direct reads..."
  DIRECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${S3_DIRECT_URL%/}/index.html")
  if [ "$DIRECT_STATUS" = "403" ]; then
    echo -e "${GREEN}✓ ${S3_DIRECT_URL%/}/index.html: 403${NC}"
  else
    echo -e "${RED}✗ ${S3_DIRECT_URL%/}/index.html returned $DIRECT_STATUS (expected 403 — bucket is publicly readable?)${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Test 13: skipped (no S3 direct URL given)${NC}"
fi

echo "----------------------------------------"
if [ "$ALL_FOUND" = true ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some non-critical checks failed, but core functionality is working${NC}"
  exit 0
fi
