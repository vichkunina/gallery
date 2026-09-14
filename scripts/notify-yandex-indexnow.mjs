#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
/**
 * Notify Yandex about updated pages via IndexNow (no Webmaster UI required).
 */
const SITE = 'https://vichkunina.art';
const KEY = 'vichkunina2026indexnowkey';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

const sitemap = fs.readFileSync(fileURLToPath(new URL('../dist/sitemap.xml', import.meta.url)), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urlList.length || urlList.some((url) => !url.startsWith(SITE + '/'))) throw new Error('Invalid sitemap URLs');

const response = await fetch('https://yandex.com/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: 'vichkunina.art',
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
});

const body = await response.text();
console.log(`IndexNow: HTTP ${response.status}, ${urlList.length} URLs submitted`);
if (body) console.log(body);

if (!response.ok && response.status !== 202) {
  process.exitCode = 1;
}
