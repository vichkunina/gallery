import { useEffect, useRef } from 'react';

/**
 * Locks page scroll while a lightbox is open (position: fixed pattern).
 * Restores the previous scroll position on unlock — including after async
 * history.back() / popstate, which otherwise leaves mobile browsers at top.
 */
export function useLockBodyScroll(locked: boolean): void {
  const pendingRestore = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!locked) return undefined;
    // Finish the previous unlock before capturing styles for a new lock.
    pendingRestore.current?.();

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevPosition = style.position;
    const prevTop = style.top;
    const prevWidth = style.width;
    const prevHtmlOverflow = html.style.overflow;
    const prevScrollBehavior = html.style.scrollBehavior;
    const prevScrollRestoration = history.scrollRestoration;

    try {
      history.scrollRestoration = 'manual';
    } catch {
      /* ignore */
    }

    html.style.overflow = 'hidden';
    html.style.scrollBehavior = 'auto';
    style.overflow = 'hidden';
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';

    const restoreScroll = () => {
      window.scrollTo({ left: 0, top: scrollY, behavior: 'instant' });
    };

    return () => {
      style.overflow = prevOverflow;
      style.position = prevPosition;
      style.top = prevTop;
      style.width = prevWidth;
      html.style.overflow = prevHtmlOverflow;

      let frame: number | null = null;
      let active = true;
      const finish = () => {
        if (!active) return;
        active = false;
        if (frame !== null) cancelAnimationFrame(frame);
        html.style.scrollBehavior = prevScrollBehavior;
        try { history.scrollRestoration = prevScrollRestoration; } catch { /* ignore */ }
        if (pendingRestore.current === finish) pendingRestore.current = null;
      };
      pendingRestore.current = finish;
      restoreScroll();
      frame = requestAnimationFrame(() => {
        if (!active) return;
        restoreScroll();
        frame = requestAnimationFrame(() => {
          if (!active) return;
          restoreScroll();
          finish();
        });
      });
    };
  }, [locked]);

  useEffect(() => () => pendingRestore.current?.(), []);
}
