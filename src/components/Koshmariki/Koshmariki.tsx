import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { koshmariki } from '../../data/koshmariki';
import { stickerZones } from '../../data/stickers';
import { useLightboxKeyboard } from '../../hooks/useLightboxKeyboard';
import { useLightboxPageLock } from '../../hooks/useLightboxPageLock';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { useReveal } from '../../hooks/useReveal';
import { mediaThumbUrl } from '../../config/media';
import type { KoshmarikiItem } from '../../types';
import { ArtImage } from '../ArtImage/ArtImage';
import { StickerField } from '../Stickers/StickerField';
import './Koshmariki.css';

export function Koshmariki() {
  const { ref, visible } = useReveal(0.12);
  const [selected, setSelected] = useState<KoshmarikiItem | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const items = koshmariki.items;
  const selectedIndex = selected ? items.findIndex((item) => item.id === selected.id) : -1;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < items.length - 1;
  const isOpen = selected !== null;

  const close = useCallback(() => setSelected(null), []);
  const next = useCallback(() => {
    if (hasNext) setSelected(items[selectedIndex + 1]);
  }, [hasNext, items, selectedIndex]);
  const prev = useCallback(() => {
    if (hasPrev) setSelected(items[selectedIndex - 1]);
  }, [hasPrev, items, selectedIndex]);

  useLightboxPageLock(isOpen);
  useLightboxKeyboard(isOpen, { close, next, prev, hasNext, hasPrev });
  useSwipeNavigation(stageRef, isOpen, {
    onSwipeLeft: hasNext ? next : undefined,
    onSwipeRight: hasPrev ? prev : undefined,
  });

  return (
    <section
      className={`koshmariki${visible ? ' koshmariki--visible' : ''}`}
      id="koshmariki"
      ref={ref}
    >
      <div className="koshmariki__inner">
        <header className="koshmariki__head">
          <div className="koshmariki__head-main">
            <h2 className="koshmariki__title">{koshmariki.title}</h2>
            <span className="koshmariki__count">{items.length} работ</span>
          </div>
          <p className="koshmariki__intro">{koshmariki.description[0]}</p>
        </header>

        <div className="koshmariki__grid sticker-zone">
          <StickerField items={stickerZones.koshmarikiGrid} />
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="koshmariki__card"
              style={{ transitionDelay: `${0.04 + index * 0.03}s` }}
              onClick={() => setSelected(item)}
              aria-label={item.title}
            >
              <div className="koshmariki__card-media">
                <ArtImage
                  src={mediaThumbUrl(item.img)}
                  alt={`${item.title} — серия Кошмарики, Дарья Вичкунина`}
                  loading={index < 4 ? 'eager' : 'lazy'}
                  fit="contain"
                />
                <span className="koshmariki__card-overlay">
                  <span className="koshmariki__card-title">{item.title}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected &&
        createPortal(
          <div
            className="koshmariki__lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div className="koshmariki__lightbox-top">
              <span className="koshmariki__lightbox-counter">
                {selectedIndex + 1} / {items.length}
              </span>
              <button type="button" className="koshmariki__lightbox-close" onClick={close}>
                Закрыть
              </button>
            </div>

            <button
              type="button"
              className="koshmariki__lightbox-nav koshmariki__lightbox-nav--prev"
              onClick={prev}
              disabled={!hasPrev}
              aria-label="Предыдущая"
            >
              ←
            </button>

            <div ref={stageRef} className="koshmariki__lightbox-stage">
              <img className="koshmariki__lightbox-img" src={selected.img} alt={selected.title} />
            </div>

            <button
              type="button"
              className="koshmariki__lightbox-nav koshmariki__lightbox-nav--next"
              onClick={next}
              disabled={!hasNext}
              aria-label="Следующая"
            >
              →
            </button>

            <p className="koshmariki__lightbox-title">{selected.title}</p>
          </div>,
          document.body,
        )}
    </section>
  );
}
