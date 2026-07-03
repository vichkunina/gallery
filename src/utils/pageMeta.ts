import { SEO, SITE_URL } from '../config/seo';

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
  type?: 'website' | 'article';
}

const DEFAULT_META: PageMeta = {
  title: SEO.title,
  description: SEO.description,
  url: `${SITE_URL}/`,
  image: 'https://vichkunina.art/og.jpg?v=3',
  imageAlt: 'Дарья Вичкунина — художник, портрет',
  type: 'website',
};

function setNamedMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setPropertyMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

export function applyPageMeta(meta: PageMeta) {
  document.title = meta.title;
  setNamedMeta('description', meta.description);
  setPropertyMeta('og:type', meta.type ?? 'website');
  setPropertyMeta('og:site_name', 'Дарья Вичкунина');
  setPropertyMeta('og:title', meta.title);
  setPropertyMeta('og:description', meta.description);
  setPropertyMeta('og:url', meta.url);
  setPropertyMeta('og:image', meta.image);
  setPropertyMeta('og:image:secure_url', meta.image);
  setPropertyMeta('og:image:alt', meta.imageAlt);
  setNamedMeta('twitter:card', 'summary_large_image');
  setNamedMeta('twitter:title', meta.title);
  setNamedMeta('twitter:description', meta.description);
  setNamedMeta('twitter:image', meta.image);
  setNamedMeta('twitter:image:alt', meta.imageAlt);
  setCanonical(meta.url);
}

export function resetPageMeta() {
  applyPageMeta(DEFAULT_META);
}
