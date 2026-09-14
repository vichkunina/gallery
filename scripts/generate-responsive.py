#!/usr/bin/env python3
"""Create versioned card previews; never modify source photographs. Requires Pillow."""
import argparse, hashlib, json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--media-dir', type=Path, default=root / 'media')
parser.add_argument('--output-dir', type=Path, default=root / 'media')
args = parser.parse_args()
manifest = {}
for folder in ('gallery', 'koshmariki'):
    for source in sorted((args.media_dir / 'images' / folder / 'thumbs').glob('*.jpg')):
        # The digest includes transform settings, so changed previews get new URLs.
        digest = hashlib.sha256(source.read_bytes() + b'card-jpeg-v1-quality86').hexdigest()[:16]
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            variants = []
            for edge in (320, 640):
                resized = image.copy()
                resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
                rel = f'images/{folder}/thumbs/responsive/{digest}-{edge}.jpg'
                output = args.output_dir / rel
                output.parent.mkdir(parents=True, exist_ok=True)
                if not output.exists():
                    resized.save(output, 'JPEG', quality=86, optimize=True,
                                 icc_profile=original.info.get('icc_profile'))
                variants.append({'src': '/' + rel, 'width': resized.width, 'height': resized.height})
            variants.append({'src': '/' + source.relative_to(args.media_dir).as_posix(),
                             'width': image.width, 'height': image.height})
            manifest['/' + source.relative_to(args.media_dir).as_posix()] = variants
output = root / 'src/config/responsiveImages.json'
output.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'Generated previews for {len(manifest)} photographs; originals unchanged.')
