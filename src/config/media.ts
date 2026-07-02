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

/** Card/thumbnail URL derived from a full gallery or koshmariki image URL. */
export function mediaThumbUrl(src: string): string {
  if (src.includes('/images/gallery/thumbs/') || src.includes('/images/koshmariki/thumbs/')) {
    return src;
  }
  if (src.includes('/images/gallery/')) {
    return src.replace('/images/gallery/', '/images/gallery/thumbs/').replace(/\.(webp|png|jpe?g)$/i, '.jpg');
  }
  if (src.includes('/images/koshmariki/')) {
    return src.replace('/images/koshmariki/', '/images/koshmariki/thumbs/').replace(/\.(webp|png|jpe?g)$/i, '.jpg');
  }
  return src;
}
