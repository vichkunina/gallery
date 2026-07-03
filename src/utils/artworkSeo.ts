import type { Artwork } from '../types';
import { SITE_URL } from '../config/seo';
import {
  getArtworkDisplayName,
  getArtworkMetaLine,
  getArtworkPriceLabel,
} from './artworkDisplay';
import { getArtworkViews } from './artworkViews';

export function getArtworkSeoTitle(art: Artwork): string {
  return `${getArtworkDisplayName(art)} — Дарья Вичкунина`;
}

export function getArtworkSeoDescription(art: Artwork): string {
  if (art.desc.trim()) return art.desc.trim();

  const meta = getArtworkMetaLine(art);
  const price = getArtworkPriceLabel(art.id);
  const parts = [meta, price].filter(Boolean);
  if (parts.length > 0) return parts.join(' · ');

  return 'Оригинальная картина художника Дарьи Вичкуниной';
}

export function getArtworkSeoImage(art: Artwork, viewIndex = 0): string {
  const views = getArtworkViews(art);
  const src = views[viewIndex]?.src ?? art.img;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${SITE_URL}${src.startsWith('/') ? src : `/${src}`}`;
}
