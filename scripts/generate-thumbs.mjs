#!/usr/bin/env node
/**
 * Generate JPEG thumbnails for gallery/koshmariki cards.
 * Full-size files stay for lightbox; thumbs (~960px) for grid/slider.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.join(__dirname, '..', 'media', 'images');
const MAX_WIDTH = Number(process.env.THUMB_MAX_WIDTH ?? 960);
const QUALITY = Number(process.env.THUMB_QUALITY ?? 82);

const SOURCE_DIRS = ['gallery', 'koshmariki'];
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function isImage(file) {
  return IMAGE_EXT.has(path.extname(file).toLowerCase());
}

function makeThumb(srcPath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  execSync(
    `sips -Z ${MAX_WIDTH} -s format jpeg -s formatOptions ${QUALITY} ${JSON.stringify(srcPath)} --out ${JSON.stringify(destPath)}`,
    { stdio: 'ignore' },
  );
}

function processDir(dirName) {
  const srcDir = path.join(MEDIA, dirName);
  const thumbDir = path.join(srcDir, 'thumbs');
  if (!fs.existsSync(srcDir)) return 0;

  let count = 0;
  for (const entry of fs.readdirSync(srcDir)) {
    if (entry === 'thumbs' || entry.startsWith('.')) continue;
    const srcPath = path.join(srcDir, entry);
    if (!fs.statSync(srcPath).isFile() || !isImage(entry)) continue;

    const base = entry.replace(/\.[^.]+$/, '');
    const destPath = path.join(thumbDir, `${base}.jpg`);
    const srcMtime = fs.statSync(srcPath).mtimeMs;
    const destExists = fs.existsSync(destPath);
    const destMtime = destExists ? fs.statSync(destPath).mtimeMs : 0;

    if (!destExists || srcMtime > destMtime) {
      makeThumb(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

let total = 0;
for (const dir of SOURCE_DIRS) {
  const n = processDir(dir);
  if (n > 0) console.log(`${dir}/thumbs: ${n} generated/updated`);
  total += n;
}
console.log(total ? `Done. ${total} thumbnails.` : 'Thumbnails up to date.');
