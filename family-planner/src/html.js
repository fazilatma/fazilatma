/**
 * planner/html.js — ساخت خروجی HTML آمادهٔ چاپ از برنامهٔ هفته (پورت Node از build_html در planner.py)
 * ساختار و استایل خروجی دقیقاً همان نسخهٔ پایتونی است تا خروجی‌ها یکسان بمانند.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DAY_NAMES, PRIORITY_COLOR, PRIORITY_TINT, PRIORITY_NAME, FIXED_COLOR,
  faNum, jalaliStr, gregorianStr, fmtTime, fmtDur,
} from './core.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, 'assets');

export const FONT_DIR = join(HERE, '..', 'fonts');

/** CSS پایهٔ خروجی چاپی */
export function baseCss() {
  // مثل نسخهٔ پایتونی، CSS با یک خط خالی شروع می‌شود (خروجی بایت‌به‌بایت یکسان)
  return `\n${readFileSync(join(ASSETS, 'weekly-plan.css'), 'utf8')}`;
}

/** فونت‌های وُف۲ به‌صورت base64 داخل فایل (خروجی تک‌فایلی) */
export function embeddedFontFaces() {
  const read = (name) => {
    try {
      return readFileSync(join(FONT_DIR, name)).toString('base64');
    } catch {
      return '';
    }
  };
  const reg = read('Vazirmatn-Regular.woff2');
  const med = read('Vazirmatn-Medium.woff2');
  const bold = read('Vazirmatn-Bold.woff2');
  let out = '';
  if (reg) out += `@font-face{font-family:'Vazirmatn';font-weight:400;src:url(data:font/woff2;base64,${reg}) format('woff2');}`;
  if (med) out += `@font-face{font-family:'Vazirmatn';font-weight:500;src:url(data:font/woff2;base64,${med}) format('woff2');}`;
  if (bold) out += `@font-face{font-family:'Vazirmatn';font-weight:700;src:url(data:font/woff2;base64,${bold}) format('woff2');}`;
  return out;
}

const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LOCK_SVG = '<svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">'
  + '<path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z"/>'
  + '</svg>';

/**
 * @param {Map<number, import('./core.js').DayPlan>} days
 * @param {Date} weekStart
 * @param {number} dayStart
 * @param {number} dayEnd
 * @param {string[]} warnings
 * @param {{today?:Date, fonts?:boolean}} [opts]
 */
export function buildHtml(days, weekStart, dayStart, dayEnd, warnings, opts = {}) {
  const today = opts.today || new Date();
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const css = (opts.fonts === false ? '' : embeddedFontFaces()) + baseCss();

  const all = [...days.values()];
  const totalBlocks = all.reduce((a, d) => a + d.blocks.length, 0);
  const totalMinutes = all.reduce((a, d) => a + d.blocks.reduce((x, b) => x + (b.end - b.start), 0), 0);
  const spanJ = `شنبه ${jalaliStr(weekStart, false)} تا جمعه ${jalaliStr(weekEnd, false)}`;
  const spanG = `${gregorianStr(weekStart, false)} تا ${gregorianStr(weekEnd, false)}`;

  const parts = [];
  parts.push(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>برنامه هفتگی — ${escapeHtml(spanJ)}</title>
<style>${css}</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <div>
    <h1><span class="logo"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm14 8H3v10h18V10zM7 12h4v4H7v-4z"/></svg></span>برنامهٔ هفتگی من</h1>
    <div class="range"><b>${escapeHtml(spanJ)}</b><br><span>${escapeHtml(spanG)}</span> &nbsp;•&nbsp; روز کاری: ${fmtTime(dayStart)} تا ${fmtTime(dayEnd)}</div>
  </div>
  <div class="chips">
    <span class="chip">${faNum(totalBlocks)} کار زمان‌بندی‌شده</span>
    <span class="chip">مجموع ${fmtDur(totalMinutes)}</span>
    <span class="chip">تولید: ${jalaliStr(today)}</span>
  </div>
</header>
<div class="toolbar no-print">
  <button class="btn" onclick="window.print()">🖨 چاپ / ذخیره به‌صورت PDF</button>
  <span class="hint">در پنجرهٔ چاپ، مقصد را «Save as PDF» انتخاب کن</span>
</div>
<div class="grid">
`);

  const sortedKeys = [...days.keys()].sort((a, b) => a - b);
  for (const di of sortedKeys) {
    const d = days.get(di);
    const isToday = d.date.toDateString() === today.toDateString();
    const freeMin = d.freeIntervals(dayStart, dayEnd).reduce((a, [s, e]) => a + (e - s), 0);
    const planned = d.blocks.reduce((a, b) => a + (b.end - b.start), 0);
    const spanMin = dayEnd - dayStart;
    const pct = spanMin ? Math.min(100, Math.trunc((planned * 100) / spanMin)) : 0;

    const rows = [];
    for (const b of d.blocks) {
      const pc = PRIORITY_COLOR[b.priority];
      const tint = PRIORITY_TINT[b.priority];
      const fixed = b.kind === 'fixed';
      const title = escapeHtml(b.title)
        + (b.part ? ` <span style="color:#94a3b8;font-weight:600">(${escapeHtml(b.part)})</span>` : '');
      let tags = '';
      if (fixed) tags += `<span class="tag fix">${LOCK_SVG} ساعت ثابت</span>`;
      if (b.window) tags += `<span class="tag win">پنجره: ${escapeHtml(b.window)}</span>`;
      tags += `<span class="tag pr" style="background:${tint};color:${pc}">اولویت ${PRIORITY_NAME[b.priority]}</span>`;
      tags += `<span class="tag win">${fmtDur(b.end - b.start)}</span>`;
      const notes = b.notes ? `<div class="notes">${escapeHtml(b.notes)}</div>` : '';
      const barColor = fixed ? FIXED_COLOR : pc;
      rows.push(`<div class="row${fixed ? ' fixed' : ''}" style="--pc:${barColor}">
<div class="t"><span class="bar"></span>${fmtTime(b.start)}<span class="till">تا ${fmtTime(b.end)}</span></div>
<div><div class="title">${title}</div><div class="meta">${tags}</div>${notes}</div>
</div>`);
    }
    const body = rows.length ? rows.join('\n') : '<div class="empty">روز آزاد است — برنامه‌ای ثبت نشده 🌿</div>';
    const freeTxt = freeMin > 0 ? `زمان آزاد: ${fmtDur(freeMin)}` : 'روز کاملاً پر شد';

    parts.push(`<section class="card${isToday ? ' today' : ''}">
<div class="card-h"><span class="dname">${DAY_NAMES[di]}${isToday ? '<span class="today-badge">امروز</span>' : ''}</span>
<span class="jdate">${jalaliStr(d.date, false)}</span></div>
<div class="card-sub"><span>${gregorianStr(d.date, false)}</span><span>${faNum(d.blocks.length)} مورد</span></div>
<div class="rows">${body}</div>
<div class="card-f"><span>${freeTxt}</span><div class="meter"><i style="width:${pct}%"></i></div></div>
</section>`);
  }

  let warnHtml = '';
  if (warnings.length) {
    const items = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('\n');
    warnHtml = `<div class="warns"><h3>⚠️ نکته‌ها و هشدارها</h3><ul>${items}</ul></div>`;
  }

  parts.push(`</div>
<section class="summary">
<h2>خلاصه</h2>
<div class="leg">
<span><i style="background:${FIXED_COLOR}"></i>ساعت ثابت (جلسه/کلاس)</span>
<span><i style="background:${PRIORITY_COLOR[1]}"></i>اولویت بالا</span>
<span><i style="background:${PRIORITY_COLOR[2]}"></i>اولویت متوسط</span>
<span><i style="background:${PRIORITY_COLOR[3]}"></i>اولویت پایین</span>
</div>
<p style="margin-top:10px;font-size:13px;color:var(--muted);line-height:2">
در این هفته <b style="color:var(--ink)">${faNum(totalBlocks)} کار</b> به مدت مجموع <b style="color:var(--ink)">${fmtDur(totalMinutes)}</b> زمان‌بندی شده است.
</p>
${warnHtml}
</section>
<footer class="credit">ساخته‌شده با «برنامه‌ریز هفتگی» — برای تغییر برنامه، tasks.json را ویرایش و دوباره اجرا کن.</footer>
</div>
</body>
</html>`);

  return parts.join('\n');
}

export default buildHtml;
