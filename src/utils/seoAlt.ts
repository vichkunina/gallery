import type { Artwork } from '../types';
import { getArtworkSaleStatus } from '../config/artworkSaleStatus';
import {
  getArtworkDisplayName,
  getArtworkMaterials,
  getArtworkSize,
} from './artworkDisplay';

export function artworkAlt(art: Artwork): string {
  const name = getArtworkDisplayName(art);
  const meta = [getArtworkMaterials(art), getArtworkSize(art)].filter(Boolean).join(', ');
  const metaPart = meta ? `, ${meta}` : '';
  const artist = 'художник Дарья Вичкунина';

  if (getArtworkSaleStatus(art.id) === 'for_sale') {
    return `${name}${metaPart} — купить картину, ${artist}`;
  }

  return `${name}${metaPart} — картина, ${artist}`;
}
