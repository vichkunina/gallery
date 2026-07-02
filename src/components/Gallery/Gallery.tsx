import { useCallback, useEffect, useRef, useState } from 'react';
import { artworks, categories } from '../../data/artworks';
import { stickerZones } from '../../data/stickers';
import { useGallery } from '../../context/GalleryContext';
import { useReveal } from '../../hooks/useReveal';
import { prefersReducedMotion } from '../../utils/motion';
import { artworkAlt } from '../../utils/seoAlt';
import type { CategoryFilter } from '../../types';
import { ArtImage } from '../ArtImage/ArtImage';
import { SectionLabel } from '../SectionLabel/SectionLabel';
import { StickerField } from '../Stickers/StickerField';
import './Gallery.css';

const INITIAL_VISIBLE = 9;

export function Gallery() {
  const { select } = useGallery();
  const { ref, visible: headVisible } = useReveal(0.12);
  const [filter, setFilter] = useState<CategoryFilter['id']>('all');
  const [filtering, setFiltering] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    cards.forEach((card) => observerRef.current?.observe(card));
  }, []);

  const applyFilter = useCallback(
    (next: CategoryFilter['id']) => {
      if (next === filter) return;

      if (prefersReducedMotion()) {
        setFilter(next);
        return;
      }

      const grid = gridRef.current;
      if (!grid) {
        setFilter(next);
        return;
      }

      const existing = grid.querySelectorAll('.gallery__card');
      existing.forEach((card, i) => {
        card.classList.add('gallery__card--leaving');
        (card as HTMLElement).style.transitionDelay = `${i * 0.03}s`;
      });

      setFiltering(true);
      setExpanded(false);
      setTimeout(() => {
        setFilter(next);
        setFiltering(false);
      }, existing.length ? 320 : 0);
    },
    [filter],
  );

  useEffect(() => {
    requestAnimationFrame(observeCards);
  }, [filter, expanded, observeCards]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const filtered =
    filter === 'all' ? artworks : artworks.filter((a) => a.category === filter);

  const hiddenCount = Math.max(0, filtered.length - INITIAL_VISIBLE);
  const showMore = !expanded && hiddenCount > 0;

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

        <div className="gallery__filters" role="group" aria-label="Фильтр по технике">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`gallery__filter${filter === cat.id ? ' gallery__filter--active' : ''}`}
              onClick={() => applyFilter(cat.id)}
              aria-pressed={filter === cat.id}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div
          className={`gallery__grid sticker-zone${filtering ? ' gallery__grid--filtering' : ''}${expanded ? ' gallery__grid--expanded' : ''}`}
          ref={gridRef}
        >
          <StickerField items={stickerZones.galleryGrid} />
          {filtered.map((art, index) => (
            <button
              key={art.id}
              type="button"
              className={`gallery__card${!expanded && index >= INITIAL_VISIBLE ? ' gallery__card--folded' : ''}`}
              style={{ transitionDelay: `${index * 0.08}s` }}
              onClick={() => select(art)}
              aria-label={art.title}
            >
              <div className="gallery__frame">
                <ArtImage src={art.img} alt={artworkAlt(art)} fit="contain" />
                <span className="gallery__view">Смотреть</span>
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

        {showMore && (
          <div className="gallery__more">
            <button
              type="button"
              className="gallery__more-btn"
              onClick={() => setExpanded(true)}
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
