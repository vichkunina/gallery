export type StickerItem =
  | {
      kind: 'text';
      text: string;
      size?: 'sm' | 'md' | 'lg';
      rotate?: number;
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    }
  | {
      kind: 'img';
      src: string;
      width: number;
      rotate?: number;
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    }
  | {
      kind: 'marker';
      color: 'black' | 'blue' | 'red' | 'yellow';
      width: string;
      rotate?: number;
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    }
  | {
      kind: 'circle';
      color: 'black' | 'blue' | 'red';
      width: string;
      height: string;
      rotate?: number;
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    }
  | {
      kind: 'line';
      src: string;
      width: string;
      rotate?: number;
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };

const decor = (name: string) => `/images/decor/${name}`;

/** Stickers scoped to decorative zones — never on text blocks */
export const stickerZones = {
  heroVisual: [
    {
      kind: 'line',
      src: decor('line-organic-1.png'),
      width: '90px',
      rotate: -8,
      bottom: '0',
      right: '0',
    },
  ],
  aboutTitle: [
    {
      kind: 'marker',
      color: 'yellow',
      width: '7.5rem',
      rotate: 0.5,
      top: '100%',
      left: '0',
    },
  ],
  galleryGrid: [
    {
      kind: 'circle',
      color: 'blue',
      width: '4rem',
      height: '2.4rem',
      rotate: -4,
      bottom: '12%',
      right: '0',
    },
    {
      kind: 'marker',
      color: 'red',
      width: '6rem',
      rotate: 2,
      bottom: '0',
      right: '18%',
    },
  ],
  koshmarikiGrid: [
    {
      kind: 'text',
      text: 'моя любимая ♥',
      size: 'md',
      rotate: 5,
      top: '0',
      right: '0',
    },
    {
      kind: 'text',
      text: 'не трогай',
      size: 'sm',
      rotate: -6,
      top: '18%',
      left: '0',
    },
    {
      kind: 'img',
      src: decor('mini-cat.png'),
      width: 52,
      bottom: '0',
      left: '0',
    },
  ],
  contactTitle: [
    {
      kind: 'marker',
      color: 'blue',
      width: '8rem',
      rotate: -0.8,
      top: '100%',
      left: '0',
    },
  ],
  contactOrder: [
    {
      kind: 'text',
      text: 'made with love',
      size: 'md',
      rotate: 3,
      bottom: '0',
      left: '0',
    },
  ],
} as const satisfies Record<string, StickerItem[]>;
