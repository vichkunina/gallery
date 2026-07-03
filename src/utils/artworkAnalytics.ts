import type { Artwork } from '../types';
import { artworkCatalogById } from '../config/artworkCatalog';
import { getArtworkSaleStatus } from '../config/artworkSaleStatus';
import {
  getArtworkDisplayName,
  getArtworkMaterials,
} from './artworkDisplay';

export function getArtworkOpenParams(art: Artwork) {
  const price = artworkCatalogById[art.id]?.price;
  const materials = getArtworkMaterials(art);

  return {
    work_id: art.id,
    name: getArtworkDisplayName(art),
    sale_status: getArtworkSaleStatus(art.id),
    price,
    materials,
  };
}
