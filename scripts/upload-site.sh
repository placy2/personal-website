#!/usr/bin/env bash

# upload-site.sh - upload frontend/dist to the site bucket, then invalidate
# CloudFront.
#
# Usage: ./scripts/upload-site.sh <bucket> [distribution-id] [dist-dir]
#   bucket           S3 bucket name (terraform output -raw s3_bucket_name)
#   distribution-id  CloudFront distribution to invalidate; omit to skip
#   dist-dir         defaults to frontend/dist next to this script
#
# Run after `terraform apply`: Terraform owns the bucket and distribution, this
# script owns the objects in the bucket.
#
# Headers match what Terraform used to set on each aws_s3_object:
#   *.html                 Cache-Control: no-cache
#   assets/** (non-HTML)   Cache-Control: public, max-age=31536000, immutable
#   everything else        Cache-Control: public, max-age=86400
# and Content-Type comes from the explicit map below, never the AWS CLI's
# guess (which varies with the CLI's bundled Python mimetypes table).
#
# Pass order, and why:
#   1. assets/   sync, no --delete. Hashed names, so a name that's already in
#                the bucket already has the right bytes and sync can skip it.
#                Uploaded first so new HTML never references a missing file.
#                Old hashed files are kept: a tab opened before this deploy
#                still lazy-loads chunks by their old names, and other caches
#                may hold old HTML. They're small; prune them out of band.
#   2. root      cp, everything outside assets/ that isn't HTML (robots.txt,
#                sitemap.xml, images from public/). cp, not sync: these names
#                aren't content-hashed, so a same-size edit could be skipped by
#                sync's size/mtime check.
#   3. HTML      cp, last, so every page lands after what it references. Each
#                build stamps its commit SHA into the HTML, so same-size
#                changes are normal here.
#   4. prune     sync --delete --size-only outside assets/. Removes pages and
#                public files that are no longer in the build (e.g. a deleted
#                route's index.html, which would otherwise keep serving a 200).
#                Everything it compares was just uploaded with the same size,
#                so it uploads nothing; it only deletes.
#
# Invalidation: one "/*" path. HTML is no-cache, but the edge still holds the
# 86400s files (sitemap.xml, robots.txt, og-image, ...) for up to a day, and
# 404s for 10s. A wildcard counts as one path toward the 1,000 free paths a
# month, so it costs nothing; the only cost is the edges refetching unchanged
# hashed assets once, which is negligible for this site. Listing exact paths
# would need the cache keys (rewritten /about/index.html etc.) and would miss
# deleted files. The script waits for completion so the smoke tests that follow
# see the new deploy.

set -euo pipefail

BUCKET=${1:-}
DISTRIBUTION_ID=${2:-}
DIST_DIR=${3:-"$(cd "$(dirname "$0")/.." && pwd)/frontend/dist"}

if [ -z "$BUCKET" ]; then
  echo "Usage: $0 <bucket> [distribution-id] [dist-dir]" >&2
  exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "❌ $DIST_DIR/index.html not found. Build the frontend first (cd frontend && npm run build)." >&2
  exit 1
fi

HTML_CACHE="no-cache"
ASSET_CACHE="public, max-age=31536000, immutable"
DEFAULT_CACHE="public, max-age=86400"

# Extension -> Content-Type. The first 13 are exactly the map Terraform used
# (terraform/locals.tf before this script existed). The rest have no current
# file in dist; they're here so adding one doesn't fail the deploy.
content_type_for() {
  case "$1" in
    html) echo "text/html" ;;
    css) echo "text/css" ;;
    js) echo "text/javascript" ;;
    jpeg | jpg) echo "image/jpeg" ;;
    png) echo "image/png" ;;
    webp) echo "image/webp" ;;
    svg) echo "image/svg+xml" ;;
    gif) echo "image/gif" ;;
    ico) echo "image/x-icon" ;;
    json) echo "application/json" ;;
    txt) echo "text/plain" ;;
    xml) echo "application/xml" ;;
    mjs) echo "text/javascript" ;;
    webmanifest) echo "application/manifest+json" ;;
    woff2) echo "font/woff2" ;;
    *) return 1 ;;
  esac
}

# Prints the extensions present under a directory (one per line, unique),
# optionally excluding a subdirectory. Fails on any file with no extension or
# an unmapped one: uploading it with a guessed Content-Type (or skipping it,
# as Terraform's fileset glob silently did) is worse than a failed deploy.
extensions_in() {
  local dir=$1 prune=${2:-}
  local find_args=("$dir")
  [ -n "$prune" ] && find_args+=(-path "$dir/$prune" -prune -o)
  find "${find_args[@]}" -type f -print | while IFS= read -r file; do
    local name ext
    name=$(basename "$file")
    ext=${name##*.}
    if [ "$ext" = "$name" ] || [ -z "$ext" ] || ! content_type_for "$ext" >/dev/null; then
      echo "UNMAPPED:${file#"$DIST_DIR"/}"
    else
      echo "$ext"
    fi
  done | sort -u
}

ALL_EXTS=$(extensions_in "$DIST_DIR")
if echo "$ALL_EXTS" | grep -q '^UNMAPPED:'; then
  echo "❌ Files with no known Content-Type (add them to content_type_for in $0):" >&2
  echo "$ALL_EXTS" | sed -n 's/^UNMAPPED:/  /p' >&2
  exit 1
fi

S3="s3://$BUCKET"
COMMON=(--no-progress --only-show-errors)

echo "📦 Uploading $DIST_DIR to $S3"

# 1. assets/ (hashed, immutable). HTML is excluded here and handled in pass 3.
if [ -d "$DIST_DIR/assets" ]; then
  for ext in $(extensions_in "$DIST_DIR/assets"); do
    [ "$ext" = "html" ] && continue
    echo "  assets/*.$ext"
    aws s3 sync "$DIST_DIR/assets" "$S3/assets" "${COMMON[@]}" \
      --exclude '*' --include "*.$ext" \
      --content-type "$(content_type_for "$ext")" \
      --cache-control "$ASSET_CACHE"
  done
fi

# 2. Everything else outside assets/, except HTML.
for ext in $(extensions_in "$DIST_DIR" assets); do
  [ "$ext" = "html" ] && continue
  echo "  *.$ext (outside assets/)"
  aws s3 cp "$DIST_DIR" "$S3" --recursive "${COMMON[@]}" \
    --exclude '*' --include "*.$ext" --exclude 'assets/*' \
    --content-type "$(content_type_for "$ext")" \
    --cache-control "$DEFAULT_CACHE"
done

# 3. HTML, anywhere (including assets/, matching Terraform's rule order).
echo "  *.html"
aws s3 cp "$DIST_DIR" "$S3" --recursive "${COMMON[@]}" \
  --exclude '*' --include '*.html' \
  --content-type "$(content_type_for html)" \
  --cache-control "$HTML_CACHE"

# 4. Prune stale non-asset objects. Excluded keys are never deleted, so old
#    hashed assets survive.
echo "  pruning files no longer in the build (outside assets/)"
aws s3 sync "$DIST_DIR" "$S3" "${COMMON[@]}" --delete --size-only --exclude 'assets/*'

echo "✅ Upload complete"

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "🌐 Invalidating CloudFront distribution $DISTRIBUTION_ID (/*)"
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" --paths '/*' \
    --query 'Invalidation.Id' --output text)
  echo "  waiting for invalidation $INVALIDATION_ID"
  aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" --id "$INVALIDATION_ID"
  echo "✅ Invalidation complete"
else
  echo "ℹ️  No distribution ID given; skipping CloudFront invalidation"
fi
