import type { Artwork } from '../types';
import { getArtworkSaleStatus } from '../config/artworkSaleStatus';
import { artworkHasTag } from '../config/artworkTags';

export type GalleryFilterId = 'all' | 'magnet' | 'for_sale';

export interface GalleryFilterOption {
  id: GalleryFilterId;
  label: string;
}

export const GALLERY_FILTERS: GalleryFilterOption[] = [
  { id: 'all', label: 'Все' },
  { id: 'magnet', label: 'Магнит' },
  { id: 'for_sale', label: 'Можно купить' },
];

export function matchesGalleryFilter(art: Artwork, filter: GalleryFilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'magnet') return artworkHasTag(art.id, 'магнит');
  return getArtworkSaleStatus(art.id) === 'for_sale';
}

export function filterArtworks(artworks: Artwork[], filter: GalleryFilterId): Artwork[] {
  if (filter === 'all') return artworks;
  return artworks.filter((art) => matchesGalleryFilter(art, filter));
}
