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
  'Художник в Санкт-Петербурге: оригинальные картины маслом, акварелью и смешанной техникой. Купить готовую работу или заказать картину на заказ.';

function absUrl(relativePath) {
  const normalized = relativePath.replace(/^\//, '');
  return `${SITE_URL}/${normalized}`;
}

/** Compact JPEG for messengers (Telegram/WhatsApp reject 5MB+ full-size photos). */
function thumbPath(imagePath) {
  if (!imagePath) return imagePath;
  if (imagePath.includes('/thumbs/')) {
    return imagePath.replace(/\.(webp|png|jpe?g)$/i, '.jpg');
  }
  return imagePath
    .replace('images/gallery/', 'images/gallery/thumbs/')
    .replace('images/koshmariki/', 'images/koshmariki/thumbs/')
    .replace(/\.(webp|png|jpe?g)$/i, '.jpg');
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
  const objectBody = extractExportedObject(tsContent, 'artworkCatalogById');
  const re = /(\d+):\s*\{([^}]*)\}/g;
  let match;
  while ((match = re.exec(objectBody)) !== null) {
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

function extractSpaAssets(indexHtml) {
  const script = indexHtml.match(/<script type="module" src="([^"]+)"><\/script>/)?.[1] ?? '';
  const css = indexHtml.match(/<link rel="stylesheet" href="([^"]+)">/)?.[1] ?? '';
  return { script, css };
}

function buildWorkSharePage(art, catalog, viewIndex = 0, spaAssets = { script: '', css: '' }) {
  const multiView = art.viewCount > 1;
  const name = getDisplayName(art, catalog);
  const title = `${name} — Дарья Вичкунина`;
  const description = getWorkDescription(art, catalog);
  const sharePath = buildWorkSharePath(art.id, viewIndex, multiView);
  const shareUrl = `${SITE_URL}${sharePath}`;
  const imagePath = art.viewImages?.[viewIndex] ?? art.imagePath;
  const imageUrl = absUrl(thumbPath(imagePath));
  const assetTags = [
    spaAssets.css ? `    <link rel="stylesheet" href="${spaAssets.css}">` : '',
    spaAssets.script ? `    <script type="module" src="${spaAssets.script}"></script>` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeXml(title)}</title>
    <meta name="description" content="${escapeXml(description)}" />
    <link rel="canonical" href="${shareUrl}" />
    <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />
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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
${assetTags}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
}

function writeWorkSharePages(artworks, catalog, spaAssets) {
  let count = 0;
  for (const art of artworks) {
    const multiView = art.viewCount > 1;
    if (multiView) {
      for (let viewIndex = 0; viewIndex < art.viewCount; viewIndex += 1) {
        const viewDir = path.join(DIST, 'work', String(art.id), String(viewIndex + 1));
        fs.mkdirSync(viewDir, { recursive: true });
        fs.writeFileSync(
          path.join(viewDir, 'index.html'),
          buildWorkSharePage(art, catalog, viewIndex, spaAssets),
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
      buildWorkSharePage(art, catalog, 0, spaAssets),
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

function extractExportedObject(tsContent, exportName) {
  const marker = `export const ${exportName}`;
  const start = tsContent.indexOf(marker);
  if (start < 0) return '';
  const braceStart = tsContent.indexOf('{', start);
  if (braceStart < 0) return '';
  let depth = 0;
  for (let i = braceStart; i < tsContent.length; i += 1) {
    const char = tsContent[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return tsContent.slice(braceStart, i + 1);
      }
    }
  }
  return '';
}

function parseSaleStatus(tsContent) {
  const map = {};
  const objectBody = extractExportedObject(tsContent, 'artworkSaleStatusById');
  const re = /(\d+):\s*'(for_sale|sold|not_for_sale)'/g;
  let match;
  while ((match = re.exec(objectBody)) !== null) {
    map[Number(match[1])] = match[2];
  }
  return map;
}

function getSaleStatus(id, statusMap, catalog) {
  if (statusMap[id]) return statusMap[id];
  if (catalog[id]?.price != null) return 'for_sale';
  return 'not_for_sale';
}

function getForSaleArtworks(artworks, statusMap, catalog) {
  return artworks.filter((art) => getSaleStatus(art.id, statusMap, catalog) === 'for_sale');
}

const ORDER_FAQS = [
  {
    question: 'Сколько стоит заказ картины?',
    answer:
      'Ориентиры: магниты 10×10 см — от 2 000 ₽, холст 30×40 см — от 8 000 ₽, холст 50×40 см — от 12 000 ₽. Точная стоимость — после обсуждения идеи, размера и сроков.',
  },
  {
    question: 'Как заказать картину?',
    answer:
      'Напишите в Telegram (@vichkunina): опишите идею или пришлите референсы. Обсудим размер, технику (масло, акварель, гуашь), сроки и доставку.',
  },
  {
    question: 'В каких техниках можно заказать?',
    answer:
      'В основном масло на холсте, также акварель, гуашь и смешанная техника. Можно заказать портрет, пейзаж, натюрморт или работу по вашей идее.',
  },
  {
    question: 'Есть ли доставка?',
    answer: 'Да, отправляю картины по России и миру. Способ и стоимость доставки согласуем при заказе.',
  },
  {
    question: 'Можно купить готовую картину из галереи?',
    answer:
      'Да, на сайте есть работы в продаже — смотрите раздел «Купить картину» или фильтр «Можно купить» в галерее.',
  },
  {
    question: 'Где находится художник?',
    answer:
      'Дарья Вичкунина живёт и работает в Санкт-Петербурге. Заказ и покупка — онлайн, через Telegram.',
  },
];

function seoPageStyles() {
  return `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, system-ui, sans-serif;
      font-size: 1rem;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fafafa;
    }
    a { color: #1a1a1a; }
    .seo { max-width: 48rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
    .seo__nav { font-size: 0.85rem; margin-bottom: 2rem; }
    .seo__nav a { margin-right: 1rem; }
    h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1.15; margin: 0 0 1rem; }
    h2 { font-size: 1.15rem; margin: 2rem 0 0.75rem; }
    p { margin: 0 0 1rem; color: #444; }
    .seo__cta {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.65rem 1.2rem;
      border-radius: 999px;
      background: #1a1a1a;
      color: #fff !important;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .seo__list { list-style: none; padding: 0; margin: 1.5rem 0 0; }
    .seo__item {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 1rem;
      align-items: start;
      padding: 1rem 0;
      border-top: 1px solid #e8e8e8;
    }
    .seo__item img {
      width: 72px;
      height: 72px;
      object-fit: cover;
      border-radius: 8px;
      background: #eee;
    }
    .seo__item h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .seo__item p { margin: 0; font-size: 0.88rem; }
    .seo__price { font-weight: 600; color: #1a1a1a; }
    .seo__faq dt { font-weight: 600; margin-top: 1.25rem; }
    .seo__faq dd { margin: 0.35rem 0 0; color: #444; }
    .seo__steps {
      margin: 0 0 1rem;
      padding-left: 1.25rem;
      color: #444;
    }
    .seo__steps li { margin-bottom: 0.5rem; padding-left: 0.25rem; }
    .seo__steps li:last-child { margin-bottom: 0; }
  `;
}

function buildFaqNode(faqs, id = `${SITE_URL}/order/#faq`) {
  return {
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function buildFaqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    ...buildFaqNode(faqs),
  };
}

function buildLandingPage({ title, description, canonicalPath, jsonLdGraph, bodyHtml }) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const jsonLdBlocks = Array.isArray(jsonLdGraph) ? jsonLdGraph : [jsonLdGraph];
  const jsonLdScripts = jsonLdBlocks
    .map((block) => `<script type="application/ld+json">${JSON.stringify(block)}</script>`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeXml(title)}</title>
    <meta name="description" content="${escapeXml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Дарья Вичкунина" />
    <meta property="og:title" content="${escapeXml(title)}" />
    <meta property="og:description" content="${escapeXml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:image" content="${SITE_URL}/og.jpg?v=3" />
    <style>${seoPageStyles()}</style>
    ${jsonLdScripts}
  </head>
  <body>
    <main class="seo">
      <nav class="seo__nav" aria-label="Навигация">
        <a href="${SITE_URL}/">Главная</a>
        <a href="${SITE_URL}/#gallery">Галерея</a>
        <a href="${SITE_URL}/buy/">Купить</a>
        <a href="${SITE_URL}/order/">Заказать</a>
        <a href="${SITE_URL}/#contact">Контакты</a>
      </nav>
      ${bodyHtml}
    </main>
  </body>
</html>
`;
}

function buildOrderPageBody() {
  const faqHtml = ORDER_FAQS.map(
    (item) => `<dt>${escapeXml(item.question)}</dt><dd>${escapeXml(item.answer)}</dd>`,
  ).join('\n        ');

  return `
      <h1>Заказ картины на заказ — художник в Санкт-Петербурге</h1>
      <p>
        Дарья Вичкунина — художник из Санкт-Петербурга. Пишу картины маслом, акварелью и гуашью:
        портреты, пейзажи, натюрморты и работы по вашей идее. Обсудим размер, технику, сроки и стоимость
        до начала — без сюрпризов.
      </p>
      <p>
        <a class="seo__cta" href="https://t.me/vichkunina">Написать в Telegram</a>
      </p>

      <h2>Ориентиры по стоимости</h2>
      <p>Магниты 10×10 см — от 2 000 ₽ · Холст 30×40 см — от 8 000 ₽ · Холст 50×40 см — от 12 000 ₽</p>

      <h2>Как проходит заказ</h2>
      <ol class="seo__steps">
        <li>Вы описываете идею или выбираете референс</li>
        <li>Согласуем размер, технику и цену</li>
        <li>Получаете готовую картину с доставкой</li>
      </ol>

      <h2>Частые вопросы</h2>
      <dl class="seo__faq">
        ${faqHtml}
      </dl>

      <p>
        <a class="seo__cta" href="${SITE_URL}/buy/">Смотреть картины в продаже</a>
      </p>
  `;
}

function buildBuyPageBody(forSale, catalog) {
  const itemsHtml = forSale
    .map((art) => {
      const name = getDisplayName(art, catalog);
      const meta = getMetaLine(art, catalog);
      const price = catalog[art.id]?.price;
      const priceLabel = price != null ? formatPrice(price) : 'Цена по запросу';
      const workUrl = `${SITE_URL}${buildWorkSharePath(art.id, 0, art.viewCount > 1)}`;
      const imageUrl = absUrl(art.imagePath);
      return `        <li class="seo__item">
          <a href="${workUrl}"><img src="${imageUrl}" alt="${escapeXml(name)} — купить картину" width="72" height="72" loading="lazy" /></a>
          <div>
            <h3><a href="${workUrl}">${escapeXml(name)}</a></h3>
            <p>${escapeXml(meta)}${meta ? ' · ' : ''}<span class="seo__price">${escapeXml(priceLabel)}</span></p>
          </div>
        </li>`;
    })
    .join('\n');

  return `
      <h1>Купить картину — оригиналы маслом и акварелью</h1>
      <p>
        Готовые работы художника Дарьи Вичкуниной из Санкт-Петербурга. Ниже — картины, которые сейчас
        можно купить. Нажмите на работу, чтобы посмотреть детали и написать о покупке.
      </p>
      <p>
        <a class="seo__cta" href="https://t.me/vichkunina">Написать о покупке</a>
      </p>

      <h2>Картины в продаже (${forSale.length})</h2>
      <ul class="seo__list">
${itemsHtml}
      </ul>

      <p>
        Не нашли подходящую? <a href="${SITE_URL}/order/">Закажите картину</a> по своей идее.
      </p>
  `;
}

function writeLandingPages(artworksWithIds, catalog, statusMap) {
  const forSale = getForSaleArtworks(artworksWithIds, statusMap, catalog);
  const personId = `${SITE_URL}/#person`;

  const orderDir = path.join(DIST, 'order');
  fs.mkdirSync(orderDir, { recursive: true });
  fs.writeFileSync(
    path.join(orderDir, 'index.html'),
    buildLandingPage({
      title: 'Заказ картины на заказ — художник Санкт-Петербург | Дарья Вичкунина',
      description:
        'Заказать картину у художника Дарьи Вичкуниной: масло, акварель, гуашь. Санкт-Петербург, доставка по России. Цены от 2 000 ₽.',
      canonicalPath: '/order/',
      jsonLdGraph: [
        buildFaqJsonLd(ORDER_FAQS),
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Заказ картины на заказ',
          description:
            'Индивидуальный заказ картины: портрет, пейзаж, натюрморт. Масло, акварель, доставка по России.',
          provider: { '@id': personId },
          areaServed: [
            { '@type': 'City', name: 'Санкт-Петербург' },
            { '@type': 'Country', name: 'Россия' },
          ],
          url: `${SITE_URL}/order/`,
        },
      ],
      bodyHtml: buildOrderPageBody(),
    }),
    'utf8',
  );

  const buyDir = path.join(DIST, 'buy');
  fs.mkdirSync(buyDir, { recursive: true });
  fs.writeFileSync(
    path.join(buyDir, 'index.html'),
    buildLandingPage({
      title: 'Купить картину — оригиналы художника | Дарья Вичкунина',
      description:
        'Купить оригинальную картину маслом и акварелью. Готовые работы в продаже, цены, доставка по России. Художник Санкт-Петербург.',
      canonicalPath: '/buy/',
      jsonLdGraph: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Картины в продаже',
        description: 'Оригинальные картины художника Дарьи Вичкуниной, доступные для покупки.',
        url: `${SITE_URL}/buy/`,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: forSale.map((art, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}${buildWorkSharePath(art.id, 0, art.viewCount > 1)}`,
            name: getDisplayName(art, catalog),
          })),
        },
      },
      bodyHtml: buildBuyPageBody(forSale, catalog),
    }),
    'utf8',
  );

  return 2;
}

function buildVisualArtworkNode(art, catalog, statusMap) {
  const personId = `${SITE_URL}/#person`;
  const name = getDisplayName(art, catalog);
  const status = getSaleStatus(art.id, statusMap, catalog);
  const workUrl = `${SITE_URL}${buildWorkSharePath(art.id, 0, art.viewCount > 1)}`;
  const node = {
    '@type': 'VisualArtwork',
    name,
    description: getWorkDescription(art, catalog),
    artMedium: catalog[art.id]?.materials ?? (art.details !== '—' ? art.details : undefined),
    image: absUrl(art.imagePath),
    creator: { '@id': personId },
    url: workUrl,
  };

  const price = catalog[art.id]?.price;
  if (status === 'for_sale') {
    node.offers = {
      '@type': 'Offer',
      price: price != null ? String(price) : undefined,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: workUrl,
    };
  }

  return node;
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

function buildJsonLd(artworksWithIds, koshmariki, catalog, statusMap) {
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
      homeLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Санкт-Петербург',
          addressCountry: 'RU',
        },
      },
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
      hasPart: artworksWithIds.map((art) => buildVisualArtworkNode(art, catalog, statusMap)),
    },
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/#order`,
      name: 'Заказ картины',
      description:
        'Индивидуальный заказ картины: обсуждение идеи, размер, техника, сроки и доставка по России и миру.',
      provider: { '@id': personId },
      areaServed: [
        { '@type': 'City', name: 'Санкт-Петербург' },
        { '@type': 'Country', name: 'Россия' },
      ],
      url: `${SITE_URL}/order/`,
    },
    buildFaqNode(ORDER_FAQS),
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
  <url>
    <loc>${SITE_URL}/order/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/buy/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
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
      <p><a href="${SITE_URL}/buy/">Купить картину</a> · <a href="${SITE_URL}/order/">Заказать картину</a> · <a href="${SITE_URL}/#contact">Контакты</a> · <a href="https://t.me/vichkunina">@vichkunina</a></p>
    </article>
  </noscript>`;
}

function main() {
  const artworksTs = fs.readFileSync(path.join(ROOT, 'src/data/artworks.ts'), 'utf8');
  const catalogTs = fs.readFileSync(path.join(ROOT, 'src/config/artworkCatalog.ts'), 'utf8');
  const saleStatusTs = fs.readFileSync(path.join(ROOT, 'src/config/artworkSaleStatus.ts'), 'utf8');
  const koshmarikiTs = fs.readFileSync(path.join(ROOT, 'src/data/koshmariki.ts'), 'utf8');
  const catalog = parseArtworkCatalog(catalogTs);
  const statusMap = parseSaleStatus(saleStatusTs);
  const artworksWithIds = parseArtworksWithIds(artworksTs);
  const artworks = parseArtworks(artworksTs);
  const koshmariki = parseSimpleItems(koshmarikiTs);
  const allImages = [...artworks, ...koshmariki];

  const jsonLd = buildJsonLd(artworksWithIds, koshmariki, catalog, statusMap);
  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const spaAssets = extractSpaAssets(html);

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(artworksWithIds, koshmariki, catalog), 'utf8');

  const sharePages = writeWorkSharePages(artworksWithIds, catalog, spaAssets);
  const landingPages = writeLandingPages(artworksWithIds, catalog, statusMap);

  if (html.includes('application/ld+json')) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLdScript);
  } else {
    html = html.replace('</head>', `  ${jsonLdScript}\n  </head>`);
  }

  if (!html.includes('<noscript>')) {
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${buildNoscript(artworks)}`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');

  const forSaleCount = getForSaleArtworks(artworksWithIds, statusMap, catalog).length;
  console.log(
    `SEO: sitemap.xml (${allImages.length} images, ${artworksWithIds.length} work URLs, 2 landing pages), ${sharePages} share pages, ${landingPages} landings (${forSaleCount} for sale), JSON-LD, noscript → dist/`,
  );
}

main();
