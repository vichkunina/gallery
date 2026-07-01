import type { CSSProperties } from 'react';
import type { StickerItem } from '../../data/stickers';
import './StickerField.css';

interface StickerFieldProps {
  items: StickerItem[];
}

export function StickerField({ items }: StickerFieldProps) {
  return (
    <div className="sticker-field" aria-hidden="true">
      {items.map((item, index) => {
        const style = {
          top: item.top,
          right: item.right,
          bottom: item.bottom,
          left: item.left,
          ...(item.rotate !== undefined ? { '--sticker-rotate': `${item.rotate}deg` } : {}),
        } as CSSProperties;

        if (item.kind === 'text') {
          return (
            <span
              key={index}
              className={`sticker sticker--text sticker--text-${item.size ?? 'md'}`}
              style={style}
            >
              {item.text}
            </span>
          );
        }

        if (item.kind === 'img') {
          return (
            <img
              key={index}
              className="sticker sticker--img"
              style={{ ...style, width: `${item.width}px`, '--sticker-img-width': `${item.width}px` } as CSSProperties}
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          );
        }

        if (item.kind === 'marker') {
          return (
            <span
              key={index}
              className={`sticker sticker--marker sticker--marker-${item.color}`}
              style={{ ...style, width: item.width }}
            />
          );
        }

        if (item.kind === 'circle') {
          return (
            <span
              key={index}
              className={`sticker sticker--circle sticker--circle-${item.color}`}
              style={{
                ...style,
                width: item.width,
                height: item.height,
              }}
            />
          );
        }

        if (item.kind === 'line') {
          return (
            <img
              key={index}
              className="sticker sticker--line"
              style={{ ...style, width: item.width, '--sticker-line-width': item.width } as CSSProperties}
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
