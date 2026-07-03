import { useCallback, useEffect, useRef } from 'react';
import type { Artwork } from '../types';
import { trackGoal } from '../utils/analytics';

export function useLightboxTime(selected: Artwork | null) {
  const openedAt = useRef<number | null>(null);

  useEffect(() => {
    if (selected) {
      openedAt.current = Date.now();
      return;
    }
    openedAt.current = null;
  }, [selected?.id]);

  const flushLightboxTime = useCallback((workId: number | null | undefined) => {
    const startedAt = openedAt.current;
    if (!startedAt || workId == null) return;

    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    trackGoal('lightbox_time', { work_id: workId, seconds });
    openedAt.current = Date.now();
  }, []);

  const resetLightboxTime = useCallback(() => {
    openedAt.current = null;
  }, []);

  return { flushLightboxTime, resetLightboxTime };
}
