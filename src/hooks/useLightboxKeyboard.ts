import { useEffect } from 'react';
import { useStableRef } from './useStableRef';

interface LightboxKeyboardHandlers {
  close: () => void;
  next: () => void;
  prev: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  viewNext?: () => void;
  viewPrev?: () => void;
  hasViewNext?: boolean;
  hasViewPrev?: boolean;
}

export function useLightboxKeyboard(isOpen: boolean, handlers: LightboxKeyboardHandlers): void {
  const handlersRef = useStableRef(handlers);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (event: KeyboardEvent) => {
      const {
        close,
        next,
        prev,
        hasNext = true,
        hasPrev = true,
        viewNext,
        viewPrev,
        hasViewNext = false,
        hasViewPrev = false,
      } = handlersRef.current;

      if (event.key === 'Escape') close();

      if (event.key === 'ArrowRight' && hasNext) next();
      if (event.key === 'ArrowLeft' && hasPrev) prev();

      if (event.key === 'ArrowDown' && hasViewNext && viewNext) {
        event.preventDefault();
        viewNext();
      }
      if (event.key === 'ArrowUp' && hasViewPrev && viewPrev) {
        event.preventDefault();
        viewPrev();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handlersRef]);
}
