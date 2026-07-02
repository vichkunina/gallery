import type { Artwork } from '../types';

export function assertUniqueArtworkIds(artworks: Artwork[]): void {
  const seen = new Map<number, string>();

  for (const art of artworks) {
    const prev = seen.get(art.id);
    if (prev !== undefined) {
      throw new Error(
        `Duplicate artwork id ${art.id}: «${prev}» and «${art.title}». IDs must be unique.`,
      );
    }
    seen.set(art.id, art.title);
  }
}

export function buildArtworkIndexById(artworks: Artwork[]): Map<number, number> {
  assertUniqueArtworkIds(artworks);
  return new Map(artworks.map((artwork, index) => [artwork.id, index]));
}
