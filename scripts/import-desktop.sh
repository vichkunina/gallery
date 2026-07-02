#!/usr/bin/env bash
# Import photos from ~/Desktop/картины without lossy recompression.
# - JPG/JPEG/PNG/WEBP/GIF: copied byte-for-byte
# - HEIC: converted to JPEG at quality 100 (browsers can't show HEIC)
set -euo pipefail

DESKTOP="${DESKTOP:-$HOME/Desktop/картины}"
MEDIA_DIR="$(cd "$(dirname "$0")/.." && pwd)/media/images"
HEIC_QUALITY="${IMPORT_HEIC_QUALITY:-100}"

if [[ ! -d "$DESKTOP" ]]; then
  echo "Folder not found: $DESKTOP"
  exit 1
fi

import_file() {
  local src="$1" rel="$2"
  local dst="${MEDIA_DIR}/${rel}"
  mkdir -p "$(dirname "$dst")"
  local ext
  ext="$(printf '%s' "${src##*.}" | tr '[:upper:]' '[:lower:]')"

  case "$ext" in
    jpg|jpeg|png|webp|gif)
      cp -p "$src" "$dst"
      echo "copy: $(basename "$src") → $rel"
      ;;
    heic|heif)
      sips -s format jpeg -s formatOptions "$HEIC_QUALITY" "$src" --out "$dst" >/dev/null
      echo "heic→jpeg (q${HEIC_QUALITY}): $(basename "$src") → $rel"
      ;;
    *)
      echo "skip unsupported: $src"
      return 1
      ;;
  esac
}

# Album views for existing works
import_file "$DESKTOP/2026-02-02 19-45-21.HEIC" "gallery/01-bifurkatsiya-sosny-framed-1100.jpg"
import_file "$DESKTOP/2026-02-19 20-48-21.HEIC" "gallery/06-aysberg-wip-close-1101.jpg"
import_file "$DESKTOP/2026-03-30 20-53-50.HEIC" "gallery/06-aysberg-finished-1102.jpg"
import_file "$DESKTOP/2026-04-13 20-46-39.HEIC" "gallery/06-aysberg-angle-1103.jpg"
import_file "$DESKTOP/2025-11-02 15-23-18.JPG" "gallery/32-self-detail-1104.jpg"
import_file "$DESKTOP/2022-01-16 17-21-06_1642357724448.JPG" "gallery/10-depressivnaya-detail-1123.jpg"

# New works
import_file "$DESKTOP/2025-08-22 15-49-07.JPG" "gallery/37-babochka-1105.jpg"
import_file "$DESKTOP/2025-08-22 15-50-27.JPG" "gallery/37-babochka-detail-1106.jpg"
import_file "$DESKTOP/2025-08-22 15-51-37.JPG" "gallery/38-tramvay-1107.jpg"
import_file "$DESKTOP/2025-08-22 15-51-44.JPG" "gallery/38-tramvay-detail-1108.jpg"
import_file "$DESKTOP/2023-10-01 12-47-09.WEBP" "gallery/39-poezd-gory-detail-1109.webp"
import_file "$DESKTOP/2023-10-01 13-17-44.JPG" "gallery/39-poezd-gory-easel-1110.jpg"
import_file "$DESKTOP/2023-10-01 13-46-26.JPG" "gallery/39-poezd-gory-studio-1111.jpg"
import_file "$DESKTOP/2023-12-31 11-50-02.JPG" "gallery/39-poezd-gory-framed-1112.jpg"
import_file "$DESKTOP/2025-12-20 17-40-44.JPG" "gallery/40-lesnaya-tropa-1113.jpg"
import_file "$DESKTOP/2026-05-16 14-27-26_1778932645582.HEIC" "gallery/41-prividenie-1114.jpg"
import_file "$DESKTOP/2026-06-13 15-09-46.HEIC" "gallery/42-ya-i-bertochka-1115.jpg"
import_file "$DESKTOP/2024-02-13 13-23-42.JPG" "gallery/43-saturn-1116.jpg"
import_file "$DESKTOP/2025-07-20 14-17-26.JPG" "gallery/44-poison-ivy-1117.jpg"
import_file "$DESKTOP/2024-03-02 16-23-49.JPG" "gallery/45-peterburg-noch-1118.jpg"
import_file "$DESKTOP/2026-03-09 12-36-23.HEIC" "gallery/46-tommi-1119.jpg"
import_file "$DESKTOP/2025-11-02 12-45-23.JPG" "gallery/47-v-proeme-1120.jpg"
import_file "$DESKTOP/2022-06-10 18-08-52.JPG" "gallery/48-shtorm-1121.jpg"
import_file "$DESKTOP/2024-08-13 18-17-03_1756483746758.JPG" "koshmariki/13-cat-1122.jpg"

echo "Done. Run: npm run upload:media"
