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

function parseArtworksWithIds(tsContent) {
  const items = [];
  const blockRe = /\{\s*\n\s*id:\s*(\d+),[\s\S]*?\n\s*\},/g;
  let blockMatch;
  while ((blockMatch = blockRe.exec(tsContent)) !== null) {
    const block = blockMatch[0];
    const id = Number(blockMatch[1]);
    const title = block.match(/title:\s*'([^']*)'/)?.[1] ?? '';
    const desc = block.match(/desc:\s*'([^']*)'/)?.[1] ?? '';
    const details = block.match(/details:\s*'([^']*)'/)?.[1] ?? '';
    const size = block.match(/size:\s*'([^']*)'/)?.[1] ?? '';
    const img = block.match(/img:\s*mediaUrl\('([^']*)'\)/)?.[1];
    const viewsBlock = block.match(/views:\s*\[([\s\S]*?)\n\s*\],/)?.[1] ?? '';
    const viewImages = [...viewsBlock.matchAll(/src:\s*mediaUrl\('([^']*)'\)/g)].map(
      (match) => match[1],
    );
    const viewCount = viewImages.length > 0 ? viewImages.length : 1;
    if (!img) continue;
    items.push({ id, title, desc, details, size, imagePath: img, viewCount, viewImages });
  }
  return items;
}

function parseArtworkCatalog(tsContent) {
  const catalog = {};
  const re = /(\d+):\s*\{([^}]*)\}/g;
  let match;
  while ((match = re.exec(tsContent)) !== null) {
    const id = Number(match[1]);
    const body = match[2];
    catalog[id] = {
      name: body.match(/name:\s*'([^']*)'/)?.[1],
      price: body.match(/price:\s*([\d_]+)/)
        ? Number(body.match(/price:\s*([\d_]+)/)[1].replace(/_/g, ''))
        : undefined,
      materials: body.match(/materials:\s*'([^']*)'/)?.[1],
      size: body.match(/size:\s*'([^']*)'/)?.[1],
    };
  }
  return catalog;
}

function getDisplayName(art, catalog) {
  return catalog[art.id]?.name ?? art.title;
}

function getMetaLine(art, catalog) {
  const materials = catalog[art.id]?.materials ?? (art.details !== '—' ? art.details : '');
  const size = catalog[art.id]?.size ?? (art.size !== '—' ? art.size : '');
  return [materials, size].filter(Boolean).join(' · ');
}

function formatPrice(rub) {
  return `${new Intl.NumberFormat('ru-RU').format(rub)} ₽`;
}

function getWorkDescription(art, catalog) {
  if (art.desc.trim()) return art.desc.trim();
  const meta = getMetaLine(art, catalog);
  const price = catalog[art.id]?.price;
  const parts = [meta, price != null ? formatPrice(price) : ''].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  return 'Оригинальная картина художника Дарьи Вичкуниной';
}

function buildWorkSharePath(workId, viewIndex = 0, multiView = false) {
  if (multiView || viewIndex > 0) return `/work/${workId}/${viewIndex + 1}/`;
  return `/work/${workId}/`;
}

function buildWorkHash(workId, viewIndex = 0, multiView = false) {
  if (multiView || viewIndex > 0) return `#work/${workId}/${viewIndex + 1}`;
  return `#work/${workId}`;
}

function buildWorkSharePage(art, catalog, viewIndex = 0) {
  const multiView = art.viewCount > 1;
  const name = getDisplayName(art, catalog);
  const title = `${name} — Дарья Вичкунина`;
  const description = getWorkDescription(art, catalog);
  const sharePath = buildWorkSharePath(art.id, viewIndex, multiView);
  const shareUrl = `${SITE_URL}${sharePath}`;
  const imagePath = art.viewImages?.[viewIndex] ?? art.imagePath;
  const imageUrl = absUrl(imagePath);
  const openHash = buildWorkHash(art.id, viewIndex, multiView);

  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeXml(title)}</title>
    <meta name="description" content="${escapeXml(description)}" />
    <link rel="canonical" href="${shareUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Дарья Вичкунина" />
    <meta property="og:title" content="${escapeXml(title)}" />
    <meta property="og:description" content="${escapeXml(description)}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:alt" content="${escapeXml(`${name} — картина, Дарья Вичкунина`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(title)}" />
    <meta name="twitter:description" content="${escapeXml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${escapeXml(`${name} — картина, Дарья Вичкунина`)}" />
    <meta http-equiv="refresh" content="0;url=/${openHash}" />
  </head>
  <body>
    <p><a href="/${openHash}">Открыть «${escapeXml(name)}» в галерее</a></p>
    <script>location.replace('/${openHash}')</script>
  </body>
</html>
`;
}

function writeWorkSharePages(artworks, catalog) {
  let count = 0;
  for (const art of artworks) {
    const multiView = art.viewCount > 1;
    if (multiView) {
      for (let viewIndex = 0; viewIndex < art.viewCount; viewIndex += 1) {
        const viewDir = path.join(DIST, 'work', String(art.id), String(viewIndex + 1));
        fs.mkdirSync(viewDir, { recursive: true });
        fs.writeFileSync(
          path.join(viewDir, 'index.html'),
          buildWorkSharePage(art, catalog, viewIndex),
          'utf8',
        );
        count += 1;
      }
      continue;
    }

    const baseDir = path.join(DIST, 'work', String(art.id));
    fs.mkdirSync(baseDir, { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'index.html'),
      buildWorkSharePage(art, catalog, 0),
      'utf8',
    );
    count += 1;
  }
  return count;
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

function buildSitemap(artworks, koshmariki, catalog) {
  const today = new Date().toISOString().slice(0, 10);
  const imageTags = [...artworks, ...koshmariki]
    .map(
      (img) => `    <image:image>
      <image:loc>${absUrl(img.imagePath)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`,
    )
    .join('\n');

  const workUrls = artworks
    .map((art) => {
      const name = getDisplayName(art, catalog);
      const multiView = art.viewCount > 1;
      const sharePath = buildWorkSharePath(art.id, 0, multiView);
      return `  <url>
    <loc>${SITE_URL}${sharePath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${absUrl(art.imagePath)}</image:loc>
      <image:title>${escapeXml(name)}</image:title>
    </image:image>
  </url>`;
    })
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
${workUrls}
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
  const catalogTs = fs.readFileSync(path.join(ROOT, 'src/config/artworkCatalog.ts'), 'utf8');
  const koshmarikiTs = fs.readFileSync(path.join(ROOT, 'src/data/koshmariki.ts'), 'utf8');
  const catalog = parseArtworkCatalog(catalogTs);
  const artworksWithIds = parseArtworksWithIds(artworksTs);
  const artworks = parseArtworks(artworksTs);
  const koshmariki = parseSimpleItems(koshmarikiTs);
  const allImages = [...artworks, ...koshmariki];

  const jsonLd = buildJsonLd(artworks, koshmariki);
  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(artworks, koshmariki, catalog), 'utf8');

  const sharePages = writeWorkSharePages(artworksWithIds, catalog);

  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  if (!html.includes('application/ld+json')) {
    html = html.replace('</head>', `  ${jsonLdScript}\n  </head>`);
  }

  if (!html.includes('<noscript>')) {
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${buildNoscript(artworks)}`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');

  console.log(
    `SEO: sitemap.xml (${allImages.length} images, ${artworksWithIds.length} work URLs), ${sharePages} share pages, JSON-LD, noscript → dist/`,
  );
}

main();
