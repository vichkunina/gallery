# Artist Gallery

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
