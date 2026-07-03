import type { Artwork } from '../types';
import { artworkCatalogById, formatArtworkPrice } from '../config/artworkCatalog';

export function getArtworkDisplayName(art: Artwork): string {
  return artworkCatalogById[art.id]?.name ?? art.title;
}

export function getArtworkPriceLabel(id: number): string | null {
  const price = artworkCatalogById[id]?.price;
  return price != null ? formatArtworkPrice(price) : null;
}

export function getArtworkMaterials(art: Artwork): string | null {
  const fromCatalog = artworkCatalogById[art.id]?.materials;
  if (fromCatalog) return fromCatalog;
  return art.details !== '—' ? art.details : null;
}

export function getArtworkSize(art: Artwork): string | null {
  const fromCatalog = artworkCatalogById[art.id]?.size;
  if (fromCatalog) return fromCatalog;
  return art.size !== '—' ? art.size : null;
}

export function getArtworkMetaLine(art: Artwork): string | null {
  const parts = [getArtworkMaterials(art), getArtworkSize(art)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}
