import { useCallback } from 'react';

interface GalleryLightboxNavigationOptions {
  multipleViews: boolean;
  viewIndex: number;
  viewCount: number;
  setViewIndex: (index: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  next: () => void;
  prev: () => void;
}

export function useGalleryLightboxNavigation({
  multipleViews,
  viewIndex,
  viewCount,
  setViewIndex,
  hasNext,
  hasPrev,
  next,
  prev,
}: GalleryLightboxNavigationOptions) {
  const viewPrev = useCallback(() => {
    setViewIndex(Math.max(0, viewIndex - 1));
  }, [viewIndex, setViewIndex]);

  const viewNext = useCallback(() => {
    setViewIndex(Math.min(viewCount - 1, viewIndex + 1));
  }, [viewIndex, viewCount, setViewIndex]);

  const swipeLeft = useCallback(() => {
    if (multipleViews && viewIndex < viewCount - 1) {
      setViewIndex(viewIndex + 1);
      return;
    }
    if (hasNext) next();
  }, [multipleViews, viewIndex, viewCount, hasNext, next, setViewIndex]);

  const swipeRight = useCallback(() => {
    if (multipleViews && viewIndex > 0) {
      setViewIndex(viewIndex - 1);
      return;
    }
    if (hasPrev) prev();
  }, [multipleViews, viewIndex, hasPrev, prev, setViewIndex]);

  return {
    viewPrev,
    viewNext,
    swipeLeft,
    swipeRight,
    hasViewPrev: viewIndex > 0,
    hasViewNext: viewIndex < viewCount - 1,
  };
}
