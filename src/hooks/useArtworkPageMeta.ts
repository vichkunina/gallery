import { useEffect } from 'react';
import type { Artwork } from '../types';
import { hasMultipleViews } from '../utils/artworkViews';
import {
  getArtworkSeoDescription,
  getArtworkSeoImage,
  getArtworkSeoTitle,
} from '../utils/artworkSeo';
import { getArtworkDisplayName } from '../utils/artworkDisplay';
import { buildWorkShareUrl } from '../utils/galleryUrl';
import { applyPageMeta, resetPageMeta } from '../utils/pageMeta';

export function useArtworkPageMeta(
  selected: Artwork | null,
  viewIndex: number,
) {
  useEffect(() => {
    if (!selected) {
      resetPageMeta();
      return;
    }

    const multiView = hasMultipleViews(selected);
    applyPageMeta({
      title: getArtworkSeoTitle(selected),
      description: getArtworkSeoDescription(selected),
      url: buildWorkShareUrl(selected.id, viewIndex, multiView),
      image: getArtworkSeoImage(selected, viewIndex),
      imageAlt: `${getArtworkDisplayName(selected)} — картина, Дарья Вичкунина`,
      type: 'article',
    });
  }, [selected, viewIndex]);
}
