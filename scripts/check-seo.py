#!/usr/bin/env python3
"""Check generated documents, canonical routes and image delivery without a browser."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import json, re, xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.links=[]; self.images=[]; self.meta={}; self.canonical=None; self.scripts=[]; self.json=[]; self.in_json=False; self.buf=''; self.h1=0
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='a': self.links.append(a.get('href',''))
        if tag=='img': self.images.append(a)
        if tag=='meta': self.meta[a.get('name') or a.get('property')]=a.get('content')
        if tag=='link' and a.get('rel')=='canonical': self.canonical=a.get('href')
        if tag=='h1': self.h1+=1
        if tag=='script':
            if a.get('src'): self.scripts.append(a['src'])
            if a.get('type')=='application/ld+json': self.in_json=True; self.buf=''
    def handle_data(self, text):
        if self.in_json:self.buf+=text
    def handle_endtag(self, tag):
        if tag=='script' and self.in_json:self.json.append(json.loads(self.buf));self.in_json=False

def read(rel):return (dist / rel.lstrip('/') / 'index.html').read_text() if rel.endswith('/') else (dist / rel.lstrip('/')).read_text()
def page(rel):return Page(read(rel))
urls=[node.text for node in ET.parse(dist/'sitemap.xml').findall('{*}url/{*}loc')]
assert len(urls)>=51, len(urls)
assert len(urls)==len(set(urls))
for url in urls:
    path=urlparse(url).path
    doc=page(path)
    assert doc.h1>=1, path
    assert doc.canonical==url,(path,doc.canonical)
    assert doc.meta.get('description'),path
    assert doc.json,path
home=page('/')
assert len([x for x in home.links if re.match(r'/work/\d+',x)])>=44
assert '/work/48/' in home.links and home.links.index('/work/48/')<home.links.index('/work/49/')
assert not any('pinterest' in x.lower() for x in home.links)
assert 'Привет' in read('/') and 'data-prerender' in read('/')
for path in ['/work/48/','/work/48/1/','/work/48/2/','/work/48/3/']:
    assert page(path).canonical=='https://vichkunina.art/work/48/'
assert "You're my angel" in page('/work/45/1/').meta['description']
star=page('/work/24/');assert 'Не продаётся' in star.meta['description']; assert '000' not in star.meta['description']
assert 'Продано' in page('/work/49/1/').meta['description']
assert '30\u00a0000' in page('/work/48/1/').meta['description']
for path in ['/buy/','/order/','/collections/cinema/','/collections/magnets/','/collections/landscapes/','/koshmariki/']:
    doc=page(path)
    assert any('landing-analytics-' in x for x in doc.scripts),path
    assert all('/thumbs/' in x['src'] for x in doc.images),path
    assert not any('pinterest' in x.lower() for x in doc.links)
assert len(page('/buy/').images)>0
assert not any('/work/49/' in x or '/work/24/' in x for x in page('/buy/').links)
for file in dist.rglob('*.html'):
    doc=Page(file.read_text())
    for href in doc.links:
        url=urlparse(href)
        if url.netloc not in ('','vichkunina.art'):continue
        if url.path.startswith(('/images/','/fonts/')) or not url.path:continue
        candidate=dist/url.path.lstrip('/')
        if url.path.endswith('/'):candidate=candidate/'index.html'
        assert candidate.exists(),(str(file),href)
    for asset in doc.scripts:
        if asset.startswith('/'):assert (dist/asset.lstrip('/')).is_file(),asset
print(f'Passed: {len(urls)} sitemap URLs, {len(list(dist.rglob("*.html")))} HTML files, canonical aliases, sale statuses, internal links, analytics and preview-only lists.')
