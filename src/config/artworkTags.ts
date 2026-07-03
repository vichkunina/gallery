/**
 * Теги работ для будущей фильтрации в галерее.
 *
 * Пример:
 *   12: ['магнит', 'персонаж'],
 */
export const artworkTagsById: Partial<Record<number, string[]>> = {
  12: ['магнит'],
  24: ['магнит'],
  28: ['магнит'],
  30: ['магнит'],
  32: ['магнит'],
};

export function getArtworkTags(id: number): string[] {
  return artworkTagsById[id] ?? [];
}

export function getAllArtworkTags(): string[] {
  const tags = new Set<string>();
  for (const list of Object.values(artworkTagsById)) {
    list?.forEach((tag) => tags.add(tag));
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'ru'));
}

export function artworkHasTag(id: number, tag: string): boolean {
  return getArtworkTags(id).includes(tag);
}
