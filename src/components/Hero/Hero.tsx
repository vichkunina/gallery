import { useLayoutEffect, useState } from 'react';
import { site } from '../../data/content';
import { stickerZones } from '../../data/stickers';
import { ArtImage } from '../ArtImage/ArtImage';
import { StickerField } from '../Stickers/StickerField';
import { prefersReducedMotion } from '../../utils/motion';
import './Hero.css';

export function Hero() {
  const [ready, setReady] = useState(() => prefersReducedMotion());

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className={`hero${ready ? ' hero--ready' : ''}`}>
      <div className="hero__grid">
        <div className="hero__copy">
          <h1 className="hero__title">
            Привет, я&nbsp;{site.artistFirstName}
          </h1>
          <p className="hero__quote">{site.heroQuote}</p>

          <div className="hero__actions">
            <a className="hero__cta" href="#gallery">
              Смотреть работы
            </a>
            <a className="hero__cta hero__cta--ghost" href="#contact">
              Написать
            </a>
          </div>

          <ul className="hero__social">
            {site.contacts.map((contact) => (
              <li key={contact.href}>
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  {contact.value}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <figure className="hero__visual sticker-zone">
          <StickerField items={stickerZones.heroVisual} />
          <div className="hero__visual-inner">
            <ArtImage
              src={site.heroImage}
              alt="Дарья Вичкунина"
              fit="cover"
              priority
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
