import type { KoshmarikiCollection } from '../types';
import { mediaUrl } from '../config/media';

export const koshmariki: KoshmarikiCollection = {
  title: 'Кошмарики',
  description: [
    'Серия про мою Берту — зайку-собачку с большими амбициями. Юмор, уют и лёгкий хоррор: она заключает сделки с дьяволом, учится выть на луну и всё равно остаётся самой любимой.',
  ],
  items: [
    { id: 1, title: '1 января 2026', img: mediaUrl('images/koshmariki/08-2026-01-01.jpg') },
    { id: 2, title: '2 января 2026', img: mediaUrl('images/koshmariki/07-2026-01-02.jpg') },
    { id: 3, title: '3 января 2026', img: mediaUrl('images/koshmariki/06-2026-01-03.jpg') },
    { id: 4, title: '4 января 2026', img: mediaUrl('images/koshmariki/05-2026-01-04.jpg') },
    { id: 5, title: '9 января 2026', img: mediaUrl('images/koshmariki/04-2026-01-09.jpg') },
    { id: 6, title: '8 февраля 2026', img: mediaUrl('images/koshmariki/03-2026-02-08.jpg') },
    { id: 7, title: '15 февраля 2026', img: mediaUrl('images/koshmariki/02-2026-02-15.jpg') },
    { id: 8, title: '14 марта 2026', img: mediaUrl('images/koshmariki/10-2026-03-14.jpg') },
    { id: 9, title: '16 мая 2026', img: mediaUrl('images/koshmariki/09-2026-05-16.jpg') },
    { id: 10, title: '28 июня 2026', img: mediaUrl('images/koshmariki/01-2026-06-28.jpg') },
  ],
};
