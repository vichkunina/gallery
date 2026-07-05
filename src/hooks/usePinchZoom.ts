import { useEffect, useRef, useState, type RefObject } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface PinchZoomOptions {
  enabled: boolean;
  resetKey: string;
}

function touchDistance(touches: TouchList): number {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

export function usePinchZoom(
  targetRef: RefObject<HTMLElement | null>,
  { enabled, resetKey }: PinchZoomOptions,
): { scale: number } {
  const [scale, setScale] = useState(1);
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    transformRef.current = { scale: 1, x: 0, y: 0 };
    setScale(1);
    const el = targetRef.current;
    if (el) {
      el.style.transform = '';
    }
  }, [resetKey, targetRef]);

  useEffect(() => {
    const el = targetRef.current;
    if (!enabled || !el) return undefined;

    let initialDistance = 0;
    let initialScale = 1;
    let panOrigin = { x: 0, y: 0 };
    let panBase = { x: 0, y: 0 };
    let pinching = false;
    let panning = false;

    const applyTransform = () => {
      const { scale: s, x, y } = transformRef.current;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    };

    const resetTransform = () => {
      transformRef.current = { scale: 1, x: 0, y: 0 };
      setScale(1);
      el.style.transform = '';
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinching = true;
        panning = false;
        initialDistance = touchDistance(event.touches);
        initialScale = transformRef.current.scale;
        return;
      }

      if (event.touches.length === 1 && transformRef.current.scale > 1) {
        panning = true;
        pinching = false;
        panOrigin = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        panBase = { x: transformRef.current.x, y: transformRef.current.y };
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (pinching && event.touches.length === 2) {
        const distance = touchDistance(event.touches);
        if (initialDistance <= 0) return;
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, initialScale * (distance / initialDistance)),
        );
        transformRef.current.scale = nextScale;
        setScale(nextScale);
        applyTransform();
        event.preventDefault();
        return;
      }

      if (panning && event.touches.length === 1 && transformRef.current.scale > 1) {
        const dx = event.touches[0].clientX - panOrigin.x;
        const dy = event.touches[0].clientY - panOrigin.y;
        transformRef.current.x = panBase.x + dx;
        transformRef.current.y = panBase.y + dy;
        applyTransform();
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return;
      pinching = false;
      panning = false;
      if (transformRef.current.scale <= 1.02) {
        resetTransform();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.style.transform = '';
    };
  }, [enabled, targetRef]);

  return { scale };
}
