/**
 * planner/pdf.js — خروجی PDF هفته (پورت Node از build_pdf در planner.py)
 *
 * چیدمان: A4 عمودی، ۸ کارت روز (۲×۴) + کارت «خلاصه و راهنما».
 * متن با RtlWriter نوشته می‌شود تا فارسی درست شکل بگیرد و از راست به چپ بچینند.
 */
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { RtlWriter } from './rtl-pdf.js';
import {
  DAY_NAMES, PRIORITY_PDF, FIXED_PDF, faNum, jalaliStr, gregorianStr, fmtTime, fmtDur,
} from './core.js';
import { FONT_DIR } from './html.js';
import { join } from 'node:path';

const INK = [15, 23, 42];
const MUT = [100, 116, 139];
const LINE = [203, 213, 225];
const ACC = [79, 70, 229];
const TODAY_CARD = [99, 102, 241];

/**
 * @param {Map<number, import('./core.js').DayPlan>} days
 * @param {Date} weekStart
 * @param {number} dayStart
 * @param {number} dayEnd
 * @param {string[]} warnings
 * @param {string} outPath
 * @returns {Promise<boolean>} آیا PDF ساخته شد
 */
export function buildPdf(days, weekStart, dayStart, dayEnd, warnings, outPath, opts = {}) {
  const reg = join(FONT_DIR, 'Vazirmatn-Regular.ttf');
  const bold = join(FONT_DIR, 'Vazirmatn-Bold.ttf');

  // بدون margins تا doc.page از همان ابتدا در دسترس باشد (مثل fpdf2 با set_margins)
  const doc = new PDFDocument({ size: 'A4' });
  doc.page.margins = { top: 8, right: 8, bottom: 8, left: 8 };
  const out = createWriteStream(outPath);
  const done = new Promise((resolve, reject) => {
    out.on('finish', () => resolve(true));
    out.on('error', reject);
    doc.on('error', reject);
  });
  doc.pipe(out);

  const W = () => 595.28;   // A4 portrait, pt (210mm)
  const H = () => 841.89;   // 297mm
  const ML = 8; const MR = 8; const MB = 8;
  const R = new RtlWriter(doc, { regular: reg, bold });

  const today = opts.today || new Date();
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const all = [...days.values()];
  const totalBlocks = all.reduce((a, d) => a + d.blocks.length, 0);
  const totalMinutes = all.reduce((a, d) => a + d.blocks.reduce((x, b) => x + (b.end - b.start), 0), 0);

  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const CW = W() - ML - MR;
  const rightEdge = W() - MR;

  /* ── سربرگ ── */
  R.textRightAt('برنامهٔ هفتگی من', rightEdge, 14, { size: 15, weight: 'bold', color: rgb(INK) });
  const spanJ = `شنبه ${jalaliStr(weekStart, false)} تا جمعه ${jalaliStr(weekEnd, false)}`;
  const spanG = `${gregorianStr(weekStart, false)} — ${gregorianStr(weekEnd, false)}`;
  R.textRightAt(`${spanJ}  |  ${spanG}`, rightEdge, 36, { size: 9.5, color: rgb(MUT) });
  R.textRightAt(`${faNum(totalBlocks)} کار • مجموع ${fmtDur(totalMinutes)} • روز کاری: ${fmtTime(dayStart)} تا ${fmtTime(dayEnd)}`,
    rightEdge, 50, { size: 9.5, color: rgb(MUT) });
  doc.save().moveTo(ML, 66).lineTo(W() - MR, 66).lineWidth(0.9).strokeColor(rgb(ACC)).stroke().restore();

  /* ── شبکهٔ ۲×۴ ── */
  const gx = 5; const gy = 5;
  const top = 72;
  const availH = H() - MB - top;
  const cardW = (CW - gx) / 2;
  const cardH = (availH - 3 * gy) / 4;

  const sorted = [...days.keys()].sort((a, b) => a - b).map((k) => days.get(k));
  const cells = [...sorted, null]; // null = کارت خلاصه

  cells.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = ML + col * (cardW + gx);
    const y = top + row * (cardH + gy);
    if (d === null) drawSummary(x, y, cardW, cardH);
    else drawDay(x, y, cardW, cardH, d);
  });

  function drawCardFrame(x, y, w, h, highlight = false) {
    if (highlight) {
      doc.save().lineWidth(1.1).strokeColor(rgb(TODAY_CARD))
        .roundedRect(x, y, w, h, 5).stroke().restore();
      doc.save().lineWidth(0.4).strokeColor(rgb([199, 210, 254]))
        .roundedRect(x + 1.4, y + 1.4, w - 2.8, h - 2.8, 4).stroke().restore();
    } else {
      doc.save().lineWidth(0.45).strokeColor(rgb(LINE)).roundedRect(x, y, w, h, 5).stroke().restore();
    }
  }

  function drawDay(x, y, w, h, d) {
    const isToday = sameDay(d.date, today);
    drawCardFrame(x, y, w, h, isToday);
    // سربرگ کارت — سطر ۱: نام روز (راست) + تاریخ شمسی (چپ)
    const nameW = R.textRightAt(DAY_NAMES[d.idx], x + w - 6, y + 4,
      { size: 10.5, weight: 'bold', color: rgb(INK) });
    if (isToday) {
      // نشان «امروز» کنار نام روز
      const badge = 'امروز';
      R.setFont('bold');
      const bw = R.width(badge, 6.2) + 7;
      const bx = x + w - 6 - nameW - 5 - bw;
      doc.save();
      doc.fillColor(rgb(ACC)).roundedRect(bx, y + 5, bw, 9.5, 5).fill();
      doc.restore();
      R.textLeftAt(badge, bx + 3.5, y + 7.2, { size: 6.2, weight: 'bold', color: '#ffffff' });
    }
    R.textLeftAt(jalaliStr(d.date, false), x + 6, y + 5, { size: 8, color: rgb(MUT) });
    // سطر ۲: تاریخ میلادی (راست) + زمان آزاد (چپ)
    R.textRightAt(gregorianStr(d.date, false), x + w - 6, y + 15, { size: 6.6, color: rgb(MUT) });
    const freeMin = d.freeIntervals(dayStart, dayEnd).reduce((a, [s, e]) => a + (e - s), 0);
    R.textLeftAt(freeMin ? `آزاد: ${fmtDur(freeMin)}` : 'پُر', x + 6, y + 15, { size: 6.6, color: rgb(MUT) });
    doc.save().moveTo(x + 6, y + 22.5).lineTo(x + w - 6, y + 22.5).lineWidth(0.3).strokeColor(rgb(LINE)).stroke().restore();

    const lineH = 13;
    const maxItems = Math.max(1, Math.floor((h - 30) / lineH));
    const items = d.blocks.slice().sort((a, b) => a.start - b.start);
    const extra = items.length - maxItems;
    const shown = extra > 0 ? items.slice(0, maxItems) : items;

    let yy = y + 27;
    shown.forEach((b, n) => {
      if (n % 2 === 1) {
        doc.save().fillColor('#f8fafc').rect(x + 2, yy - 2, w - 4, lineH - 1.5).fill().restore();
      }
      const col = b.kind === 'fixed' ? FIXED_PDF : PRIORITY_PDF[b.priority];
      doc.save().fillColor(rgb(col)).rect(x + w - 4.2, yy + 2, 1.7, lineH - 6).fill().restore();

      // ساعت (راست) — فونت بولد و رنگ ثابت برای کارهای ساعت‌ثابت
      const timeStr = `${fmtTime(b.start)}–${fmtTime(b.end)}`;
      R.textRightAt(timeStr, x + w - 7, yy, {
        size: 7.6, weight: 'bold', color: rgb(b.kind === 'fixed' ? FIXED_PDF : INK),
      });

      // عنوان (چپ) — با سه‌نقطه اگر جا نشد
      const timeW = R.width(timeStr, 7.6);
      const titleW = w - 14 - timeW - 6;
      let title = b.title + (b.part ? ` (${b.part})` : '');
      R.setFont('regular');
      const full = R.width(shapeForMeasure(title), 7.8);
      if (full > titleW) title = R.ellipsize(title, titleW, 7.8);
      R.textRightAt(title, x + w - 12 - timeW - 4, yy, { size: 7.8, color: rgb(INK) });
      yy += lineH;
    });

    if (extra > 0) {
      R.textRightAt(`… و ${faNum(extra)} مورد دیگر`, x + w - 6, yy, { size: 7, color: rgb(MUT) });
    }
    if (!items.length) {
      R.textRightAt('روز آزاد است', x + w - 6, yy + 2, { size: 8, color: rgb(MUT) });
    }
  }

  function drawSummary(x, y, w, h) {
    drawCardFrame(x, y, w, h);
    R.textRightAt('خلاصه و راهنما', x + w - 6, y + 4, { size: 10, weight: 'bold', color: rgb(INK) });
    doc.save().moveTo(x + 6, y + 18).lineTo(x + w - 6, y + 18).lineWidth(0.3).strokeColor(rgb(LINE)).stroke().restore();

    let yy = y + 24;
    const legend = [
      [FIXED_PDF, 'ساعت ثابت (جلسه/کلاس)'],
      [PRIORITY_PDF[1], 'اولویت بالا'],
      [PRIORITY_PDF[2], 'اولویت متوسط'],
      [PRIORITY_PDF[3], 'اولویت پایین'],
    ];
    for (const [col, label] of legend) {
      doc.save().fillColor(rgb(col)).rect(x + w - 10, yy + 1.4, 4, 4).fill().restore();
      R.textRightAt(label, x + w - 14, yy, { size: 7.6, color: rgb(INK) });
      yy += 11;
    }

    yy += 3;
    R.textRightAt(`مجموع: ${faNum(totalBlocks)} کار — ${fmtDur(totalMinutes)}`, x + w - 6, yy, { size: 7.6, color: rgb(MUT) });
    yy += 13;

    if (warnings.length) {
      let shown = 0;
      for (const wn of warnings) {
        if (yy > y + h - 12 || shown >= 4) break;
        const line = `• ${wn}`;
        const clipped = R.ellipsize(line, w - 14, 6.9);
        R.textRightAt(clipped, x + w - 6, yy, { size: 6.9, color: rgb([146, 64, 14]) });
        yy += 9.4;
        shown += 1;
      }
    }
  }

  doc.end();
  return done.then(() => true).catch(() => false);
}

/* ابزارهای کوچک */
/**
 * رنگ را به hex تبدیل می‌کند — نه رشتهٔ `rgb(...)`.
 * pdfkit رشتهٔ rgb() را در `_fillColor` نگه می‌دارد و در هر `text()`
 * دوباره اعمالش می‌کند؛ ولی فقط وقتی رشته «هگز» یا آرایه باشد درست
 * کار می‌کند. با rgb() رنگِ متن قبلی روی همهٔ متن‌های بعدی می‌چسبد
 * (باگ واقعی: کارت جمعه و خلاصه سفید روی سفید می‌شدند).
 */
function rgb(c) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${c.map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}
function shapeForMeasure(s) { return s; }

/** اطمینان از وجود پوشهٔ خروجی و ساخت PDF */
export async function writePdf(days, weekStart, dayStart, dayEnd, warnings, outPath, opts = {}) {
  mkdirSync(dirname(outPath), { recursive: true });
  return buildPdf(days, weekStart, dayStart, dayEnd, warnings, outPath, opts);
}

export default writePdf;
export { rgb };
