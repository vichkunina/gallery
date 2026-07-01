import { useEffect } from 'react';

interface LightboxKeyboardHandlers {
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function useLightboxKeyboard(
  isOpen: boolean,
  { close, next, prev, hasNext = true, hasPrev = true }: LightboxKeyboardHandlers,
): void {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight' && hasNext) next();
      if (event.key === 'ArrowLeft' && hasPrev) prev();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close, next, prev, hasNext, hasPrev]);
}
