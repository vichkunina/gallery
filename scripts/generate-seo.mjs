#!/usr/bin/env node
/**
 * Post-build: sitemap.xml + JSON-LD injected into dist/index.html for crawlers.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = 'https://vichkunina.art';
const SITE_TITLE = 'Дарья Вичкунина — художник | галерея картин, заказ картин';
const SITE_DESC =
  'Галерея оригинальных картин художника Дарьи Вичкуниной: масло, акварель, смешанная техника. Купить готовую работу или заказать картину на заказ.';

function absUrl(relativePath) {
  const normalized = relativePath.replace(/^\//, '');
  return `${SITE_URL}/${normalized}`;
}

function parseArtworks(tsContent) {
  const items = [];
  const re =
    /title:\s*'([^']*)'[\s\S]*?details:\s*'([^']*)'[\s\S]*?desc:\s*'([^']*)'[\s\S]*?mediaUrl\('([^']*)'\)/g;
  let match;
  while ((match = re.exec(tsContent)) !== null) {
    items.push({
      title: match[1],
      details: match[2],
      desc: match[3],
      imagePath: match[4],
    });
  }
  return items;
}

function parseSimpleItems(tsContent) {
  const items = [];
  const re =
    /title:\s*'([^']*)',\s*img:\s*mediaUrl\('([^']*)'\)/g;
  let match;
  while ((match = re.exec(tsContent)) !== null) {
    items.push({
      title: match[1],
      details: '',
      desc: '',
      imagePath: match[2],
    });
  }
  return items;
}

function buildJsonLd(artworks, koshmariki) {
  const personId = `${SITE_URL}/#person`;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_TITLE,
      description: SITE_DESC,
      inLanguage: 'ru-RU',
      publisher: { '@id': personId },
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: 'Дарья Вичкунина',
      givenName: 'Дарья',
      familyName: 'Вичкунина',
      jobTitle: 'Художник',
      url: SITE_URL,
      description: SITE_DESC,
      sameAs: ['https://t.me/vichkunina_d', 'https://t.me/vichkunina'],
    },
    {
      '@type': 'ImageGallery',
      '@id': `${SITE_URL}/#gallery`,
      name: 'Галерея картин Дарьи Вичкуниной',
      url: `${SITE_URL}/#gallery`,
      inLanguage: 'ru-RU',
      author: { '@id': personId },
      description:
        'Оригинальные картины маслом, акварелью и смешанной техникой. Можно купить готовую работу или заказать картину.',
      hasPart: artworks.map((art) => ({
        '@type': 'VisualArtwork',
        name: art.title,
        description: art.desc,
        artMedium: art.details,
        image: absUrl(art.imagePath),
        creator: { '@id': personId },
        url: `${SITE_URL}/#gallery`,
      })),
    },
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/#order`,
      name: 'Заказ картины',
      description:
        'Индивидуальный заказ картины: обсуждение идеи, размер, техника, сроки и доставка по России и миру.',
      provider: { '@id': personId },
      areaServed: 'RU',
      url: `${SITE_URL}/#contact`,
    },
  ];

  if (koshmariki.length) {
    graph.push({
      '@type': 'CreativeWorkSeries',
      '@id': `${SITE_URL}/#koshmariki`,
      name: 'Кошмарики',
      url: `${SITE_URL}/#koshmariki`,
      author: { '@id': personId },
      hasPart: koshmariki.map((item) => ({
        '@type': 'VisualArtwork',
        name: item.title,
        image: absUrl(item.imagePath),
        creator: { '@id': personId },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

function buildSitemap(images) {
  const today = new Date().toISOString().slice(0, 10);
  const imageTags = images
    .map(
      (img) => `    <image:image>
      <image:loc>${absUrl(img.imagePath)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${imageTags}
  </url>
</urlset>
`;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildNoscript(artworks) {
  const list = artworks
    .slice(0, 12)
    .map((art) => `<li>${escapeXml(art.title)} — ${escapeXml(art.details)}</li>`)
    .join('\n      ');

  return `<noscript>
    <article>
      <h1>${escapeXml(SITE_TITLE)}</h1>
      <p>${escapeXml(SITE_DESC)}</p>
      <h2>Галерея картин</h2>
      <ul>
      ${list}
      </ul>
      <p><a href="${SITE_URL}/#contact">Заказать картину</a> · <a href="https://t.me/vichkunina">@vichkunina</a></p>
    </article>
  </noscript>`;
}

function main() {
  const artworksTs = fs.readFileSync(path.join(ROOT, 'src/data/artworks.ts'), 'utf8');
  const koshmarikiTs = fs.readFileSync(path.join(ROOT, 'src/data/koshmariki.ts'), 'utf8');
  const artworks = parseArtworks(artworksTs);
  const koshmariki = parseSimpleItems(koshmarikiTs);
  const allImages = [...artworks, ...koshmariki];

  const jsonLd = buildJsonLd(artworks, koshmariki);
  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(allImages), 'utf8');

  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  if (!html.includes('application/ld+json')) {
    html = html.replace('</head>', `  ${jsonLdScript}\n  </head>`);
  }

  if (!html.includes('<noscript>')) {
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${buildNoscript(artworks)}`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');

  console.log(`SEO: sitemap.xml (${allImages.length} images), JSON-LD, noscript → dist/`);
}

main();
