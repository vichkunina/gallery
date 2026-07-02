import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGallery } from '../../context/GalleryContext';
import { useGalleryLightboxNavigation } from '../../hooks/useGalleryLightboxNavigation';
import { useLightboxKeyboard } from '../../hooks/useLightboxKeyboard';
import { useLightboxPageLock } from '../../hooks/useLightboxPageLock';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { artworkViewAlt, getArtworkViews, hasMultipleViews } from '../../utils/artworkViews';
import { mediaThumbUrl } from '../../config/media';
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
    viewIndex,
    setViewIndex,
  } = useGallery();

  const views = useMemo(() => (selected ? getArtworkViews(selected) : []), [selected]);
  const currentView = views[viewIndex] ?? views[0];
  const multipleViews = selected ? hasMultipleViews(selected) : false;

  const isOpen = selected !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected || views.length === 0) return;
    if (viewIndex >= views.length) {
      setViewIndex(0);
    }
  }, [selected, views.length, viewIndex, setViewIndex]);

  const { viewPrev, viewNext, swipeLeft, swipeRight, hasViewPrev, hasViewNext } =
    useGalleryLightboxNavigation({
      multipleViews,
      viewIndex,
      viewCount: views.length,
      setViewIndex,
      hasNext,
      hasPrev,
      next,
      prev,
    });

  useSwipeNavigation(stageRef, isOpen, {
    onSwipeLeft: swipeLeft,
    onSwipeRight: swipeRight,
  });

  useLightboxPageLock(isOpen);
  useLightboxKeyboard(isOpen, {
    close,
    next,
    prev,
    hasNext,
    hasPrev,
    viewPrev: multipleViews ? viewPrev : undefined,
    viewNext: multipleViews ? viewNext : undefined,
    hasViewPrev: multipleViews && hasViewPrev,
    hasViewNext: multipleViews && hasViewNext,
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    prevFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();

    return () => {
      prevFocus.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!selected || !currentView) return null;

  return createPortal(
    <div
      className="lightbox lightbox--open"
      role="dialog"
      aria-modal="true"
      aria-label={selected.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="lightbox__topbar">
        <div className="lightbox__topbar-start">
          <span className="lightbox__counter">
            {selectedIndex + 1} / {total}
            {multipleViews && (
              <span className="lightbox__view-counter">
                {' '}
                · {viewIndex + 1}/{views.length}
              </span>
            )}
          </span>
          <h3 className="lightbox__title">{selected.title}</h3>
        </div>
        <button ref={closeRef} type="button" className="lightbox__close" onClick={close}>
          Закрыть ✕
        </button>
      </div>

      <button
        type="button"
        className="lightbox__nav-zone lightbox__nav-zone--prev"
        onClick={swipeRight}
        disabled={!hasPrev && !(multipleViews && hasViewPrev)}
        aria-label="Предыдущая"
      >
        <span className="lightbox__nav-icon" aria-hidden="true">
          ←
        </span>
      </button>

      <div className={`lightbox__viewer${multipleViews ? ' lightbox__viewer--album' : ''}`}>
        <div
          ref={stageRef}
          className="lightbox__stage"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <img
            key={`${selected.id}-${viewIndex}`}
            className="lightbox__img"
            src={currentView.src}
            alt={artworkViewAlt(selected, currentView)}
            decoding="sync"
          />
        </div>

        {multipleViews && (
          <div className="lightbox__filmstrip" role="tablist" aria-label="Фото работы">
            {views.map((view, index) => (
              <button
                key={`${view.src}-${index}`}
                type="button"
                role="tab"
                className={`lightbox__thumb${index === viewIndex ? ' lightbox__thumb--active' : ''}`}
                aria-selected={index === viewIndex}
                aria-label={view.label ?? `Фото ${index + 1}`}
                onClick={() => setViewIndex(index)}
              >
                <img src={mediaThumbUrl(view.src)} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="lightbox__nav-zone lightbox__nav-zone--next"
        onClick={swipeLeft}
        disabled={!hasNext && !(multipleViews && hasViewNext)}
        aria-label="Следующая"
      >
        <span className="lightbox__nav-icon" aria-hidden="true">
          →
        </span>
      </button>

      <div className="lightbox__footer">
        <div className="lightbox__footer-text">
          {currentView.label && multipleViews && (
            <p className="lightbox__view-label">{currentView.label}</p>
          )}
          {selected.desc ? <p className="lightbox__desc">{selected.desc}</p> : null}
          {(selected.details || selected.size !== '—') && (
            <p className="lightbox__meta">
              {[selected.size !== '—' ? selected.size : '', selected.details].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        {selected.available ? (
          <a href="#contact" className="lightbox__buy" onClick={close}>
            Написать о покупке →
          </a>
        ) : (
          <p className="lightbox__sold-note">Эта работа уже нашла дом</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
