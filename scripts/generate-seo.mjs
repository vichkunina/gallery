#!/usr/bin/env node
/**
 * Post-build: sitemap.xml + JSON-LD injected into dist/index.html for crawlers.
 */
import fs from 'node:fs';
import { createServer, loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Load the actual typed catalogue used by React, rather than parsing source with regex.
const server = await createServer({ root: ROOT, mode: 'production',
  server: { middlewareMode: true, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true' },
});
let seo;
let homeHtml;
try {
  seo = await server.ssrLoadModule('/src/entry-seo.tsx');
  homeHtml = seo.renderHome();
} finally {
  await server.close();
}
const env = loadEnv('production', ROOT, 'VITE_');


const SITE_URL = 'https://vichkunina.art';
const SITE_TITLE = 'Дарья Вичкунина — художник | галерея картин, заказ картин';
const SITE_DESC =
  'Художник в Санкт-Петербурге: оригинальные картины маслом, акварелью и смешанной техникой. Купить готовую работу или заказать картину на заказ.';

function absUrl(relativePath) {
  const normalized = relativePath.replace(/^\//, '');
  return `${SITE_URL}/${normalized}`;
}

/** Compact sharing image; original photographs remain available on each work page. */
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

function getWorkDescription(art) {
  return seo.getArtworkSeoDescription(art);
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

function buildWorkSharePage(art, catalog, viewIndex = 0, spaAssets = { script: '', css: '' }, statusMap = {}) {
  const multiView = art.viewCount > 1;
  const name = getDisplayName(art, catalog);
  const title = seo.getArtworkSeoTitle(art);
  const description = getWorkDescription(art, catalog);
  const sharePath = buildWorkSharePath(art.id, viewIndex, multiView);
  const shareUrl = `${SITE_URL}${sharePath}`;
  const canonicalUrl = `${SITE_URL}${buildWorkSharePath(art.id, 0, multiView)}`;
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: 'Дарья Вичкунина', url: SITE_URL },
    buildVisualArtworkNode(art, catalog, statusMap),
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Галерея', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: canonicalUrl },
    ] },
  ] };
  const textHtml = seo.getArtworkText(art).map((text) => `<p>${escapeXml(text)}</p>`).join('');

  const imagePath = art.viewImages?.[viewIndex] ?? art.imagePath;
  const imageUrl = `https://storage.yandexcloud.net/galleryvic/${thumbPath(imagePath)}`;
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
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Дарья Вичкунина" />
    <meta property="og:title" content="${escapeXml(title)}" />
    <meta property="og:description" content="${escapeXml(description)}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:alt" content="${escapeXml(`${name} — картина, Дарья Вичкунина`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(title)}" />
    <meta name="twitter:description" content="${escapeXml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${escapeXml(`${name} — картина, Дарья Вичкунина`)}" />
    <script id="page-structured-data" type="application/ld+json">${safeJson(structuredData)}</script>
${assetTags}
  </head>
  <body>
    <div id="root">
      <article style="max-width: 60rem; margin: 2rem auto; padding: 1rem;">
        <h1>${escapeXml(name)}</h1>
        <p>${escapeXml(description)}</p>
        ${textHtml}
        <img src="${cardImage(imagePath)}" alt="${escapeXml(`${name} — картина, Дарья Вичкунина`)}" style="display: block; max-width: 100%; max-height: 70vh; width: auto; height: auto;" />
        <p><a href="${absUrl(imagePath)}" download>Скачать оригинал фотографии</a></p>
        <p>${getSaleStatus(art.id, statusMap, catalog) === 'for_sale'
          ? `<a href="${buyHref(art, catalog)}">Написать о покупке «${escapeXml(name)}»</a>`
          : '<a href="/order/">Обсудить свою картину</a>'}</p>
        <p><a href="${SITE_URL}/">Галерея Дарьи Вичкуниной</a> · <a href="/buy/">Картины в продаже</a></p>
      </article>
    </div>
  </body>
</html>
`;
}

function writeWorkSharePages(artworks, catalog, spaAssets, statusMap) {
  let count = 0;
  for (const art of artworks) {
    const multiView = art.viewCount > 1;
    if (multiView) {
      for (let viewIndex = 0; viewIndex < art.viewCount; viewIndex += 1) {
        const viewDir = path.join(DIST, 'work', String(art.id), String(viewIndex + 1));
        fs.mkdirSync(viewDir, { recursive: true });
        fs.writeFileSync(
          path.join(viewDir, 'index.html'),
          buildWorkSharePage(art, catalog, viewIndex, spaAssets, statusMap),
          'utf8',
        );
        count += 1;
      }
    }

    const baseDir = path.join(DIST, 'work', String(art.id));
    fs.mkdirSync(baseDir, { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, 'index.html'),
      buildWorkSharePage(art, catalog, 0, spaAssets, statusMap),
      'utf8',
    );
    count += 1;
  }
  return count;
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
      object-fit: contain;
      border-radius: 8px;
      background: #eee;
    }
    .seo__item h3 { margin: 0 0 0.25rem; font-size: 1rem; }
    .seo__item p { margin: 0; font-size: 0.88rem; }
    .seo__price { font-weight: 600; color: #1a1a1a; }
    .seo__footer { margin-top: 3rem; border-top: 1px solid #ddd; padding-top: 1rem; }
    .seo__series { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 2rem; }
    .seo__series figure { margin: 0; }
    .seo__series img { width: 100%; height: auto; border-radius: 8px; }
    .seo__series figcaption { margin: .5rem 0; }
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
    .map((block) => `<script type="application/ld+json">${safeJson(block)}</script>`)
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
    <meta property="og:image" content="https://storage.yandexcloud.net/galleryvic/og.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://storage.yandexcloud.net/galleryvic/og.jpg" />
    <style>${seoPageStyles()}</style>
    ${jsonLdScripts}
    ${analyticsTag()}
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
      <footer class="seo__footer"><p><a href="/koshmariki/">Кошмарики</a></p><p>Новые работы и процесс: <a href="https://t.me/vichkunina_d" data-goal="subscribe_intent">Telegram</a></p></footer>
    </main>
  </body>
</html>
`;
}

function buildOrderPageBody(artworks, catalog) {
  const faqHtml = ORDER_FAQS.map(
    (item) => `<dt>${escapeXml(item.question)}</dt><dd>${escapeXml(item.answer)}</dd>`,
  ).join('\n        ');

  return `
      <h1>Картина на заказ — художник в Санкт-Петербурге</h1>
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

      <h2>Что написать для начала</h2>
      <p>Расскажите, что хочется изобразить, какой размер подходит и есть ли желаемая дата. Можно приложить референс или ссылку на понравившуюся работу. Стоимость и срок согласуем после обсуждения идеи.</p>
      <h2>Работы из галереи</h2>
      <p>Примеры техник и форматов — для знакомства с моими работами.</p>
      ${artworkList(artworks.filter((art) => [48, 49, 46, 12].includes(art.id)), catalog)}
      <h2>Доставка</h2><p>Отправляю работы по России и миру. Перед покупкой обсудим город, способ отправки и стоимость доставки.</p>
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
      const imageUrl = cardImage(art.img, 0);
      return `        <li class="seo__item">
          <a href="${workUrl}"><img src="${imageUrl}" alt="${escapeXml(name)}" width="72" height="72" loading="lazy" /></a>
          <div>
            <h3><a href="${workUrl}">${escapeXml(name)}</a></h3>
            <p>${escapeXml(meta)}${meta ? ' · ' : ''}<span class="seo__price">${escapeXml(priceLabel)}</span></p>
          </div>
        </li>`;
    })
    .join('\n');

  return `
      <h1>Купить картину — оригиналы из галереи</h1>
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
      title: 'Картина на заказ — художник Санкт-Петербург | Дарья Вичкунина',
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
      bodyHtml: buildOrderPageBody(artworksWithIds, catalog),
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
  const imageTags = [...artworks.map((art) => ({ ...art, title: getDisplayName(art, catalog) })), ...koshmariki]
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
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${imageTags}
  </url>
  <url>
    <loc>${SITE_URL}/order/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/buy/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${workUrls}
${[...seo.collections.map((collection) => `/collections/${collection.slug}/`), '/koshmariki/'].map((url) => `  <url><loc>${SITE_URL}${url}</loc></url>`).join('\n')}
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

function safeJson(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
function imagePath(src) { return src.match(/(?:^|\/)(images\/[^?#]+)/)?.[1] ?? src.replace(/^\//, ''); }
function cardImage(src, size = 1) {
  return seo.mediaImageVariants('/' + imagePath(src))[size]?.src ?? absUrl(thumbPath(imagePath(src)));
}
function buyHref(art, catalog) {
  const text = `Здравствуйте! Интересует картина «${getDisplayName(art, catalog)}»: ${SITE_URL}${buildWorkSharePath(art.id, 0, art.viewCount > 1)}`;
  return `https://t.me/vichkunina?text=${encodeURIComponent(text)}`;
}
function artworkList(artworks, catalog) {
  return `<ul class="seo__list">${artworks.map((art) => `<li class="seo__item">
    <a href="${buildWorkSharePath(art.id, 0, art.viewCount > 1)}"><img src="${cardImage(art.img, 0)}" alt="${escapeXml(getDisplayName(art, catalog))}" width="72" height="72" loading="lazy" decoding="async"></a>
    <div><h3><a href="${buildWorkSharePath(art.id, 0, art.viewCount > 1)}">${escapeXml(getDisplayName(art, catalog))}</a></h3><p>${escapeXml(getWorkDescription(art))}</p></div>
  </li>`).join('')}</ul>`;
}
let cachedAnalyticsTag;
function analyticsTag() {
  if (cachedAnalyticsTag !== undefined) return cachedAnalyticsTag;
  const id = env.VITE_YANDEX_METRIKA_ID;
  if (!id || !/^\d+$/.test(id)) return cachedAnalyticsTag = '';
  const code = `(()=>{const id=${id};window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push([...arguments])};window.ym.l=Date.now();const s=document.createElement('script');s.async=true;s.src='https://mc.yandex.ru/metrika/tag.js?id='+id;document.head.appendChild(s);ym(id,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href')||'';const goal=a.dataset.goal||(href.startsWith('https://t.me/vichkunina_d')?'subscribe_intent':href.startsWith('https://t.me/vichkunina')?'buy_intent':null);if(goal)ym(id,'reachGoal',goal,{page:location.pathname,href});});})();`;
  const digest = createHash('sha256').update(code).digest('hex').slice(0,12);
  const rel = `assets/landing-analytics-${digest}.js`;
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(DIST, rel), code);
  return cachedAnalyticsTag = `<script defer src="/${rel}"></script>`;
}
function writeCollections(artworks, catalog) {
  for (const collection of seo.collections) {
    const selected = collection.ids.map((id) => artworks.find((art) => art.id === id));
    if (selected.some((art) => !art)) throw new Error(`Unknown artwork in ${collection.slug}`);
    const rel = `/collections/${collection.slug}/`;
    const body = `<h1>${escapeXml(collection.title)}</h1>${collection.paragraphs.map((text) => `<p>${escapeXml(text)}</p>`).join('')}
      ${artworkList(selected, catalog)}
      <p><a class="seo__cta" href="/buy/">Все картины в продаже</a> <a href="/order/">Обсудить свой заказ</a></p>`;
    const html = buildLandingPage({ title: `${collection.title} | Дарья Вичкунина`, description: collection.description,
      canonicalPath: rel, bodyHtml: body, jsonLdGraph: { '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: collection.title, description: collection.description, url: SITE_URL + rel,
        mainEntity: { '@type': 'ItemList', itemListElement: selected.map((art, index) => ({ '@type': 'ListItem', position: index + 1,
          name: getDisplayName(art, catalog), url: SITE_URL + buildWorkSharePath(art.id, 0, art.viewCount > 1) })) } } });
    const dir = path.join(DIST, rel);
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
  const collection = seo.koshmariki;
  const body = `<h1>Кошмарики — истории Берты</h1>${collection.description.map((text) => `<p>${escapeXml(text)}</p>`).join('')}
    <p><a class="seo__cta" href="https://t.me/vichkunina_d" data-goal="subscribe_intent">Следить за новыми историями</a></p>
    <div class="seo__series">${collection.items.map((item) => {
      const variants = seo.mediaImageVariants(item.img); const dimensions = variants[1];
      return `<figure><a href="${item.img}"><img src="${cardImage(item.img)}" srcset="${seo.mediaImageSrcSet(item.img) ?? ''}" sizes="(max-width: 540px) 90vw, 340px" ${dimensions ? `width="${dimensions.width}" height="${dimensions.height}"` : ''} alt="${escapeXml(item.title)}" loading="lazy" decoding="async"></a><figcaption>${escapeXml(item.title)}</figcaption><a href="${item.img}" download>Скачать оригинал</a></figure>`;
    }).join('')}</div>`;
  const html = buildLandingPage({ title: 'Кошмарики — авторская серия про собаку Берту | Дарья Вичкунина',
    description: collection.description[0], canonicalPath: '/koshmariki/', bodyHtml: body,
    jsonLdGraph: { '@context': 'https://schema.org', '@type': 'CreativeWorkSeries', name: collection.title,
      description: collection.description[0], url: SITE_URL + '/koshmariki/',
      creator: { '@type': 'Person', name: 'Дарья Вичкунина', url: SITE_URL },
      hasPart: collection.items.map((item) => ({ '@type': 'VisualArtwork', name: item.title, image: absUrl(imagePath(item.img)) })) } });
  fs.mkdirSync(path.join(DIST, 'koshmariki'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'koshmariki/index.html'), html);
  return seo.collections.length + 1;
}

function main() {
  const catalog = seo.artworkCatalogById;
  const statusMap = seo.artworkSaleStatusById;
  const artworksWithIds = seo.artworks.map((art) => ({ ...art,
    imagePath: imagePath(art.img),
    viewCount: art.views?.length || 1,
    viewImages: (art.views ?? [{ src: art.img }]).map((view) => imagePath(view.src)),
  }));
  const koshmariki = seo.koshmariki.items.map((item) => ({ ...item, imagePath: imagePath(item.img) }));
  const allImages = [...artworksWithIds, ...koshmariki];

  const jsonLd = buildJsonLd(artworksWithIds, koshmariki, catalog, statusMap);
  const jsonLdScript = `<script id="page-structured-data" type="application/ld+json">${safeJson(jsonLd)}</script>`;

  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const spaAssets = extractSpaAssets(html);

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(artworksWithIds, koshmariki, catalog), 'utf8');

  const sharePages = writeWorkSharePages(artworksWithIds, catalog, spaAssets, statusMap);
  const landingPages = writeLandingPages(artworksWithIds, catalog, statusMap) + writeCollections(artworksWithIds, catalog, statusMap);

  if (html.includes('application/ld+json')) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLdScript);
  } else {
    html = html.replace('</head>', `  ${jsonLdScript}\n  </head>`);
  }

  html = html.replace('<div id="root"></div>', `<div id="root" data-prerender="true">${homeHtml}</div>`);
  html = html.replace('</head>', `<style>
    #root[data-prerender] .reveal, #root[data-prerender] .gallery__card,
    #root[data-prerender] .hero__title, #root[data-prerender] .hero__subtitle,
    #root[data-prerender] .hero__quote, #root[data-prerender] .hero__actions,
    #root[data-prerender] .hero__social, #root[data-prerender] .hero__visual,
    #root[data-prerender] .about__title, #root[data-prerender] .about__bio-line,
    #root[data-prerender] .contact__title, #root[data-prerender] .contact__desc,
    #root[data-prerender] .contact__link, #root[data-prerender] .contact__order,
    #root[data-prerender] .contact__order-title, #root[data-prerender] .koshmariki__head,
    #root[data-prerender] .koshmariki__card, #root[data-prerender] .art-image__img { opacity: 1; transform: none; }
    #root[data-prerender] .art-image__skeleton { display: none; }
  </style><noscript><style>
    .gallery__card--folded { display: block !important; }
    .gallery__more, .gallery__filters, .header__burger { display: none !important; }
    .header__nav { position: static; visibility: visible; opacity: 1; transform: none; pointer-events: auto; padding: .5rem 1rem; }
    .header__list { flex-direction: row; flex-wrap: wrap; gap: .75rem; }
  </style></noscript></head>`);

  fs.writeFileSync(indexPath, html, 'utf8');

  const forSaleCount = getForSaleArtworks(artworksWithIds, statusMap, catalog).length;
  console.log(
    `SEO: sitemap.xml (${allImages.length} images, ${artworksWithIds.length} work URLs, ${landingPages} landing pages), ${sharePages} share pages, ${landingPages} landings (${forSaleCount} for sale), JSON-LD, prerender → dist/`,
  );
}

main();
