#!/usr/bin/env python3
"""Publish generated files, assets first and home last. Original media is never uploaded."""
import argparse, mimetypes, os, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root = Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--skip-build', action='store_true')
parser.add_argument('--previews-dir', type=Path)
args=parser.parse_args()
if not args.skip_build:
    subprocess.run(['npm','run','build'],cwd=root,check=True)
subprocess.run(['python3',str(root/'scripts/check-seo.py')],check=True)
profile=os.environ.get('YC_PROFILE','vichkunina')
bucket=os.environ.get('YC_BUCKET','galleryvic')
def upload(item):
    file,key=item
    mime=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
    if file.suffix=='.js':mime='application/javascript; charset=utf-8'
    elif file.suffix in ('.html','.css','.xml','.txt','.json'):mime+='; charset=utf-8'
    immutable=key.startswith('assets/') or (key.startswith('fonts/') and file.suffix=='.woff2') or '/thumbs/responsive/' in key
    cache='public, max-age=31536000, immutable' if immutable else 'no-cache, max-age=0, must-revalidate'
    subprocess.run(['yc','--profile',profile,'storage','s3','cp',str(file),f's3://{bucket}/{key}',
                    '--content-type',mime,'--cache-control',cache,'--only-show-errors'],check=True)
    return key

def upload_group(items,label):
    print(f'{label}: {len(items)} files',flush=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        for n,key in enumerate(pool.map(upload,items),1):
            if n%20==0 or n==len(items):print(f'{label}: {n}/{len(items)}',flush=True)

if args.previews_dir:
    previews=[(p,p.relative_to(args.previews_dir).as_posix()) for p in args.previews_dir.rglob('*.jpg') if '/thumbs/responsive/' in p.relative_to(args.previews_dir).as_posix()]
    if not previews: raise RuntimeError('No responsive previews found')
    if any('/thumbs/responsive/' not in key for _,key in previews):raise RuntimeError('Only versioned responsive previews may be uploaded')
    upload_group(previews,'Previews')
dist=root/'dist'
files=[(p,p.relative_to(dist).as_posix()) for p in dist.rglob('*') if p.is_file()]
assets=[x for x in files if x[0].suffix!='.html']
pages=[x for x in files if x[0].suffix=='.html' and x[1]!='index.html']
upload_group(assets,'Assets')
upload_group(pages,'Pages')
upload((dist/'index.html','index.html'))
print('Published; home uploaded last.',flush=True)
