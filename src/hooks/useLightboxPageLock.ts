import { useEffect } from 'react';
import { useLockBodyScroll } from './useLockBodyScroll';

export function useLightboxPageLock(isOpen: boolean): void {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.documentElement.classList.add('lightbox-open');
    return () => document.documentElement.classList.remove('lightbox-open');
  }, [isOpen]);
}
