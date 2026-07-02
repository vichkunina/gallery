import type { Artwork } from '../types';

export function artworkAlt(art: Pick<Artwork, 'title' | 'details'>): string {
  const medium = art.details ? `, ${art.details}` : '';
  return `${art.title}${medium} — картина, художник Дарья Вичкунина`;
}
