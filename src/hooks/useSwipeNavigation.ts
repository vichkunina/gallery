import { useEffect, type RefObject } from 'react';
import { useStableRef } from './useStableRef';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const DEFAULT_THRESHOLD = 48;

export function useSwipeNavigation(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  handlers: SwipeHandlers,
  threshold = DEFAULT_THRESHOLD,
): void {
  const handlersRef = useStableRef(handlers);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.2) return;

      if (dx < 0) handlersRef.current.onSwipeLeft?.();
      else handlersRef.current.onSwipeRight?.();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, enabled, threshold, handlersRef]);
}
