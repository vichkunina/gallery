import type { Artwork } from '../types';
import { getArtworkDisplayName } from './artworkDisplay';
import { buildWorkShareUrl } from './galleryUrl';
import { hasMultipleViews } from './artworkViews';

/** Opens a draft in the artist's chat; the visitor chooses whether to send it. */
export function artworkPurchaseUrl(art: Artwork): string {
  const text = `Здравствуйте! Интересует картина «${getArtworkDisplayName(art)}»: ${buildWorkShareUrl(art.id, 0, hasMultipleViews(art))}`;
  return `https://t.me/vichkunina?text=${encodeURIComponent(text)}`;
}
