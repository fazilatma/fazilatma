/**
 * تست‌های خروجی PDF — مخصوصاً باگ رنگ که یک‌بار کارت «جمعه» را سفید روی سفید کرد.
 *
 * pdfkit رشتهٔ `rgb(15,23,42)` را می‌پذیرد ولی آن را در `_fillColor` نگه می‌دارد و
 * در `text()` بعدی دوباره اعمال می‌کند؛ نتیجه: رنگِ آخر روی همهٔ متن‌های بعدی می‌چسبد.
 * راه‌حل: همیشه hex بدهیم.
 */
'use strict';



let pass = 0;
let fail = 0;
const eq = (name, got, want) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a === b) { pass += 1; console.log(`  ✓ ${name}`); }
  else { fail += 1; console.log(`  ✗ ${name}\n      got  ${a}\n      want ${b}`); }
};
const ok = (name, cond) => eq(name, !!cond, true);

/** ماژول‌ها ESM هستند؛ تست CJS است → با import() دینامیک بار می‌شوند */
const load = () => import('../src/pdf.js');

async function main() {
const { rgb, writePdf } = await load();

console.log('\n— رنگ‌ها —');
eq('INK به hex', rgb([15, 23, 42]), '#0f172a');
eq('ACC به hex', rgb([79, 70, 229]), '#4f46e5');
eq('سفید به hex', rgb([255, 255, 255]), '#ffffff');
ok('هیچ‌وقت rgb() برنمی‌گرداند', !rgb([1, 2, 3]).startsWith('rgb('));
ok('همیشه ۷ کاراکتر', rgb([0, 0, 0]).length === 7);
eq('گرد کردن اعشار', rgb([15.4, 23.6, 42.5]), '#0f182b');
ok('مقدار خارج از بازه بوم نمی‌سازد', /^#[0-9a-f]{6}$/.test(rgb([300, -5, 12])));

console.log('\n— ساخت PDF —');
{
  const fakeDay = {
    idx: 0,
    date: new Date(2026, 10, 21),
    blocks: [
      { start: 480, end: 540, title: 'زبان انگلیسی', kind: 'fixed', priority: 1 },
      { start: 600, end: 720, title: 'کلاس ریاضی', kind: 'task', priority: 2 },
    ],
    freeIntervals: () => [[540, 600], [720, 1320]],
  };
  const days = new Map([[0, fakeDay]]);
  const out = '/tmp/planner-test-pdf/probe.pdf';
  const okBuild = await writePdf(days, new Date(2026, 10, 21), 480, 1320, [], out);
  ok('PDF ساخته شد', okBuild);
  const { readFileSync } = require('node:fs');
  const buf = readFileSync(out);
  ok('امضای %PDF- دارد', buf.subarray(0, 5).toString() === '%PDF-');
  ok('حجم معقول', buf.length > 2000);

  console.log(`\n═══ ${pass} ✓ / ${fail} ✗ ═══\n`);
  process.exit(fail ? 1 : 0);
}
}

main().catch((e) => { console.error('✗', e && e.stack || e); process.exit(1); });
