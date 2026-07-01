import { useEffect } from 'react';

export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return undefined;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevPosition = style.position;
    const prevTop = style.top;
    const prevWidth = style.width;

    style.overflow = 'hidden';
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';

    return () => {
      style.overflow = prevOverflow;
      style.position = prevPosition;
      style.top = prevTop;
      style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
