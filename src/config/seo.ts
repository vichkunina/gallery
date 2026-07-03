/** Canonical public URL (www + HTTPS once certificate is active). */
export const SITE_URL = 'https://vichkunina.art';

export const SEO = {
  title: 'Дарья Вичкунина — художник | галерея картин, заказ картин',
  description:
    'Художник в Санкт-Петербурге: оригинальные картины маслом, акварелью и смешанной техникой. Купить готовую работу из галереи или заказать картину на заказ.',
  keywords:
    'художник, картины, галерея картин, заказ картин, картина на заказ, купить картину, живопись, масло, акварель, художник спб, санкт-петербург, портрет, пейзаж, Дарья Вичкунина',
  ogImage: `${SITE_URL}/images/hero/portrait.png`,
  locale: 'ru_RU',
  author: 'Дарья Вичкунина',
  telegram: 'https://t.me/vichkunina_d',
} as const;
