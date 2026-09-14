import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ mode: 'production', server: { middlewareMode: true, hmr: false }, appType: 'custom', define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true' } });
try {
  const { artworks } = await server.ssrLoadModule('/src/data/artworks.ts');
  const seo = await server.ssrLoadModule('/src/utils/artworkSeo.ts');
  const { getArtworkPriceLabel } = await server.ssrLoadModule('/src/utils/artworkDisplay.ts');
  const { artworkPurchaseUrl } = await server.ssrLoadModule('/src/utils/artworkPurchase.ts');
  const { mediaImageVariants, mediaImageSrcSet } = await server.ssrLoadModule('/src/config/media.ts');
  const { parseWorkFromPathname, buildWorkSharePath } = await server.ssrLoadModule('/src/utils/galleryUrl.ts');
  const { filterArtworks } = await server.ssrLoadModule('/src/utils/galleryFilters.ts');
  assert.equal(buildWorkSharePath(48, 0, true), '/work/48/');
  assert.equal(buildWorkSharePath(48, 1, true), '/work/48/2/');
  assert.deepEqual(parseWorkFromPathname('/work/48/1/'), {workId:48,viewIndex:0});
  const byId = (id) => artworks.find((art) => art.id === id);
  assert.equal(getArtworkPriceLabel(24), null);
  assert.equal(getArtworkPriceLabel(49), null);
  assert.ok(filterArtworks(artworks, 'for_sale').some(art => art.id === 48));
  assert.ok(!filterArtworks(artworks, 'for_sale').some(art => [24,49].includes(art.id)));
  assert.ok(filterArtworks(artworks, 'magnet').some(art => art.id === 12));
  assert.match(seo.getArtworkSeoDescription(byId(49)), /Продано/);
  assert.match(seo.getArtworkSeoTitle(byId(45)), /You're my angel/);
  assert.equal(seo.getArtworkStructuredData(byId(24)).offers, undefined);
  assert.equal(seo.getArtworkStructuredData(byId(48)).offers.price, 30000);
  const draft = new URL(artworkPurchaseUrl(byId(48)));
  assert.equal(draft.hostname, 't.me'); assert.equal(draft.pathname, '/vichkunina');
  assert.match(draft.searchParams.get('text'), /Киллиан Мерфи №2/);
  assert.match(draft.searchParams.get('text'), /https:\/\/vichkunina.art\/work\/48\//);
  for (const art of artworks) {
    const variants = mediaImageVariants(art.img);
    assert.equal(variants.length, 3, art.img);
    assert.ok(variants[0].width <= variants[1].width);
    assert.match(mediaImageSrcSet(art.img), /\d+w/);
    assert.deepEqual(parseWorkFromPathname(buildWorkSharePath(art.id, 0, (art.views?.length ?? 1)>1)), {workId: art.id, viewIndex: 0});
    for (let i=0;i<(art.views?.length??1);i++) {
      assert.ok(seo.getArtworkSeoImage(art,i).startsWith('https://storage.yandexcloud.net/galleryvic/images/gallery/thumbs/'));
    }
  }
  console.log('Passed catalogue behavior: availability, purchase drafts, routes, structured data and responsive images for all 44 works.');
} finally { await server.close(); }
