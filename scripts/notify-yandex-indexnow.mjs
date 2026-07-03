#!/usr/bin/env node
/**
 * Notify Yandex about updated pages via IndexNow (no Webmaster UI required).
 */
const SITE = 'https://vichkunina.art';
const KEY = 'vichkunina2026indexnowkey';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

const urlList = [`${SITE}/`];

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
console.log(`IndexNow: HTTP ${response.status}`);
if (body) console.log(body);

if (!response.ok && response.status !== 202) {
  process.exitCode = 1;
}
