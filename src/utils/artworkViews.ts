import type { Artwork, ArtworkView } from '../types';

export function getArtworkViews(art: Artwork): ArtworkView[] {
  if (art.views?.length) return art.views;
  return [{ src: art.img, label: 'Общий вид' }];
}

export function hasMultipleViews(art: Artwork): boolean {
  return getArtworkViews(art).length > 1;
}

export function artworkViewAlt(
  art: Pick<Artwork, 'title' | 'details'>,
  view: ArtworkView,
): string {
  const label = view.label ? `, ${view.label}` : '';
  const medium = art.details ? `, ${art.details}` : '';
  return `${art.title}${label}${medium} — картина, художник Дарья Вичкунина`;
}
