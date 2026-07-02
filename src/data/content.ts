import type { SiteContent } from '../types';
import { mediaUrl } from '../config/media';

export const site: SiteContent = {
  galleryName: 'Дарья Вичкунина',
  artistName: 'Вичкунина Дарья',
  artistFirstName: 'Дарья',
  heroImage: mediaUrl('images/hero/portrait.png'),
  heroQuote:
    'Когда-то я стану известным художником, а сейчас можно посмотреть, как это происходит.',
  heroSubtitle: 'Художник · галерея картин · заказ на масле и акварели',
  bio: [
    'По будням я программист — пишу код и решаю задачи.',
    'А рисую с детства — просто для себя, для удовольствия. Пробую всё, но особенный кайф получаю с масла.',
    'Это помогает мне отдыхать, фантазировать — и в реальности быть ещё смелее. Здесь делюсь работами и процессом: если что-то откликнётся — можно купить готовую картину или заказать свою.',
  ],
  processTitle: 'Как заказать',
  processSteps: [
    {
      number: '01',
      title: 'Выберите работу',
      text: 'Напишите мне о картине из галереи или опишите идею для заказа.',
    },
    {
      number: '02',
      title: 'Обсудим детали',
      text: 'Размер, техника, сроки и стоимость — всё согласуем до начала работы.',
    },
    {
      number: '03',
      title: 'Получите картину',
      text: 'Доставка по России и миру.',
    },
  ],
  contacts: [
    { label: 'Канал', value: '@vichkunina_d', href: 'https://t.me/vichkunina_d' },
    { label: 'Личка', value: '@vichkunina', href: 'https://t.me/vichkunina' },
  ],
  contactNote: 'Отвечаю в течение 1–2 дней',
};
