#!/usr/bin/env bash
# Upload only specific media files to CDN (fast path for 1–2 new photos).
#
# Usage:
#   bash scripts/upload-media-files.sh images/gallery/06-2026-03-09-05.jpg
#   bash scripts/upload-media-files.sh images/gallery/foo.jpg images/gallery/thumbs/foo.jpg
#
set -euo pipefail

BUCKET="${YC_BUCKET:-galleryvic}"
PROFILE="${YC_PROFILE:-vichkunina}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MEDIA_DIR="${ROOT}/media"

content_type_for() {
  case "$1" in
    *.svg) echo 'image/svg+xml' ;;
    *.png) echo 'image/png' ;;
    *.jpg|*.jpeg) echo 'image/jpeg' ;;
    *.webp) echo 'image/webp' ;;
    *) echo 'application/octet-stream' ;;
  esac
}

if [[ $# -eq 0 ]]; then
  echo "Usage: bash scripts/upload-media-files.sh <path-under-media> [more paths...]"
  echo "Example: bash scripts/upload-media-files.sh images/gallery/06-2026-03-09-05.jpg"
  exit 1
fi

for rel in "$@"; do
  rel="${rel#media/}"
  rel="${rel#/}"
  src="${MEDIA_DIR}/${rel}"
  if [[ ! -f "$src" ]]; then
    echo "Not found: ${src}"
    exit 1
  fi
  mime="$(content_type_for "$rel")"
  echo "upload: ${rel} (${mime})"
  yc --profile "${PROFILE}" storage s3 cp \
    "${src}" "s3://${BUCKET}/${rel}" \
    --content-type "${mime}" \
    --cache-control "public, max-age=31536000, no-transform"
done

echo "Done."
