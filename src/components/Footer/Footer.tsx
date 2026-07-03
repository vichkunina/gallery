import { site } from '../../data/content';
import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__copy">
          © {year} {site.artistName}
        </span>
        <button
          type="button"
          className="footer__top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Наверх ↑
        </button>
        <nav className="footer__links" aria-label="Полезные ссылки">
          <a href="/buy/">Купить картину</a>
          <a href="/order/">Заказать картину</a>
        </nav>
        <span className="footer__note">Сделано с любовью к искусству</span>
      </div>
    </footer>
  );
}
