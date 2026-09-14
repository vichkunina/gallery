import { artworkCatalogById } from '../config/artworkCatalog';
import { SITE_URL } from '../config/seo';
import { buildWorkSharePath } from './galleryUrl';
import type { Artwork } from '../types';
import { mediaThumbUrl } from '../config/media';
import { getArtworkDisplayName, getArtworkMetaLine, getArtworkPriceLabel } from './artworkDisplay';
import { getArtworkViews } from './artworkViews';
import { getArtworkSaleStatusLabel, getArtworkSaleStatus } from '../config/artworkSaleStatus';
import { artworkEditorial } from '../data/artworkEditorial';

export function getArtworkSeoTitle(art: Artwork): string {
  const name = getArtworkDisplayName(art);
  const subject = artworkEditorial[art.id]?.subject;
  return `${subject && !subject.toLowerCase().includes(name.toLowerCase()) ? `${name} — ${subject}` : subject ?? name} | Дарья Вичкунина`;
}

export function getArtworkText(art: Artwork): string[] {
  return [artworkEditorial[art.id]?.text, art.desc.trim()].filter((text): text is string => Boolean(text));
}

export function getArtworkSeoDescription(art: Artwork): string {
  const name = getArtworkDisplayName(art);
  const meta = getArtworkMetaLine(art);
  const price = getArtworkPriceLabel(art.id);
  const status = getArtworkSaleStatusLabel(art.id);
  return [`${name} — работа Дарьи Вичкуниной.`, meta, status, price].filter(Boolean).join(' · ');
}

export function getArtworkSeoImage(art: Artwork, viewIndex = 0): string {
  const views = getArtworkViews(art);
  const src = mediaThumbUrl(views[viewIndex]?.src ?? art.img);
  const imagePath = src.match(/(?:^|\/)(images\/[^?#]+)/)?.[1];
  return imagePath ? `https://storage.yandexcloud.net/galleryvic/${imagePath}` : src;
}

export function getArtworkStructuredData(art: Artwork) {
  const status = getArtworkSaleStatus(art.id);
  const url = SITE_URL + buildWorkSharePath(art.id, 0, getArtworkViews(art).length > 1);
  return {
    '@context': 'https://schema.org', '@type': 'VisualArtwork',
    name: getArtworkDisplayName(art), description: getArtworkSeoDescription(art),
    artMedium: artworkCatalogById[art.id]?.materials ?? (art.details !== '—' ? art.details : undefined),
    image: new URL(art.img, SITE_URL).href, url,
    creator: { '@type': 'Person', name: 'Дарья Вичкунина', url: SITE_URL },
    ...(status === 'for_sale' ? { offers: {
      '@type': 'Offer', price: artworkCatalogById[art.id]?.price, priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock', url,
    } } : {}),
  };
}
