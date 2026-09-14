import type { Artwork } from '../types';
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

  return `${name}${metaPart} — картина, ${artist}`;
}
