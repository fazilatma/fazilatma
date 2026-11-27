/**
 * planner/patch-engine.js — موتور پچ فایل‌های متنی (جانشین منطق apply() در patch_v*.py)
 *
 * پچ‌ها «جایگزینی کنترل‌شده» هستند: هر جایگزینی باید دقیقاً همان تعداد انتظار
 * تکرار داشته باشد؛ اگر لنگر پیدا نشود یا چند بار تکرار شده باشد، پچ با خطا
 * متوقف می‌شود تا هیچ‌وقت فایلی نیمه‌پچ‌شده ذخیره نشود.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { renameSync } from 'node:fs';

export class PatchError extends Error {
  constructor(message, detail = {}) {
    super(message);
    this.name = 'PatchError';
    Object.assign(this, detail);
  }
}

/** شمارش تکرارهای یک زیررشته */
export function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

/**
 * اعمال جایگزینی‌های [{name, from, to, count}] روی متن
 * @param {string} text
 * @param {Array<{name:string, from:string, to:string, count?:number, optional?:boolean}>} reps
 * @param {{file?:string, onLog?:(msg:string)=>void}} [opts]
 */
export function applyReplacements(text, reps, opts = {}) {
  const log = opts.onLog || (() => {});
  let out = text;
  reps.forEach((rep, i) => {
    const { name = `#${i}`, from, to, optional = false } = rep;
    const expected = rep.count ?? 1;
    const found = countOccurrences(out, from);
    if (found !== expected) {
      if (optional && found === 0) {
        log(`↷ ${name}: لنگر نبود، رد شد (optional)`);
        return;
      }
      throw new PatchError(
        `[${opts.file || '?'}] ${name}: ${found} بار پیدا شد (انتظار ${expected}) — لنگر عوض شده یا تکراری است`,
        { name, found, expected },
      );
    }
    out = out.split(from).join(to);
  });
  return out;
}

/**
 * جایگزینی یک بازهٔ متن میان a و b با متن جدید
 * (معادل «slices» در پچ‌های پایتونی)
 */
export function applySlice(text, { name = 'slice', start, end, replace, optional = false }, opts = {}) {
  const i1 = text.indexOf(start);
  const i2 = i1 < 0 ? -1 : text.indexOf(end, i1);
  if (i1 < 0 || i2 <= i1) {
    if (optional) return text;
    throw new PatchError(`[${opts.file || '?'}] ${name}: بازهٔ «${start.slice(0, 40)}…» پیدا نشد`);
  }
  return text.slice(0, i1) + replace + text.slice(i2 + end.length);
}

/**
 * اجرای یک پچ روی فایل‌ها
 * پچ = { version, title, files: [{ path, replacements?, slices? }] , tests?: string[] }
 */
export function runPatch(patch, { baseDir = process.cwd(), dryRun = false, onLog = console.log } = {}) {
  const results = [];
  for (const file of patch.files) {
    const abs = `${baseDir}/${file.path}`;
    const before = readFileSync(abs, 'utf8');
    let text = before;
    if (file.slices) {
      for (const sl of file.slices) text = applySlice(text, sl, { file: file.path });
    }
    if (file.replacements) text = applyReplacements(text, file.replacements, { file: file.path, onLog });
    const changed = text !== before;
    if (changed && !dryRun) {
      writeFileSync(`${abs}.tmp`, text, 'utf8');
      renameSync(`${abs}.tmp`, abs);
    }
    onLog(`${changed ? '✓' : '•'} ${file.path}${changed ? '' : ' (بدون تغییر)'}`);
    results.push({ path: file.path, changed, bytes: text.length });
  }
  return results;
}

export default runPatch;

/**
 * وضعیت لنگرهای یک پچ نسبت به فایل‌های فعلی:
 *   applied    → متن جدید (to) در فایل هست  ⇒ این پچ قبلاً اعمال شده
 *   pending    → متن قدیم (from) هست         ⇒ پچ قابل اجراست
 *   superseded → هیچ‌کدام نیست               ⇒ نسخه‌های بعدی این بخش را بازنویسی کرده‌اند
 */
export function auditPatch(patch, { baseDir, readFile } = {}) {
  const rows = [];
  for (const f of patch.files) {
    const text = readFile ? readFile(f.path) : readFileSync(baseDir ? `${baseDir}/${f.path}` : f.path, 'utf8');
    for (const r of f.replacements) {
      const hasNew = r.to ? countOccurrences(text, r.to) > 0 : false;
      const hasOld = countOccurrences(text, r.from) > 0;
      rows.push({
        file: f.path,
        name: r.name,
        state: hasNew ? 'applied' : (hasOld ? 'pending' : 'superseded'),
      });
    }
    for (const s of f.slices || []) {
      const hasNew = s.replace ? countOccurrences(text, s.replace) > 0 : false;
      const hasOld = text.includes(s.start) && text.includes(s.end);
      rows.push({
        file: f.path,
        name: s.name,
        state: hasNew ? 'applied' : (hasOld ? 'pending' : 'superseded'),
      });
    }
  }
  return rows;
}
