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
npm run build   # → dist/
```

**Netlify / Vercel:** build `npm run build`, publish `dist`

## Настройка

| Файл | Содержимое |
|------|-----------|
| `src/data/content.ts` | Имя, био, контакты, процесс заказа |
| `src/data/artworks.ts` | Картины и цены |
| `src/styles/variables.css` | Цвета, шрифты, отступы |

Фото: `public/images/` → путь `/images/photo.jpg`

## Архитектура

```
src/
  context/GalleryContext   — состояние lightbox
  components/              — UI-блоки (BEM)
  hooks/                   — useReveal, useParallax, …
  data/                    — контент (легко менять)
  types/                   — TypeScript-типы
```
