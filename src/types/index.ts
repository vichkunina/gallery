export type ArtCategory = 'oil' | 'watercolor' | 'mixed';

export interface ArtworkView {
  src: string;
  label?: string;
}

export interface Artwork {
  id: number;
  title: string;
  category: ArtCategory;
  details: string;
  size: string;
  desc: string;
  img: string;
  /** Extra shots: details, texture, process. First entry can repeat cover `img`. */
  views?: ArtworkView[];
}

export interface CategoryFilter {
  id: 'all' | ArtCategory;
  label: string;
}

export interface Contact {
  label: string;
  value: string;
  href: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  text: string;
}

export interface OrderPriceTier {
  label: string;
  fromRub: number;
}

export interface OrderPricing {
  title: string;
  tiers: OrderPriceTier[];
  note: string;
  noteLink: string;
  telegramHref: string;
}

export interface SiteContent {
  galleryName: string;
  artistName: string;
  artistFirstName: string;
  heroImage: string;
  heroQuote: string;
  heroSubtitle: string;
  bio: string[];
  processTitle: string;
  processSteps: ProcessStep[];
  orderPricing: OrderPricing;
  contacts: Contact[];
}

export interface KoshmarikiItem {
  id: number;
  title: string;
  img: string;
}

export interface KoshmarikiCollection {
  title: string;
  description: string[];
  items: KoshmarikiItem[];
}

export type SectionId = 'about' | 'gallery' | 'koshmariki' | 'contact';
