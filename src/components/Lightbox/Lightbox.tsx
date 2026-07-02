import { useEffect, useRef } from 'react';
import { useGallery } from '../../context/GalleryContext';
import { useLightboxKeyboard } from '../../hooks/useLightboxKeyboard';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { artworkAlt } from '../../utils/seoAlt';
import './Lightbox.css';

export function Lightbox() {
  const {
    selected,
    selectedIndex,
    total,
    close,
    next,
    prev,
    hasNext,
    hasPrev,
  } = useGallery();

  const isOpen = selected !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useLockBodyScroll(isOpen);
  useLightboxKeyboard(isOpen, { close, next, prev, hasNext, hasPrev });

  useEffect(() => {
    if (!isOpen) return undefined;

    prevFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();

    return () => {
      prevFocus.current?.focus();
    };
  }, [isOpen]);

  if (!selected) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={selected.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="lightbox__topbar">
        <span className="lightbox__counter">
          {selectedIndex + 1} / {total}
        </span>
        <button ref={closeRef} type="button" className="lightbox__close" onClick={close}>
          Закрыть ✕
        </button>
      </div>

      <div className="lightbox__inner">
        <div className="lightbox__img-col">
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={prev}
            disabled={!hasPrev}
            aria-label="Предыдущая работа"
          >
            ←
          </button>

          <div className="lightbox__img-wrap">
            <img
              key={selected.id}
              className="lightbox__img"
              src={selected.img}
              alt={artworkAlt(selected)}
            />
          </div>

          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={next}
            disabled={!hasNext}
            aria-label="Следующая работа"
          >
            →
          </button>
        </div>

        <div className="lightbox__info">
          <h3 className="lightbox__title">{selected.title}</h3>
          <p className="lightbox__desc">{selected.desc}</p>
          {(selected.details || selected.size !== '—') && (
            <p className="lightbox__meta">
              {[selected.size !== '—' ? selected.size : '', selected.details].filter(Boolean).join(' · ')}
            </p>
          )}
          {selected.available ? (
            <a href="#contact" className="lightbox__buy" onClick={close}>
              Написать о покупке →
            </a>
          ) : (
            <p className="lightbox__sold-note">Эта работа уже нашла дом</p>
          )}
        </div>
      </div>
    </div>
  );
}
