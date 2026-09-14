/** Generate reviewable publishing drafts from the same catalogue as the website. */
import fs from 'node:fs';
import { createServer } from 'vite';
const server = await createServer({ mode: 'production', server: { middlewareMode: true, hmr: false }, appType: 'custom', define: { 'import.meta.env.DEV':'false', 'import.meta.env.PROD':'true' } });
try {
  const { artworks } = await server.ssrLoadModule('/src/data/artworks.ts');
  const { getArtworkDisplayName, getArtworkMetaLine, getArtworkPriceLabel } = await server.ssrLoadModule('/src/utils/artworkDisplay.ts');
  const { getArtworkSaleStatusLabel } = await server.ssrLoadModule('/src/config/artworkSaleStatus.ts');
  const { buildWorkSharePath } = await server.ssrLoadModule('/src/utils/galleryUrl.ts');
  const base='https://vichkunina.art';
  const rows=[];
  for (const id of [48,47,46,45,6,13,18,12]) {
    const art=artworks.find((art)=>art.id===id);
    const name=getArtworkDisplayName(art);
    const views=(art.views?.length?art.views:[{src:art.img,label:'Общий вид'}]).slice(0,2);
    for (const [index,view] of views.entries()) {
      const destination=new URL(buildWorkSharePath(id,index,(art.views?.length??1)>1),base);
      destination.search=new URLSearchParams({utm_source:'pinterest',utm_medium:'social',utm_campaign:'gallery_autumn_2026',utm_content:`work_${id}_view_${index+1}`}).toString();
      rows.push([`${name}${index?' — ещё один ракурс':''}`, `${name}. ${getArtworkMetaLine(art)}. ${getArtworkSaleStatusLabel(id)}${getArtworkPriceLabel(id)?', '+getArtworkPriceLabel(id):''}. Автор — Дарья Вичкунина, Санкт-Петербург. Фотографии и сведения о работе — на сайте.`,new URL(view.src,base).href,destination.href]);
    }
  }
  const csv=(value)=>`"${String(value).replaceAll('"','""')}"`;
  fs.mkdirSync('docs/promotion',{recursive:true});
  fs.writeFileSync('docs/promotion/pinterest-drafts.csv','\uFEFF'+[['title','description','image_url','destination_url'],...rows].map(row=>row.map(csv).join(',')).join('\n')+'\n');
  fs.writeFileSync('docs/promotion/pinterest-drafts.md',`Материалы для профиля https://ru.pinterest.com/vichkunina/\n\nЧерновики, не опубликованы. CSV — таблица материалов, не обещание совместимости с импортом Pinterest. Проверить доступность и цены перед размещением. Полноразмерные фотографии указаны как источники; ссылка ведёт на соответствующую работу.\n\n`+rows.map((row,index)=>`**${index+1}. ${row[0]}**\n\n${row[1]}\n\n[Фотография](${row[2]}) · [Ссылка для публикации](${row[3]})\n`).join('\n'));
  console.log(`Prepared ${rows.length} Pinterest drafts with image sources and UTM links.`);
} finally { await server.close(); }
