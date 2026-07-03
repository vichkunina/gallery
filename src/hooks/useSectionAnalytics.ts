import { useEffect } from 'react';
import type { SectionId } from '../types';
import { trackGoal } from '../utils/analytics';

const SECTIONS: SectionId[] = ['about', 'gallery', 'koshmariki', 'contact'];
const seenSections = new Set<SectionId>();

export function useSectionAnalytics() {
  useEffect(() => {
    const elements = SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.4) return;

          const section = entry.target.id as SectionId;
          if (!SECTIONS.includes(section) || seenSections.has(section)) return;

          seenSections.add(section);
          trackGoal('section_view', { section });
        });
      },
      { threshold: [0.4, 0.6] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
