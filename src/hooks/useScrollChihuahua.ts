import { useEffect, useRef, useState } from 'react';

interface ScrollChihuahuaState {
  top: number;
  direction: 'down' | 'up';
  running: boolean;
}

const HEADER_OFFSET = 88;
const DOG_SIZE = 64;
const BOTTOM_PADDING = 24;
const IDLE_MS = 180;

export function useScrollChihuahua(enabled: boolean): ScrollChihuahuaState {
  const [state, setState] = useState<ScrollChihuahuaState>({
    top: HEADER_OFFSET,
    direction: 'down',
    running: false,
  });

  const lastScrollY = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      rafId.current = null;

      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = scrollY / maxScroll;
      const travel = window.innerHeight - DOG_SIZE - HEADER_OFFSET - BOTTOM_PADDING;
      const top = HEADER_OFFSET + progress * Math.max(travel, 0);

      const delta = scrollY - lastScrollY.current;
      lastScrollY.current = scrollY;

      if (Math.abs(delta) > 1) {
        if (idleTimer.current) clearTimeout(idleTimer.current);

        setState({
          top,
          direction: delta > 0 ? 'down' : 'up',
          running: true,
        });

        idleTimer.current = setTimeout(() => {
          setState((prev) => ({ ...prev, running: false }));
        }, IDLE_MS);
      } else {
        setState((prev) => ({ ...prev, top }));
      }
    };

    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(update);
    };

    lastScrollY.current = window.scrollY;
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [enabled]);

  return state;
}
