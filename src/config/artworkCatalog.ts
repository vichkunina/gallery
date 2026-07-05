/**
 * Название, цена, материалы и размер по id работы.
 * Если поле не указано — для названия берётся title из artworks.ts,
 * для материалов/размера — поля details/size из artworks.ts.
 *
 * Добавьте price — работа автоматически станет «Можно купить».
 */
export interface ArtworkCatalogEntry {
  name?: string;
  price?: number;
  materials?: string;
  size?: string;
}

export const artworkCatalogById: Partial<Record<number, ArtworkCatalogEntry>> = {
  1: { name: 'Чайки', price: 3_000 },
  2: { name: 'Мама с Маруськой' },
  4: { name: 'Копия Айвазовского', price: 3_000, materials: 'гуашь' },
  6: { name: 'Томми Шелби', price: 30_000, materials: 'масло', size: '50×50 см' },
  7: { name: 'Морское дно', materials: 'масло', size: '30×40 см' },
  8: { name: 'Восхождение', price: 15_000, materials: 'масло', size: '50×50 см' },
  9: { name: 'Первый снег', materials: 'масло' },
  10: { name: 'Хоа-хоа-хоа-хоа-хааа', materials: 'масло', size: '30×40 см' },
  11: { name: 'Сосна', price: 4_000, materials: 'акварель' },
  12: { name: 'Майк Вазовский!', price: 2_000, materials: 'масло', size: '10×10 см' },
  13: { name: 'Третий лишний в Хогвартсе', price: 35_000, materials: 'масло', size: '50×40 см' },
  16: { name: 'Натюрморт', price: 1_500, materials: 'соус сепия' },
  17: { name: 'Натюрморт', materials: 'акрил' },
  18: { name: 'Планета Миллер', price: 50_000, materials: 'масло', size: '50×70 см' },
  19: { name: 'Обезьяна для Риты', materials: 'акварель' },
  20: { name: 'Ядовитый плющ', price: 5_000 },
  21: { name: 'Лимоны', materials: 'масло, холст', size: '50×40 см' },
  22: { name: 'Монстера', materials: 'масло', size: '30×40 см' },
  23: { name: 'Хоа-хоа-хоа №2', price: 3_000, materials: 'масло' },
  24: { name: 'Как падает звезда', price: 2_000, materials: 'масло', size: '10×10 см' },
  25: { name: 'Моя улица', materials: 'масло', size: '50×70 см' },
  26: { name: 'Снова дождь', price: 4_000, materials: 'масло', size: '30×40 см' },
  27: { name: 'Меня нарисовали мицелярной водой', materials: 'акварель' },
  28: { name: 'Ешь?', price: 3_000, materials: 'масло', size: '10×10 см' },
  29: { name: 'Перекус', materials: 'масло', size: '25×25 см' },
  30: { materials: 'масло', size: '10×10 см' },
  31: { name: 'Космос между нами', materials: 'масло' },
  32: { size: '10×10 см' },
  33: { name: 'В ожидании чуда', materials: 'масло' },
  35: { name: 'Туман рассеивается', materials: 'масло' },
  36: { name: 'Вода, которая за спиной у Ирины', materials: 'масло', size: '30×40 см' },
  37: { name: 'Чайка летиииит', price: 4_000, materials: 'масло', size: '30×40 см' },
  38: { name: 'Тишина', price: 4_000, materials: 'масло' },
  39: { name: 'В лесу', materials: 'масло', size: '40×50 см' },
  40: { name: 'Доедем', materials: 'масло', size: '30×40 см' },
  41: { name: 'Бабочка из Animal Crossing', materials: 'масло', size: '30×40 см' },
  42: { name: 'Где-то солнце', materials: 'масло', size: '30×40 см' },
  43: { name: 'Труп невесты', price: 2_000, materials: 'масло', size: '10×10 см' },
  44: { name: 'Белковый обед', materials: 'масло', size: '25×25 см' },
  45: { name: "You're my angel", price: 6_000, materials: 'масло', size: '20×15 см' },
};

export function formatArtworkPrice(rub: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(rub)} ₽`;
}
