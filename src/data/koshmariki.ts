import type { KoshmarikiCollection } from '../types';
import { mediaUrl } from '../config/media';

export const koshmariki: KoshmarikiCollection = {
  title: 'Кошмарики',
  description: [
    'Серия про мою Берту — зайку-собачку с большими амбициями. Юмор, уют и лёгкий хоррор: она заключает сделки с дьяволом, учится выть на луну и всё равно остаётся самой любимой.',
  ],
  items: [
    { id: 1, title: 'Спасение от весёлой ёлки', img: mediaUrl('images/koshmariki/01-739.jpg') },
    { id: 2, title: 'Сделка с дьяволом', img: mediaUrl('images/koshmariki/02-740.jpg') },
    { id: 3, title: 'Учимся выть на луну', img: mediaUrl('images/koshmariki/03-745.jpg') },
    { id: 4, title: 'Молчание пятачков', img: mediaUrl('images/koshmariki/04-750.jpg') },
    { id: 5, title: 'Палеолит: семейные ценности', img: mediaUrl('images/koshmariki/05-755.jpg') },
    { id: 6, title: 'Моя собака в Чужих руках', img: mediaUrl('images/koshmariki/06-785.jpg') },
    { id: 7, title: 'Возвращайся скорее домой', img: mediaUrl('images/koshmariki/07-809.jpg') },
    { id: 8, title: 'Хвост есть, амбиции есть', img: mediaUrl('images/koshmariki/08-815.jpg') },
    { id: 9, title: 'Хвост есть, амбиции есть (II)', img: mediaUrl('images/koshmariki/09-815.jpg') },
    { id: 10, title: 'Создание Берточки', img: mediaUrl('images/koshmariki/12-872.jpg') },
    { id: 11, title: 'Мы не одни', img: mediaUrl('images/koshmariki/13-985.jpg') },
    { id: 12, title: 'Собака завела человека', img: mediaUrl('images/koshmariki/14-1061.jpg') },
  ],
};
