import { artworkCatalogById } from './artworkCatalog';

/** Статус продажи работы в галерее. */
export type ArtworkSaleStatus = 'for_sale' | 'sold' | 'not_for_sale';

export const ARTWORK_SALE_STATUS_LABELS: Record<ArtworkSaleStatus, string> = {
  for_sale: 'Можно купить',
  sold: 'Продано',
  not_for_sale: 'Не продаётся',
};

/**
 * Явные статусы по id работы (перекрывают правило «есть цена → можно купить»).
 *
 * Пример в README: sold / not_for_sale перекрывают цену из каталога.
 */
export const artworkSaleStatusById: Partial<Record<number, ArtworkSaleStatus>> = {
  2: 'not_for_sale',
  9: 'not_for_sale',
  17: 'not_for_sale',
  19: 'not_for_sale',
  22: 'not_for_sale',
  27: 'not_for_sale',
  31: 'not_for_sale',
  32: 'not_for_sale',
  33: 'not_for_sale',
  35: 'not_for_sale',
  36: 'not_for_sale',
  41: 'not_for_sale',
  40: 'not_for_sale',
  1: 'sold',
  7: 'sold',
  10: 'sold',
  21: 'sold',
  29: 'sold',
  30: 'sold',
  39: 'sold',
  42: 'sold',
  44: 'not_for_sale',
};

const DEFAULT_STATUS: ArtworkSaleStatus = 'not_for_sale';

export function getArtworkSaleStatus(id: number): ArtworkSaleStatus {
  const explicit = artworkSaleStatusById[id];
  if (explicit) return explicit;
  if (artworkCatalogById[id]?.price != null) return 'for_sale';
  return DEFAULT_STATUS;
}

export function hasExplicitSaleStatus(id: number): boolean {
  if (Object.prototype.hasOwnProperty.call(artworkSaleStatusById, id)) return true;
  return artworkCatalogById[id]?.price != null;
}

export function getArtworkSaleStatusLabel(id: number): string {
  return ARTWORK_SALE_STATUS_LABELS[getArtworkSaleStatus(id)];
}
