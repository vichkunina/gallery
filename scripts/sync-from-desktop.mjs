#!/usr/bin/env node
/**
 * Full gallery sync from ~/Desktop/картины:
 * - root folder → gallery (grouped by YYYY-MM-DD, newest first)
 * - кошмарики/ subfolder → koshmariki section
 * - titles = Russian dates, lossless import (HEIC → JPEG q100)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MEDIA = path.join(ROOT, 'media', 'images');
const DESKTOP = process.env.DESKTOP ?? path.join(process.env.HOME, 'Desktop', 'картины');
const KOSHMARIKI_SRC = path.join(DESKTOP, 'кошмарики');
const HEIC_QUALITY = process.env.IMPORT_HEIC_QUALITY ?? '100';

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function esc(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function formatTitle(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function parseFileMeta(filename) {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, date, hh, mm, ss] = match;
  return {
    date,
    sortKey: `${date}T${hh}:${mm}:${ss}`,
    filename,
  };
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => {
      if (name.startsWith('.')) return false;
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      return IMAGE_EXT.has(ext);
    })
    .map((name) => parseFileMeta(name))
    .filter(Boolean);
}

function groupByDate(files) {
  const groups = new Map();
  for (const file of files) {
    if (!groups.has(file.date)) groups.set(file.date, []);
    groups.get(file.date).push(file);
  }
  for (const items of groups.values()) {
    items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

function importFile(srcPath, destRelPath) {
  const destPath = path.join(MEDIA, destRelPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const ext = path.extname(srcPath).slice(1).toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    fs.copyFileSync(srcPath, destPath);
    return;
  }
  if (['heic', 'heif'].includes(ext)) {
    execSync(
      `sips -s format jpeg -s formatOptions ${HEIC_QUALITY} ${JSON.stringify(srcPath)} --out ${JSON.stringify(destPath)}`,
      { stdio: 'ignore' },
    );
    return;
  }
  throw new Error(`Unsupported format: ${srcPath}`);
}

function destExt(srcFilename) {
  const ext = srcFilename.split('.').pop()?.toLowerCase() ?? '';
  if (['heic', 'heif'].includes(ext)) return 'jpg';
  if (ext === 'jpeg') return 'jpg';
  return ext;
}

function cleanDir(relDir) {
  const full = path.join(MEDIA, relDir);
  if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
  fs.mkdirSync(full, { recursive: true });
}

function buildGallery(groups) {
  const artworks = [];

  groups.forEach((group, index) => {
    const id = index + 1;
    const slug = String(id).padStart(2, '0');
    const views = group.items.map((item, viewIndex) => {
      const viewNum = String(viewIndex + 1).padStart(2, '0');
      const rel = `gallery/${slug}-${group.date}-${viewNum}.${destExt(item.filename)}`;
      importFile(path.join(DESKTOP, item.filename), rel);
      return {
        src: rel,
        label: group.items.length > 1 ? `Фото ${viewIndex + 1}` : undefined,
      };
    });

    artworks.push({
      id,
      title: formatTitle(group.date),
      date: group.date,
      img: views[0].src,
      views: views.length > 1 ? views : undefined,
    });
  });

  return artworks;
}

function buildKoshmariki(groups) {
  return groups.map((group, index) => {
    const id = index + 1;
    const slug = String(id).padStart(2, '0');
    const item = group.items[0];
    const rel = `koshmariki/${slug}-${group.date}.${destExt(item.filename)}`;
    importFile(path.join(KOSHMARIKI_SRC, item.filename), rel);
    return {
      id,
      title: formatTitle(group.date),
      img: rel,
    };
  });
}

function writeArtworks(artworks) {
  const lines = artworks.map((art) => {
    const viewsBlock = art.views
      ? `    views: [
${art.views
  .map(
    (v) =>
      `      { src: mediaUrl('images/${esc(v.src)}')${v.label ? `, label: '${esc(v.label)}'` : ''} },`,
  )
  .join('\n')}
    ],
`
      : '';

    return `  {
    id: ${art.id},
    title: '${esc(art.title)}',
    category: 'mixed',
    details: '—',
    size: '—',
    desc: '',
    img: mediaUrl('images/${esc(art.img)}'),
${viewsBlock}  },`;
  });

  const content = `import type { Artwork, CategoryFilter } from '../types';
import { mediaUrl } from '../config/media';

/** Auto-generated by scripts/sync-from-desktop.mjs — ${new Date().toISOString().slice(0, 10)} */
export const artworks: Artwork[] = [
${lines.join('\n')}
];

export const categories: CategoryFilter[] = [
  { id: 'all', label: 'Все' },
  { id: 'mixed', label: 'Смешанная' },
];
`;

  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'artworks.ts'), content);
}

function writeKoshmariki(items) {
  const lines = items.map(
    (item) =>
      `    { id: ${item.id}, title: '${esc(item.title)}', img: mediaUrl('images/${esc(item.img)}') },`,
  );

  const content = `import type { KoshmarikiCollection } from '../types';
import { mediaUrl } from '../config/media';

/** Auto-generated by scripts/sync-from-desktop.mjs — ${new Date().toISOString().slice(0, 10)} */
export const koshmariki: KoshmarikiCollection = {
  title: 'Кошмарики',
  description: [
    'Серия про мою Берту — зайку-собачку с большими амбициями. Юмор, уют и лёгкий хоррор: она заключает сделки с дьяволом, учится выть на луну и всё равно остаётся самой любимой.',
  ],
  items: [
${lines.join('\n')}
  ],
};
`;

  fs.writeFileSync(path.join(ROOT, 'src', 'data', 'koshmariki.ts'), content);
}

function main() {
  if (!fs.existsSync(DESKTOP)) {
    console.error(`Folder not found: ${DESKTOP}`);
    process.exit(1);
  }
  if (!fs.existsSync(KOSHMARIKI_SRC)) {
    console.error(`Folder not found: ${KOSHMARIKI_SRC}`);
    process.exit(1);
  }

  const galleryFiles = listImages(DESKTOP);
  const koshmarikiFiles = listImages(KOSHMARIKI_SRC);

  if (!galleryFiles.length) {
    console.error('No images found in gallery folder');
    process.exit(1);
  }

  cleanDir('gallery');
  cleanDir('koshmariki');

  const galleryGroups = groupByDate(galleryFiles);
  const koshmarikiGroups = groupByDate(koshmarikiFiles);

  const artworks = buildGallery(galleryGroups);
  const koshmarikiItems = buildKoshmariki(koshmarikiGroups);

  writeArtworks(artworks);
  writeKoshmariki(koshmarikiItems);

  const viewCount = galleryFiles.length;
  console.log(`Gallery: ${artworks.length} works (${viewCount} photos), newest: ${artworks[0]?.title}`);
  console.log(`Koshmariki: ${koshmarikiItems.length} works`);
  console.log('Updated src/data/artworks.ts and src/data/koshmariki.ts');
  console.log('Run: npm run upload:media && npm run deploy:yc');
}

main();
