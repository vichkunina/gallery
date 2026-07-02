const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE_URL as string | undefined;

/** URL for media in Object Storage / CDN (same origin in prod when base is unset). */
export function mediaUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  const base =
    MEDIA_BASE ??
    (import.meta.env.DEV ? 'https://galleryvic.website.yandexcloud.net' : '');
  if (!base) {
    return `/${normalized}`;
  }
  return `${base.replace(/\/$/, '')}/${normalized}`;
}
