# Artist Gallery

Сайт: **[vichkunina.art](https://vichkunina.art)**

Портфолио-художника уровня production: React + TypeScript, BEM, без SCSS.

## Стек

- **React 18** + **TypeScript** + **Vite**
- Чистый **CSS** с методологией **BEM**
- Без лишних зависимостей — только React

## Возможности

- Editorial-дизайн по мотивам Julia Morgan (navy + coral)
- Плавные анимации с учётом `prefers-reduced-motion`
- Lightbox с навигацией ← → и клавиатурой
- Shimmer-загрузка изображений
- Активная секция в навигации при скролле
- Film grain, секция «Как заказать»
- Доступность: skip-link, focus states, aria-атрибуты

## Быстрый старт

```bash
npm install
npm run dev
```

## Публикация

```bash
npm run build        # → dist/
npm run deploy:yc    # деплой на Yandex Object Storage
npm run upload:media # загрузка картинок в bucket (см. ниже)
```

**Netlify / Vercel:** build `npm run build`, publish `dist`

## Картинки (только в облаке)

Файлы **не хранятся в репозитории**. Они лежат в bucket `galleryvic` на Yandex Cloud и отдаются через CDN (`/images/...` на сайте).

Локально для загрузки новых файлов — папка `media/` (в `.gitignore`):

```bash
# Структура: media/images/gallery/..., media/images/hero/..., и т.д.
bash scripts/upload-media.sh
```

В dev-коде пути задаются через `mediaUrl('images/...')` в `src/data/` — URL собирается из bucket/CDN (см. `.env.development`).

## Настройка

| Файл | Содержимое |
|------|-----------|
| `src/data/content.ts` | Имя, био, контакты, процесс заказа |
| `src/data/artworks.ts` | Картины и цены |
| `src/styles/variables.css` | Цвета, шрифты, отступы |
| `src/config/media.ts` | Базовый URL медиа (prod: same-origin, dev: bucket) |

## Архитектура

```
src/
  context/GalleryContext   — состояние lightbox
  components/              — UI-блоки (BEM)
  hooks/                   — useReveal, useParallax, …
  data/                    — контент (легко менять)
  types/                   — TypeScript-типы
```

### Optimized images, static SEO and promotion

`npm run build` renders the home page to HTML and generates work pages, canonical aliases,
collections and a sitemap from the actual TypeScript catalogue. Client and build-time titles,
prices and availability share the same data. Run `npm run check:seo` and
`npm run check:behavior` after changes.

The full photographs in `media/` are unchanged. To add smaller card previews after importing
new work, run `npm run thumbs:responsive` (Python 3 + Pillow). This reads existing 960px
thumbnails and creates versioned 320/640px JPEG copies plus
`src/config/responsiveImages.json`. Commit the manifest with the corresponding site update.
Then publish with `npm run deploy:yc -- --previews-dir media`: only files under
`images/*/thumbs/responsive/` are uploaded as previews, never the original photographs.
Assets and previews are published before HTML, with the home page last.

Hashed previews, JavaScript, CSS and WOFF2 fonts have immutable one-year caching.
HTML is revalidated; purge CDN HTML caches after publication. Keep old hashed assets available
for visitors with old pages. Original image URLs and download links are preserved.

Fonts are served locally under `public/fonts/`, with OFL licenses. To update the same font
families deliberately, run `python3 scripts/vendor-fonts.py` and review the generated files.
Regular builds do not download fonts.

`npm run promotion` prepares Pinterest draft text, source images and UTM links under
`docs/promotion/`. It does not publish to a social account. The same folder contains Telegram
drafts, a four-week plan and a metrics template. No Pinterest link is displayed on the site.

`npm run seo:notify-yandex` submits the built sitemap's URLs to IndexNow after deployment.
Acceptance by IndexNow is not confirmation of indexing. Webmaster, Search Console, Pinterest
site verification and Metrika goal configuration still require the owner's account access.
