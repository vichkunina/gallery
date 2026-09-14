import { SEO, SITE_URL } from '../config/seo';

export interface PageMeta {
  title: string;
  description: string;
  url: string;
  canonicalUrl?: string;
  structuredData?: object;
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
  structuredData: { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', name: SEO.title, url: SITE_URL },
    { '@type': 'Person', name: SEO.author, url: SITE_URL, sameAs: [SEO.telegram] },
  ] },
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
  let structured = document.getElementById('page-structured-data');
  if (!structured) {
    structured = document.createElement('script');
    structured.setAttribute('type', 'application/ld+json');
    structured.id = 'page-structured-data';
    document.head.appendChild(structured);
  }
  if (meta.structuredData) structured.textContent = JSON.stringify(meta.structuredData);
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
  setCanonical(meta.canonicalUrl ?? meta.url);
}

export function resetPageMeta() {
  applyPageMeta(DEFAULT_META);
}
