import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { artworks } from '../data/artworks';
import type { Artwork } from '../types';

interface GalleryContextValue {
  selected: Artwork | null;
  selectedIndex: number;
  total: number;
  select: (art: Artwork) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

const artworkIndexById = new Map(artworks.map((artwork, index) => [artwork.id, index]));

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedIndex =
    selectedId === null ? -1 : (artworkIndexById.get(selectedId) ?? -1);

  const selected = selectedIndex >= 0 ? artworks[selectedIndex] : null;

  const select = useCallback((art: Artwork) => setSelectedId(art.id), []);
  const close = useCallback(() => setSelectedId(null), []);

  const next = useCallback(() => {
    setSelectedId((id) => {
      if (id === null) return id;
      const index = artworkIndexById.get(id);
      if (index === undefined || index >= artworks.length - 1) return id;
      return artworks[index + 1].id;
    });
  }, []);

  const prev = useCallback(() => {
    setSelectedId((id) => {
      if (id === null) return id;
      const index = artworkIndexById.get(id);
      if (index === undefined || index <= 0) return id;
      return artworks[index - 1].id;
    });
  }, []);

  const value = useMemo<GalleryContextValue>(
    () => ({
      selected,
      selectedIndex,
      total: artworks.length,
      select,
      close,
      next,
      prev,
      hasNext: selectedIndex >= 0 && selectedIndex < artworks.length - 1,
      hasPrev: selectedIndex > 0,
    }),
    [selected, selectedIndex, select, close, next, prev],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}
