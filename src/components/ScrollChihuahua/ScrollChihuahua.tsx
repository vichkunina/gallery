import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useScrollChihuahua } from '../../hooks/useScrollChihuahua';
import './ScrollChihuahua.css';

export function ScrollChihuahua() {
  const reducedMotion = usePrefersReducedMotion();
  const { top, direction, running } = useScrollChihuahua(!reducedMotion);

  if (reducedMotion) return null;

  return (
    <div
      className={[
        'scroll-chi',
        running && 'scroll-chi--running',
        direction === 'up' && 'scroll-chi--up',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ top: `${top}px` }}
      aria-hidden="true"
    >
      <svg
        className="scroll-chi__dog"
        viewBox="0 0 64 48"
        width="64"
        height="48"
        role="img"
        aria-label=""
      >
        <ellipse className="scroll-chi__shadow" cx="32" cy="44" rx="18" ry="3" />
        <g className="scroll-chi__body-group">
          <ellipse cx="34" cy="24" rx="16" ry="11" fill="#d4a574" />
          <ellipse cx="34" cy="26" rx="12" ry="7" fill="#f5e0cc" />
          <circle cx="48" cy="18" r="10" fill="#d4a574" />
          <circle cx="49" cy="19" r="8" fill="#f5e0cc" />
          <ellipse cx="53" cy="20" rx="5" ry="4.5" fill="#f0d8c4" />
          <ellipse cx="54.5" cy="21" rx="1.2" ry="0.8" fill="#e8a0a0" opacity="0.55" />
          <circle cx="51.2" cy="16.5" r="3.2" fill="#1a1a1a" />
          <circle cx="51.2" cy="16.5" r="2.1" fill="#2d2d2d" />
          <circle cx="52.3" cy="15.2" r="1.15" fill="#fff" />
          <circle cx="50.4" cy="17.1" r="0.45" fill="#fff" opacity="0.7" />
          <circle cx="55.8" cy="16.8" r="3" fill="#1a1a1a" />
          <circle cx="55.8" cy="16.8" r="1.95" fill="#2d2d2d" />
          <circle cx="56.8" cy="15.6" r="1" fill="#fff" />
          <circle cx="55.1" cy="17.4" r="0.4" fill="#fff" opacity="0.7" />
          <path
            d="M52.5 22.2 Q54.5 23.8 56.8 22.4"
            stroke="#c98585"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="54.8" cy="21.6" rx="1.1" ry="0.75" fill="#1a1a1a" opacity="0.85" />
          <path
            className="scroll-chi__ear scroll-chi__ear--1"
            d="M44 9 Q41 0 49 5 Q47 12 44 9"
            fill="#c48850"
          />
          <path
            className="scroll-chi__ear scroll-chi__ear--2"
            d="M51 8 Q54 -1 58 6 Q55 12 51 8"
            fill="#c48850"
          />
          <ellipse cx="46.5" cy="11.5" rx="2.2" ry="3.5" fill="#f0c8b0" opacity="0.65" />
          <ellipse cx="56" cy="11" rx="2" ry="3.2" fill="#f0c8b0" opacity="0.65" />
          <path className="scroll-chi__tail" d="M20 24 Q6 20 8 29 Q12 31 20 27" fill="#c48850" />
        </g>
        <g className="scroll-chi__legs">
          <rect className="scroll-chi__leg scroll-chi__leg--1" x="26" y="30" width="4" height="10" rx="2" fill="#c48850" />
          <rect className="scroll-chi__leg scroll-chi__leg--2" x="34" y="30" width="4" height="10" rx="2" fill="#a8734a" />
          <rect className="scroll-chi__leg scroll-chi__leg--3" x="40" y="30" width="4" height="10" rx="2" fill="#c48850" />
          <rect className="scroll-chi__leg scroll-chi__leg--4" x="46" y="30" width="4" height="10" rx="2" fill="#a8734a" />
        </g>
      </svg>
      <span className="scroll-chi__label">Берта</span>
    </div>
  );
}
