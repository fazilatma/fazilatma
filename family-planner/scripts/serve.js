#!/usr/bin/env node
/**
 * scripts/serve.js — سرور ایستا برای پیش‌نمایش روی سیستم خودت (جانشین python3 -m http.server)
 *
 *   node scripts/serve.js            # http://localhost:8123
 *   node scripts/serve.js --port 3000
 *
 * روی 0.0.0.0 گوش می‌دهد تا هم localhost و هم پیش‌نمایش میزبان‌شده کار کند.
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const pi = argv.indexOf('--port');
const PORT = Number(pi >= 0 ? argv[pi + 1] : process.env.PORT || 8123);
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let path = normalize(join(BASE, url === '/' ? 'index.html' : url));
  if (!path.startsWith(BASE)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    if (statSync(path).isDirectory()) path = join(path, 'index.html');
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('پیدا نشد');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(path)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(path).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`پیش‌نمایش: http://localhost:${PORT}  (میزبان: ${HOST})`);
});
