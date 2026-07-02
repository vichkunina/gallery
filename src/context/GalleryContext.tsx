import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { artworks } from '../data/artworks';
import type { Artwork } from '../types';
import { getArtworkViews, hasMultipleViews } from '../utils/artworkViews';
import {
  isLegacyWorkHash,
  parseWorkIdFromLocation,
  resolveWorkLocation,
  syncWorkUrl,
} from '../utils/galleryUrl';
import { buildArtworkIndexById } from '../utils/validateArtworkIds';

interface GalleryContextValue {
  selected: Artwork | null;
  selectedIndex: number;
  total: number;
  viewIndex: number;
  select: (art: Artwork) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  setViewIndex: (index: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

const artworkIndexById = buildArtworkIndexById(artworks);

function resolveWorkIndex(id: number | null): number | null {
  if (id === null) return null;
  const index = artworkIndexById.get(id);
  return index === undefined ? null : index;
}

function clampViewIndex(workIndex: number, view: number): number {
  const art = artworks[workIndex];
  if (!art) return 0;
  const maxIndex = getArtworkViews(art).length - 1;
  return Math.min(Math.max(0, view), maxIndex);
}

function isMultiViewWork(workIndex: number | null): boolean {
  if (workIndex === null) return false;
  const art = artworks[workIndex];
  return art ? hasMultipleViews(art) : false;
}

export function GalleryProvider({ children }: { children: ReactNode }) {
  const openedViaPush = useRef(false);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    const resolved = resolveWorkLocation(window.location);
    return resolved ? resolveWorkIndex(resolved.workId) : null;
  });
  const [viewIndex, setViewIndexState] = useState(() => {
    const resolved = resolveWorkLocation(window.location);
    if (!resolved) return 0;
    const workIndex = resolveWorkIndex(resolved.workId);
    if (workIndex === null) return 0;
    return clampViewIndex(workIndex, resolved.viewIndex);
  });

  const selected = selectedIndex === null ? null : (artworks[selectedIndex] ?? null);

  const syncUrl = useCallback(
    (workIndex: number | null, view: number, mode: 'push' | 'replace') => {
      const workId = workIndex === null ? null : artworks[workIndex]?.id ?? null;
      const clampedView = workIndex === null ? 0 : clampViewIndex(workIndex, view);
      syncWorkUrl(workId, clampedView, mode, isMultiViewWork(workIndex));
    },
    [],
  );

  const setViewIndex = useCallback(
    (index: number) => {
      if (selectedIndex === null) return;
      const clamped = clampViewIndex(selectedIndex, index);
      setViewIndexState(clamped);
      syncUrl(selectedIndex, clamped, 'replace');
    },
    [selectedIndex, syncUrl],
  );

  const select = useCallback(
    (art: Artwork) => {
      const index = artworks.findIndex((item) => item.id === art.id);
      if (index === -1) return;

      const wasClosed = selectedIndex === null;
      setSelectedIndex(index);
      setViewIndexState(0);
      syncUrl(index, 0, wasClosed ? 'push' : 'replace');
      if (wasClosed) openedViaPush.current = true;
    },
    [selectedIndex, syncUrl],
  );

  const close = useCallback(() => {
    setSelectedIndex(null);
    setViewIndexState(0);

    if (openedViaPush.current && parseWorkIdFromLocation(window.location) !== null) {
      openedViaPush.current = false;
      history.back();
      return;
    }

    syncUrl(null, 0, 'replace');
  }, [syncUrl]);

  const next = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null || index >= artworks.length - 1) return index;
      const nextIndex = index + 1;
      setViewIndexState(0);
      syncUrl(nextIndex, 0, 'replace');
      return nextIndex;
    });
  }, [syncUrl]);

  const prev = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null || index <= 0) return index;
      const prevIndex = index - 1;
      setViewIndexState(0);
      syncUrl(prevIndex, 0, 'replace');
      return prevIndex;
    });
  }, [syncUrl]);

  useEffect(() => {
    const applyLocation = () => {
      const resolved = resolveWorkLocation(window.location);
      const workIndex = resolved ? resolveWorkIndex(resolved.workId) : null;
      const view =
        workIndex === null ? 0 : clampViewIndex(workIndex, resolved?.viewIndex ?? 0);
      setSelectedIndex(workIndex);
      setViewIndexState(view);
      if (workIndex === null) openedViaPush.current = false;

      if (resolved && workIndex !== null && isLegacyWorkHash(window.location)) {
        syncUrl(workIndex, view, 'replace');
      }
    };

    window.addEventListener('popstate', applyLocation);
    window.addEventListener('hashchange', applyLocation);
    return () => {
      window.removeEventListener('popstate', applyLocation);
      window.removeEventListener('hashchange', applyLocation);
    };
  }, []);

  const resolvedIndex = selectedIndex ?? -1;

  const value = useMemo<GalleryContextValue>(
    () => ({
      selected,
      selectedIndex: resolvedIndex,
      total: artworks.length,
      viewIndex,
      select,
      close,
      next,
      prev,
      setViewIndex,
      hasNext: resolvedIndex >= 0 && resolvedIndex < artworks.length - 1,
      hasPrev: resolvedIndex > 0,
    }),
    [selected, resolvedIndex, viewIndex, select, close, next, prev, setViewIndex],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}
