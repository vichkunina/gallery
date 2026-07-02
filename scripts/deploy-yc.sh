#!/usr/bin/env bash
set -euo pipefail

BUCKET="${YC_BUCKET:-galleryvic}"
PROFILE="${YC_PROFILE:-vichkunina}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

content_type_for() {
  case "$1" in
    *.html) echo 'text/html; charset=utf-8' ;;
    *.css) echo 'text/css; charset=utf-8' ;;
    *.js) echo 'application/javascript; charset=utf-8' ;;
    *.json) echo 'application/json; charset=utf-8' ;;
    *.xml) echo 'application/xml; charset=utf-8' ;;
    *.txt) echo 'text/plain; charset=utf-8' ;;
    *.svg) echo 'image/svg+xml' ;;
    *.png) echo 'image/png' ;;
    *.jpg|*.jpeg) echo 'image/jpeg' ;;
    *.webp) echo 'image/webp' ;;
    *.woff2) echo 'font/woff2' ;;
    *.woff) echo 'font/woff' ;;
    *) echo 'application/octet-stream' ;;
  esac
}

upload_tree() {
  local source_dir="$1"
  local dest_prefix="${2:-}"

  while IFS= read -r -d '' file; do
    local rel="${file#"${source_dir}/"}"
    local key="${dest_prefix}${rel}"
    local mime
    mime="$(content_type_for "$rel")"

    echo "upload: ${key} (${mime})"
    local cache_control=""
    if [[ "$rel" == "index.html" || "$rel" == icons/* || "$rel" == favicon*.png || "$rel" == "apple-touch-icon.png" ]]; then
      cache_control="no-cache, max-age=0"
    fi
    if [[ -n "$cache_control" ]]; then
      yc --profile "${PROFILE}" storage s3 cp \
        "${file}" "s3://${BUCKET}/${key}" \
        --content-type "${mime}" \
        --cache-control "${cache_control}"
    else
      yc --profile "${PROFILE}" storage s3 cp \
        "${file}" "s3://${BUCKET}/${key}" \
        --content-type "${mime}"
    fi
  done < <(find "${source_dir}" -type f -print0)
}

echo "→ Building site..."
npm --prefix "$ROOT" run build

echo "→ Uploading dist/ to s3://${BUCKET}/ with correct MIME types..."
upload_tree "${ROOT}/dist"

echo "Done. Check:"
echo "  https://${BUCKET}.website.yandexcloud.net"
