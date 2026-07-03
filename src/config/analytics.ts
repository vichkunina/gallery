/** Yandex Metrika counter id — create at https://metrika.yandex.ru */
export const YANDEX_METRIKA_ID = (import.meta.env.VITE_YANDEX_METRIKA_ID ?? '').trim();

export const ANALYTICS_ENABLED =
  Boolean(YANDEX_METRIKA_ID) && import.meta.env.PROD;
