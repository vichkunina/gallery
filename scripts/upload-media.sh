#!/usr/bin/env bash
set -euo pipefail

BUCKET="${YC_BUCKET:-galleryvic}"
PROFILE="${YC_PROFILE:-vichkunina}"
MEDIA_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)/media}"

if [[ ! -d "${MEDIA_DIR}" ]]; then
  echo "Media folder not found: ${MEDIA_DIR}"
  echo "Create media/images/... locally (gitignored) or pass a path:"
  echo "  bash scripts/upload-media.sh /path/to/images-root"
  exit 1
fi

content_type_for() {
  case "$1" in
    *.svg) echo 'image/svg+xml' ;;
    *.png) echo 'image/png' ;;
    *.jpg|*.jpeg) echo 'image/jpeg' ;;
    *.webp) echo 'image/webp' ;;
    *) echo 'application/octet-stream' ;;
  esac
}

while IFS= read -r -d '' file; do
  rel="${file#"${MEDIA_DIR}/"}"
  mime="$(content_type_for "$rel")"
  echo "upload: ${rel} (${mime})"
  yc --profile "${PROFILE}" storage s3 cp \
    "${file}" "s3://${BUCKET}/${rel}" \
    --content-type "${mime}" \
    --cache-control "public, max-age=31536000, no-transform"
done < <(find "${MEDIA_DIR}" -type f -print0)

echo "Done. Files are served from:"
echo "  https://${BUCKET}.website.yandexcloud.net/images/..."
