import { useEffect, useState } from 'react';
import { site } from '../../data/content';
import { useActiveSection } from '../../hooks/useActiveSection';
import { trackGoal } from '../../utils/analytics';
import type { SectionId } from '../../types';
import './Header.css';

const NAV: { href: `#${SectionId}`; id: SectionId; label: string }[] = [
  { href: '#about', id: 'about', label: 'Обо мне' },
  { href: '#gallery', id: 'gallery', label: 'Работы' },
  { href: '#koshmariki', id: 'koshmariki', label: 'Кошмарики' },
];

export function Header() {
  const activeSection = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const headerClass = [
    'header',
    scrolled && 'header--scrolled',
    menuOpen && 'header--menu-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClass}>
      <div className="header__bar">
        <a href="#" className="header__logo" onClick={() => setMenuOpen(false)}>
          <span className="header__logo-name">{site.galleryName}</span>
        </a>

        <button
          type="button"
          className="header__burger"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="header-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="header__burger-line" />
        </button>
      </div>

      <nav className="header__nav" id="header-nav" aria-label="Основная навигация">
        <ul className="header__list">
          {NAV.map((item) => (
            <li key={item.id} className="header__item">
              <a
                href={item.href}
                className={`header__link${activeSection === item.id ? ' header__link--active' : ''}`}
                onClick={() => {
                  setMenuOpen(false);
                  trackGoal('nav_click', { section: item.id });
                }}
                aria-current={activeSection === item.id ? 'true' : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
