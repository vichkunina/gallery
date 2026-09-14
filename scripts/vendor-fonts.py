#!/usr/bin/env python3
"""Download the site's Google Fonts to versioned local assets. Run only to update fonts."""
from pathlib import Path
import re, hashlib, urllib.request
root = Path(__file__).resolve().parents[1]
folder = root / 'public/fonts'
folder.mkdir(parents=True, exist_ok=True)
url = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..600&family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'})
css = urllib.request.urlopen(req, timeout=30).read().decode()
blocks = []
for subset, block in re.findall(r'/\* ([^*]+) \*/\s*(@font-face\s*\{[^}]+\})', css):
    if subset not in ('latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'): continue
    for remote in re.findall(r'url\((https://[^)]+)\)', block):
        data = urllib.request.urlopen(remote, timeout=30).read()
        filename = hashlib.sha256(data).hexdigest()[:16] + '.' + remote.rsplit('.',1)[1]
        (folder / filename).write_bytes(data)
        block = block.replace(remote, '/fonts/' + filename)
    blocks.append('/* '+subset+' */\n'+block)
if not blocks: raise RuntimeError('No supported font subsets returned')
(root / 'src/styles/fonts.css').write_text('\n'.join(blocks) + '\n')
for family, directory in [('Caveat','caveat'),('Inter','inter'),('JetBrainsMono','jetbrainsmono')]:
    url = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{directory}/OFL.txt'
    (folder / (family + '-OFL.txt')).write_bytes(urllib.request.urlopen(url,timeout=30).read())
print(f'Vendored {len(blocks)} font faces and their licenses.')
