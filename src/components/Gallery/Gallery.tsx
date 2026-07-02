import { useCallback, useEffect, useRef, useState } from 'react';
import { artworks } from '../../data/artworks';
import { stickerZones } from '../../data/stickers';
import { useGallery } from '../../context/GalleryContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReveal } from '../../hooks/useReveal';
import { artworkAlt } from '../../utils/seoAlt';
import { mediaThumbUrl } from '../../config/media';
import { hasMultipleViews } from '../../utils/artworkViews';
import { ArtImage } from '../ArtImage/ArtImage';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import { StickerField } from '../Stickers/StickerField';
import './Gallery.css';

const INITIAL_VISIBLE = 9;

export function Gallery() {
  const { select } = useGallery();
  const { ref, visible: headVisible } = useReveal(0.12);
  const [expanded, setExpanded] = useState(false);
  const [frameRatios, setFrameRatios] = useState<Record<number, number>>({});
  const [slideIndex, setSlideIndex] = useState(0);
  const isMobileSlider = useMediaQuery('(max-width: 540px)');
  const eagerCount = isMobileSlider ? 2 : INITIAL_VISIBLE;
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateSlideIndex = useCallback(() => {
    const el = gridRef.current;
    if (!el || !isMobileSlider) return;
    const first = el.querySelector<HTMLElement>('.gallery__card');
    if (!first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || '0') || 12;
    const stride = first.offsetWidth + gap;
    if (stride <= 0) return;
    const index = Math.round(el.scrollLeft / stride);
    setSlideIndex(Math.min(Math.max(0, index), artworks.length - 1));
  }, [isMobileSlider]);

  const observeCards = useCallback(() => {
    observerRef.current?.disconnect();
    const cards = gridRef.current?.querySelectorAll('.gallery__card');
    if (!cards?.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('gallery__card--visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 80px 0px' },
    );

    cards.forEach((card, index) => {
      if (card.classList.contains('gallery__card--visible')) return;
      if (expanded && index >= INITIAL_VISIBLE) {
        card.classList.add('gallery__card--visible');
        return;
      }
      observerRef.current?.observe(card);
    });
  }, [expanded]);

  const preloadHiddenImages = useCallback(() => {
    artworks.slice(eagerCount).forEach((art) => {
      const img = new Image();
      img.src = mediaThumbUrl(art.img);
    });
  }, [eagerCount]);

  useEffect(() => {
    if (!isMobileSlider) return undefined;
    setSlideIndex(0);
    gridRef.current?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
  }, [isMobileSlider]);

  useEffect(() => {
    if (!isMobileSlider) return undefined;
    const el = gridRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateSlideIndex, { passive: true });
    window.addEventListener('resize', updateSlideIndex);
    updateSlideIndex();
    return () => {
      el.removeEventListener('scroll', updateSlideIndex);
      window.removeEventListener('resize', updateSlideIndex);
    };
  }, [isMobileSlider, updateSlideIndex]);

  useEffect(() => {
    requestAnimationFrame(observeCards);
  }, [expanded, observeCards]);

  useEffect(() => {
    if (expanded) return undefined;
    const id = window.setTimeout(preloadHiddenImages, 600);
    return () => window.clearTimeout(id);
  }, [expanded, preloadHiddenImages]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const hiddenCount = Math.max(0, artworks.length - INITIAL_VISIBLE);
  const showMore = !isMobileSlider && !expanded && hiddenCount > 0;
  const mobileShowAll = isMobileSlider;

  const cardRevealDelay = (index: number) => {
    if (expanded && index >= INITIAL_VISIBLE) {
      return `${Math.min((index - INITIAL_VISIBLE) * 0.025, 0.3)}s`;
    }
    return `${Math.min(index, INITIAL_VISIBLE - 1) * 0.06}s`;
  };

  const expandGallery = useCallback(() => {
    const scrollY = window.scrollY;
    setExpanded(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    });
  }, []);

  return (
    <section className="gallery" id="gallery" ref={ref}>
      <div className="gallery__inner">
        <SectionLabel number="02" />

        <div className={`gallery__head${headVisible ? ' reveal--visible' : ' reveal'}`}>
          <h2 className="gallery__title">Галерея картин</h2>
          <p className="gallery__intro">
            Оригинальные картины маслом, акварелью и смешанной техникой. Можно купить
            готовую работу или{' '}
            <a className="gallery__intro-link" href="#contact">
              заказать картину
            </a>
            .
          </p>
        </div>

        <div
          className={`gallery__grid sticker-zone${expanded ? ' gallery__grid--expanded' : ''}${isMobileSlider ? ' gallery__grid--slider' : ''}`}
          ref={gridRef}
        >
          <StickerField items={stickerZones.galleryGrid} />
          {artworks.map((art, index) => (
            <button
              key={art.id}
              type="button"
              className={`gallery__card${!mobileShowAll && !expanded && index >= INITIAL_VISIBLE ? ' gallery__card--folded' : ''}${expanded && index >= INITIAL_VISIBLE ? ' gallery__card--revealed' : ''}${isMobileSlider ? ' gallery__card--visible' : ''}`}
              style={{ transitionDelay: cardRevealDelay(index) }}
              onClick={() => select(art)}
              aria-label={art.title}
            >
              <div
                className="gallery__frame"
                style={
                  frameRatios[art.id]
                    ? ({ '--frame-ratio': String(frameRatios[art.id]) } as React.CSSProperties)
                    : undefined
                }
              >
                <ArtImage
                  src={mediaThumbUrl(art.img)}
                  alt={artworkAlt(art)}
                  fit="contain"
                  loading={index < eagerCount ? 'eager' : 'lazy'}
                  priority={index === 0}
                  onDimensions={(width, height) => {
                    const ratio = width / height;
                    const clamped = Math.min(Math.max(ratio, 0.62), 1.55);
                    setFrameRatios((prev) =>
                      prev[art.id] === clamped ? prev : { ...prev, [art.id]: clamped },
                    );
                  }}
                />
                {hasMultipleViews(art) && (
                  <span className="gallery__photos" aria-hidden="true">
                    альбом
                  </span>
                )}
                {!art.available && <span className="gallery__sold">Продано</span>}
              </div>
              <div className="gallery__meta">
                <span className="gallery__name">{art.title}</span>
              </div>
              {(art.details || art.size !== '—') && (
                <p className="gallery__details">
                  {[art.details, art.size !== '—' ? art.size : ''].filter(Boolean).join(' · ')}
                </p>
              )}
              {art.desc && <p className="gallery__desc">{art.desc}</p>}
            </button>
          ))}
        </div>

        {isMobileSlider && artworks.length > 1 && (
          <div className="gallery__slider-ui">
            <span className="gallery__slider-count" aria-live="polite">
              {slideIndex + 1} / {artworks.length}
            </span>
            <div
              className="gallery__slider-progress"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={artworks.length}
              aria-valuenow={slideIndex + 1}
              aria-label="Позиция в галерее"
            >
              <span
                className="gallery__slider-progress-fill"
                style={{ width: `${((slideIndex + 1) / artworks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {showMore && (
          <div className="gallery__more">
            <button
              type="button"
              className="gallery__more-btn"
              onClick={expandGallery}
              onMouseEnter={preloadHiddenImages}
              onFocus={preloadHiddenImages}
            >
              Показать ещё
              <span className="gallery__more-count">{hiddenCount}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
