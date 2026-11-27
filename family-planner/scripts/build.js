#!/usr/bin/env node
/**
 * scripts/build.js — ساخت نسخه‌های نهایی (جانشین build.py)
 *   planner-app.html    (دسکتاپ)
 *   planner-mobile.html (موبایل — قابل نصب روی گوشی)
 * هستهٔ منطق از core.js، فونت‌ها و آیکون/مانیفست به‌صورت inline تزریق می‌شود.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = resolve(HERE, '..');

const core = readFileSync(join(BASE, 'core.js'), 'utf8');

const b64font = (name) => readFileSync(join(BASE, 'fonts', name)).toString('base64');

const injectFonts = (html) => html
  .replaceAll('__FONT_R__', b64font('Vazirmatn-Regular.woff2'))
  .replaceAll('__FONT_M__', b64font('Vazirmatn-Medium.woff2'))
  .replaceAll('__FONT_B__', b64font('Vazirmatn-Bold.woff2'));

/* ── دسکتاپ ── */
let desktop = readFileSync(join(BASE, 'app-template.html'), 'utf8');
if (!desktop.includes('/*__CORE__*/')) {
  console.error('❌ در app-template.html جای /*__CORE__*/ پیدا نشد.');
  process.exit(1);
}
desktop = desktop.replace('/*__CORE__*/', core);
desktop = injectFonts(desktop);
writeFileSync(join(BASE, 'planner-app.html'), desktop, 'utf8');
console.log(`OK planner-app.html (${Math.floor(desktop.length / 1024)} KB)`);

/* ── موبایل ── */
const svgIcon = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>"
  + "<rect width='128' height='128' rx='28' fill='#4f46e5'/>"
  + "<rect x='24' y='32' width='80' height='72' rx='10' fill='#ffffff'/>"
  + "<rect x='24' y='32' width='80' height='18' rx='9' fill='#c7d2fe'/>"
  + "<rect x='38' y='22' width='8' height='18' rx='4' fill='#ffffff'/>"
  + "<rect x='82' y='22' width='8' height='18' rx='4' fill='#ffffff'/>"
  + "<rect x='36' y='60' width='14' height='12' rx='3' fill='#818cf8'/>"
  + "<rect x='57' y='60' width='14' height='12' rx='3' fill='#e0e7ff'/>"
  + "<rect x='78' y='60' width='14' height='12' rx='3' fill='#e0e7ff'/>"
  + "<rect x='36' y='80' width='14' height='12' rx='3' fill='#e0e7ff'/>"
  + "<rect x='57' y='80' width='14' height='12' rx='3' fill='#e0e7ff'/>"
  + '</svg>';

const iconUri = `data:image/svg+xml,${encodeURIComponent(svgIcon)}`;

const manifest = {
  name: 'برنامه‌ریز من',
  short_name: 'برنامه‌ریز',
  dir: 'rtl',
  lang: 'fa',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#eef2f7',
  theme_color: '#4f46e5',
  icons: [{ src: iconUri, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
};
const manifestUri = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;

let mobile = readFileSync(join(BASE, 'app-mobile-template.html'), 'utf8');
if (!mobile.includes('/*__CORE__*/') || !mobile.includes('__MANIFEST__')) {
  console.error('❌ در app-mobile-template.html جای /*__CORE__*/ یا __MANIFEST__ پیدا نشد.');
  process.exit(1);
}
mobile = mobile.replace('/*__CORE__*/', core);
mobile = mobile.replaceAll('__MANIFEST__', manifestUri.replace(/&/g, '&amp;'));
mobile = mobile.replaceAll('__ICON__', iconUri.replace(/&/g, '&amp;'));
mobile = injectFonts(mobile);
writeFileSync(join(BASE, 'planner-mobile.html'), mobile, 'utf8');
console.log(`OK planner-mobile.html (${Math.floor(mobile.length / 1024)} KB)`);
