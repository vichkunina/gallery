import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { artworks } from '../data/artworks';
import type { Artwork, SectionId } from '../types';
import { getArtworkViews, hasMultipleViews } from '../utils/artworkViews';
import {
  isLegacyWorkHash,
  isWorkHash,
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    const resolved = typeof window === 'undefined' ? null : resolveWorkLocation(window.location);
    return resolved ? resolveWorkIndex(resolved.workId) : null;
  });
  const [viewIndex, setViewIndexState] = useState(() => {
    const resolved = typeof window === 'undefined' ? null : resolveWorkLocation(window.location);
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
    // Always replace URL (not history.back): back() races with unlock and
    // often leaves mobile browsers scrolled to the top (visible in Webvisor).
    syncUrl(null, 0, 'replace');
  }, [syncUrl, selected?.id, flushLightboxTime, resetLightboxTime]);

  const closeAndGoToSection = useCallback(
    (sectionId: SectionId) => {
      flushLightboxTime(selected?.id);
      resetLightboxTime();
      setSelectedIndex(null);
      setViewIndexState(0);
      navigateToSection(sectionId);
    },
    [flushLightboxTime, resetLightboxTime, selected?.id],
  );

  const move = useCallback((direction: -1 | 1) => {
    if (selectedIndex === null) return;
    const index = selectedIndex + direction;
    if (index < 0 || index >= artworks.length) return;
    flushLightboxTime(artworks[selectedIndex]?.id);
    setSelectedIndex(index);
    setViewIndexState(0);
    syncUrl(index, 0, 'replace');
    trackGoal('artwork_nav', {
      direction: direction === 1 ? 'next' : 'prev',
      work_id: artworks[index]?.id,
    });
  }, [selectedIndex, syncUrl, flushLightboxTime]);

  const next = useCallback(() => move(1), [move]);
  const prev = useCallback(() => move(-1), [move]);

  useEffect(() => {
    const applyLocation = () => {
      const resolved = typeof window === 'undefined' ? null : resolveWorkLocation(window.location);
      const workIndex = resolved ? resolveWorkIndex(resolved.workId) : null;
      const view =
        workIndex === null ? 0 : clampViewIndex(workIndex, resolved?.viewIndex ?? 0);
      setSelectedIndex(workIndex);
      setViewIndexState(view);

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
