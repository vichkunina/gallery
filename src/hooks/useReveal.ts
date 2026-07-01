import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseRevealResult<T extends HTMLElement> {
  ref: RefObject<T>;
  visible: boolean;
}

export function useReveal<T extends HTMLElement = HTMLElement>(
  threshold = 0.15,
): UseRevealResult<T> {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
