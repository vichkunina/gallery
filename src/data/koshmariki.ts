import type { KoshmarikiCollection } from '../types';
import { mediaUrl } from '../config/media';

export const koshmariki: KoshmarikiCollection = {
  title: 'Кошмарики',
  description: [
    'Серия про мою Берту — зайку-собачку с большими амбициями. Юмор, уют и лёгкий хоррор: она заключает сделки с дьяволом, учится выть на луну и всё равно остаётся самой любимой.',
  ],
  items: [
    { id: 1, title: 'Спасение от весёлой ёлки', img: mediaUrl('images/koshmariki/08-2026-01-01.jpg') },
    { id: 2, title: 'Сделка с дьяволом — обмен души на печеньку', img: mediaUrl('images/koshmariki/07-2026-01-02.jpg') },
    { id: 3, title: 'Учимся выть на луну', img: mediaUrl('images/koshmariki/06-2026-01-03.jpg') },
    { id: 4, title: 'Молчание пятачков', img: mediaUrl('images/koshmariki/05-2026-01-04.jpg') },
    { id: 5, title: 'Палелолит: семейные ценности', img: mediaUrl('images/koshmariki/04-2026-01-09.jpg') },
    { id: 6, title: 'Моя собака в Чужих руках', img: mediaUrl('images/koshmariki/03-2026-02-08.jpg') },
    { id: 7, title: 'Возвращайся скорее домой, мы тебя ждем', img: mediaUrl('images/koshmariki/02-2026-02-15.jpg') },
    { id: 8, title: 'Создание Берточки', img: mediaUrl('images/koshmariki/10-2026-03-14.jpg') },
    { id: 9, title: 'Мы не одни', img: mediaUrl('images/koshmariki/09-2026-05-16.jpg') },
    { id: 10, title: 'Собака завела человека', img: mediaUrl('images/koshmariki/01-2026-06-28.jpg') },
  ],
};
