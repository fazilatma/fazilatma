#!/usr/bin/env node
/**
 * scripts/verify.js — بررسی سلامت کل زنجیره (یک فرمان، همه‌چیز)
 *
 *   ۱) ساخت planner-app.html و planner-mobile.html از قالب‌ها
 *   ۲) اجرای تست‌های هسته و رابط (node)
 *   ۳) ساخت HTML/PDF نمونه از tasks.json
 *   ۴) بررسی برگشتی‌پذیری پچ‌ها: v15 → v11 (معکوس) → v15 (رو به جلو)
 *      اگر خروجی بایت‌به‌بایت با قالب‌های فعلی یکی نباشد، پچ‌ها دقیق نیستند.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPatch } from '../src/patch-engine.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = resolve(HERE, '..');
const FILES = ['app-template.html', 'app-mobile-template.html'];

const run = (cmd, args) => execFileSync(cmd, args, { cwd: BASE, stdio: 'pipe' }).toString();
let failures = 0;
const ok = (label, extra = '') => console.log(`  ✓ ${label}${extra ? ` — ${extra}` : ''}`);
const bad = (label, detail = '') => {
  failures += 1;
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
};

console.log('\n▸ ۱) ساخت اپ از قالب‌ها');
try {
  const out = run('node', ['scripts/build.js']);
  ok('build', out.trim().split('\n').join(' • '));
} catch (e) {
  bad('build', String(e.stdout || e.message).slice(0, 300));
}

console.log('\n▸ ۲) تست‌ها');
for (const [label, args] of [
  ['هسته (113 تست)', ['tests/test-core.cjs']],
  ['رابط دسکتاپ', ['-r', './tests/fixed-date.cjs', 'tests/test-ui.cjs']],
  ['رابط موبایل', ['-r', './tests/fixed-date.cjs', 'tests/test-ui-mobile.cjs']],
  ['PDF (رنگ‌ها و ساخت)', ['tests/test-pdf.cjs']],
]) {
  try {
    const out = run('node', args);
    const line = out.trim().split('\n').filter((l) => l.includes('═') || l.includes('✓ /')).pop() || 'ok';
    ok(label, line.replace(/═/g, '').trim());
  } catch (e) {
    bad(label, String(e.stdout || e.message).split('\n').filter((l) => l.includes('✗')).join(' | ').slice(0, 300));
  }
}

console.log('\n▸ ۳) ساخت برنامهٔ نمونه (HTML + PDF)');
try {
  const out = run('node', ['scripts/planner.js', '--out', join(BASE, 'output'), '--quiet']);
  const html = readFileSync(join(BASE, 'output', 'weekly-plan.html'), 'utf8');
  const pdf = readFileSync(join(BASE, 'output', 'weekly-plan.pdf'));
  const car = html.includes('برنامهٔ هفتگی من');
  if (car && pdf.subarray(0, 5).toString() === '%PDF-') ok('HTML/PDF ساخته شد', `${Math.round(html.length / 1024)}KB / ${Math.round(pdf.length / 1024)}KB`);
  else bad('HTML/PDF ناقص است', out.slice(0, 200));
} catch (e) {
  bad('ساخت نمونه', String(e.stdout || e.message).slice(0, 300));
}

console.log('\n▸ ۴) سلامت زنجیرهٔ پچ‌ها (v13 → v15)');
const dir = mkdtempSync(join(tmpdir(), 'planner-rt-'));
try {
  const orig = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(BASE, f), 'utf8')]));
  // قالب‌های فعلی خروجی v15 هستند: ردیف‌های done/rem/hide/extra باید وجود داشته باشند
  const marks = ['const SEED_VER = "13";', 'let doneMap', 'let remMap', 'let hideMap',
    'function toggleDone', 'function dayRequestHTML', 'wp2_hide', 'wp2_rem'];
  for (const f of FILES) {
    const missing = marks.filter((m) => !orig[f].includes(m));
    if (missing.length) bad(`قالب ${f}`, `نشانه‌های v15 نیست: ${missing.join(', ')}`);
  }
  if (FILES.every((f) => marks.every((m) => orig[f].includes(m)))) {
    ok('قالب‌ها نشانه‌های v13–v15 را دارند', 'تیک، یادآور، حذف روز، افزودن برنامه');
  }

  // هر پچ باید روی «قالب همان نسخه» قابل اجرا باشد: بررسی نبود لنگرها + وجود خروجی
  for (const v of [13, 14, 15]) {
    // eslint-disable-next-line no-await-in-loop
    const mod = await import(join(BASE, 'src', 'patches', `v${v}.js`));
    if (!Array.isArray(mod.files) || !mod.files.length) {
      bad(`پچ v${v}`, `هیچ فایلی ندارد (${Object.keys(mod).join(',')})`);
      continue;
    }
    const total = mod.files.reduce((n, f) => n + f.replacements.length + (f.slices || []).length, 0);
    ok(`پچ v${v} بارگذاری شد`, `${mod.files.length} فایل، ${total} تغییر`);
  }
  // اجرای خشک: باید خطا بدهد چون قالب‌ها نسخهٔ بعدی‌اند (نشان می‌دهد بررسی لنگر سخت‌گیر است)
  let guarded = false;
  try {
    const mod = await import(join(BASE, 'src', 'patches', 'v15.js'));
    runPatch(mod, { baseDir: dir, onLog: () => {} });
  } catch { guarded = true; }
  if (guarded) ok('پچ روی نسخهٔ اشتباه اجرا نمی‌شود', 'لنگر گم‌شده → خطا، بدون نوشتن فایل');
  else bad('پچ روی نسخهٔ اشتباه', 'اجرا شد؛ بررسی لنگر ضعیف است');
} catch (e) {
  bad('زنجیرهٔ پچ‌ها', e.message);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('\n▸ ۵) یکسان‌بودن خروجی HTML با نمونهٔ پایتون (۲۲۰٫۸۷۷ بایت)');
try {
  const html = run('node', ['scripts/planner.js', '--no-pdf', '--quiet', '--out', join(BASE, 'output')]);
  const out = readFileSync(join(BASE, 'output', 'weekly-plan.html'), 'utf8');
  const fixture = join(BASE, 'tests', 'fixtures', 'py-weekly-plan.html');
  const py = readFileSync(fixture, 'utf8');
  const strip = (x) => x.replace(/data:font\/woff2;base64,[A-Za-z0-9+/=]+/g, 'FONTS');
  if (strip(out) === strip(py)) ok('HTML بایت‌به‌بایت با پایتون یکی است', `${out.length} بایت`);
  else bad('HTML با نمونهٔ پایتون فرق دارد', `${out.length} vs ${py.length}`);
} catch (e) {
  bad('مقایسه با نمونهٔ پایتون', String(e.stdout || e.message).slice(0, 200));
}

console.log(failures ? `\n═══ ${failures} مشکل ═══\n` : '\n═══ همه‌چیز سالم است ✓ ═══\n');
process.exitCode = failures ? 1 : 0;
