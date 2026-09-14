import { renderToString } from 'react-dom/server';
import App from './App';
export { artworks } from './data/artworks';
export { koshmariki } from './data/koshmariki';
export { site } from './data/content';
export { collections } from './data/collections';
export { artworkCatalogById } from './config/artworkCatalog';
export { artworkSaleStatusById } from './config/artworkSaleStatus';
export { getArtworkSeoTitle, getArtworkSeoDescription, getArtworkText } from './utils/artworkSeo';
export { mediaImageVariants, mediaImageSrcSet } from './config/media';
export function renderHome() { return renderToString(<App />); }
