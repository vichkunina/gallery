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
import type { Artwork, SectionId } from '../types';
import { getArtworkViews, hasMultipleViews } from '../utils/artworkViews';
import {
  isLegacyWorkHash,
  isWorkHash,
  parseWorkIdFromLocation,
  resolveWorkLocation,
  syncWorkUrl,
  navigateToSection,
} from '../utils/galleryUrl';
import { buildArtworkIndexById } from '../utils/validateArtworkIds';
import { useArtworkPageMeta } from '../hooks/useArtworkPageMeta';
import { getArtworkOpenParams } from '../utils/artworkAnalytics';
import { trackGoal } from '../utils/analytics';
import { useLightboxTime } from '../hooks/useLightboxTime';

interface GalleryContextValue {
  selected: Artwork | null;
  selectedIndex: number;
  total: number;
  viewIndex: number;
  select: (art: Artwork) => void;
  close: () => void;
  closeAndGoToSection: (sectionId: SectionId) => void;
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

  useArtworkPageMeta(selected, viewIndex);
  const { flushLightboxTime, resetLightboxTime } = useLightboxTime(selected);

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
      trackGoal('artwork_view', {
        work_id: artworks[selectedIndex]?.id,
        view: clamped + 1,
      });
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
      trackGoal('artwork_open', getArtworkOpenParams(art));
      if (wasClosed) openedViaPush.current = true;
    },
    [selectedIndex, syncUrl],
  );

  const close = useCallback(() => {
    flushLightboxTime(selected?.id);
    resetLightboxTime();
    trackGoal('artwork_close', {
      work_id: selected?.id,
    });
    setSelectedIndex(null);
    setViewIndexState(0);

    if (openedViaPush.current && parseWorkIdFromLocation(window.location) !== null) {
      openedViaPush.current = false;
      history.back();
      return;
    }

    syncUrl(null, 0, 'replace');
  }, [syncUrl, selected?.id, flushLightboxTime, resetLightboxTime]);

  const closeAndGoToSection = useCallback(
    (sectionId: SectionId) => {
      flushLightboxTime(selected?.id);
      resetLightboxTime();
      setSelectedIndex(null);
      setViewIndexState(0);
      openedViaPush.current = false;
      navigateToSection(sectionId);
    },
    [flushLightboxTime, resetLightboxTime, selected?.id],
  );

  const next = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null || index >= artworks.length - 1) return index;
      flushLightboxTime(artworks[index]?.id);
      const nextIndex = index + 1;
      setViewIndexState(0);
      syncUrl(nextIndex, 0, 'replace');
      trackGoal('artwork_nav', { direction: 'next', work_id: artworks[nextIndex]?.id });
      return nextIndex;
    });
  }, [syncUrl, flushLightboxTime]);

  const prev = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null || index <= 0) return index;
      flushLightboxTime(artworks[index]?.id);
      const prevIndex = index - 1;
      setViewIndexState(0);
      syncUrl(prevIndex, 0, 'replace');
      trackGoal('artwork_nav', { direction: 'prev', work_id: artworks[prevIndex]?.id });
      return prevIndex;
    });
  }, [syncUrl, flushLightboxTime]);

  useEffect(() => {
    const applyLocation = () => {
      const resolved = resolveWorkLocation(window.location);
      const workIndex = resolved ? resolveWorkIndex(resolved.workId) : null;
      const view =
        workIndex === null ? 0 : clampViewIndex(workIndex, resolved?.viewIndex ?? 0);
      setSelectedIndex(workIndex);
      setViewIndexState(view);
      if (workIndex === null) openedViaPush.current = false;

      if (
        resolved &&
        workIndex !== null &&
        (isLegacyWorkHash(window.location) || isWorkHash(window.location))
      ) {
        syncUrl(workIndex, view, 'replace');
      }
    };

    window.addEventListener('popstate', applyLocation);
    window.addEventListener('hashchange', applyLocation);
    applyLocation();
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
      closeAndGoToSection,
      next,
      prev,
      setViewIndex,
      hasNext: resolvedIndex >= 0 && resolvedIndex < artworks.length - 1,
      hasPrev: resolvedIndex > 0,
    }),
    [selected, resolvedIndex, viewIndex, select, close, closeAndGoToSection, next, prev, setViewIndex],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider');
  return ctx;
}
