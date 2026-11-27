/**
 * planner/rtl-pdf.js — نوشتن متن فارسی/راست‌به‌چپ روی PDF با pdfkit
 *
 * چرا این فایل لازم است؟
 *  pdfkit برخلاف fpdf2 هیچ «شکل‌دهی» (shaping) و «الگوریتم دوجهته» ندارد؛
 *  حروف فارسی را جدا و چپ‌به‌راست می‌نویسد. اینجا با دو بستهٔ کوچک این کار را
 *  دستی انجام می‌دهیم:
 *    ۱) arabic-persian-reshaper → تبدیل حروف به شکل چسبیده (initial/medial/final)
 *    ۲) چیدن واحدهای متن از راست به چپ + شکستن سطر + اعداد فارسی از چپ به راست
 *  نتیجه: خروجی PDF درست مثل نسخهٔ پایتونی (fpdf2 + uharfbuzz).
 */
import { PersianShaper } from 'arabic-persian-reshaper';

const AR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const NUM = /[0-9\u0660-\u0669\u06F0-\u06F9]/;
const NUMISH = /[0-9\u0660-\u0669\u06F0-\u06F9:./٫,%٪_\-–—+]/;
const ZWNJ = '\u200c';

/** نوع هر کاراکتر برای گروه‌بندی: fa | num | lat | sp */
function charClass(ch) {
  if (/\s/.test(ch)) return 'sp';
  if (ch === ZWNJ) return 'join';
  // ارقام فارسی (U+06F0..U+06F9) هم داخل بازهٔ عربی‌اند؛ پس اول باید بررسی شوند
  if (NUM.test(ch)) return 'num';
  if (AR.test(ch)) return 'fa';
  if (NUMISH.test(ch)) return 'num';
  return 'lat';
}

/**
 * تقسیم یک سطر به «واحد»های قابل چیدن از راست به چپ.
 * ارقام و ساعت (۱۲:۳۰) یک واحد جدا می‌شوند تا داخلشان چپ‌به‌راست بماند.
 */
export function splitUnits(line) {
  const units = [];
  let buf = '';
  let cls = null;
  const flush = () => {
    if (!buf) return;
    if (cls === 'join') { // نیم‌فاصله به واحد قبلی می‌چسبد
      if (units.length) units[units.length - 1].s += buf;
      else units.push({ t: 'fa', s: buf });
    } else if (cls === 'sp') {
      units.push({ t: 'sp', s: ' ' });
    } else {
      units.push({ t: cls, s: buf });
    }
    buf = '';
  };
  for (const ch of line) {
    const c = charClass(ch);
    if (c === 'join') { buf += ch; continue; }
    if (c === cls) { buf += ch; continue; }
    flush();
    cls = c;
    buf = ch;
  }
  flush();
  return units;
}

/** متن یک واحد را برای نوشتن آماده کن (فقط فارسی/عربی شکل‌دهی می‌شود) */
export function shapeUnit(unit) {
  if (unit.t === 'fa' || unit.t === 'join') return PersianShaper.convertArabic(unit.s);
  return unit.s;
}

/**
 * ابزار نوشتن متن راست‌به‌چپ روی یک سند pdfkit
 */
/**
 * نوشتن یک واحد «عددی/ساعتی» از چپ به راست.
 * چرا کاراکتر‌به‌کاراکتر؟ چون fontkit متن را RTL تشخیص می‌دهد و ترتیب گلیف‌ها را
 * برمی‌گرداند؛ برای ارقام این برعکس‌شدن غلط است (۱۴۰۵ می‌شد ۵۰۴۱). با نوشتن
 * تک‌تک کاراکترها ترتیب درست می‌ماند.
 */
function drawNumeric(doc, str, x, y, size) {
  doc.fontSize(size);
  let pen = x;
  for (const ch of str) {
    const w = doc.widthOfString(ch);
    doc.text(ch, pen, y, { lineBreak: false, features: false });
    pen += w;
  }
}

export class RtlWriter {
  /**
   * @param {import('pdfkit')} doc
   * @param {{regular:string, bold?:string}} fonts مسیر فایل‌های ttf
   */
  constructor(doc, fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.current = 'regular';
    doc.registerFont('Vazir', fonts.regular);
    if (fonts.bold) doc.registerFont('VazirB', fonts.bold);
    doc.font(this.fontName('regular'));
  }

  fontName(weight = 'regular') {
    return weight === 'bold' && this.fonts.bold ? 'VazirB' : 'Vazir';
  }

  setFont(weight = 'regular') {
    this.current = weight;
    this.doc.font(this.fontName(weight));
    return this;
  }

  /** عرض متن در فونت/اندازهٔ فعلی */
  width(text, size) {
    return this.doc.fontSize(size || this.doc._fontSize).widthOfString(text);
  }

  /** عرض یک واحد (با کش تا سرعت خوب بماند) */
  unitWidth(unit, size) {
    const key = `${this.current}|${size}|${unit.t}|${unit.s}`;
    if (!this._cache) this._cache = new Map();
    const hit = this._cache.get(key);
    if (hit !== undefined) return hit;
    const w = unit.t === 'sp' ? this.doc.fontSize(size).widthOfString(' ') * 2.2
      : this.doc.fontSize(size).widthOfString(shapeUnit(unit));
    this._cache.set(key, w);
    return w;
  }

  /**
   * نوشتن یک پاراگراف راست‌چین (یا چپ‌چین با align:'left')
   * @returns {number} y بعد از آخرین سطر
   */
  text(str, {
    x, y, width, size = 12, weight = 'regular', color = '#0f172a',
    align = 'right', lineGap = 1.5, maxLines = Infinity,
  }) {
    const doc = this.doc;
    this.setFont(weight);
    doc.fontSize(size).fillColor(color);

    const units = splitUnits(String(str));
    for (const u of units) u.w = this.unitWidth(u, size);

    // شکستن به سطرهای بصری (به‌ترتیب منطقی)
    const lines = [];
    let cur = [];
    let cw = 0;
    for (const u of units) {
      if (u.t === 'sp' && !cur.length) continue;
      if (cw + u.w > width && cur.length) {
        lines.push(cur);
        cur = [];
        cw = 0;
        if (u.t === 'sp') continue;
      }
      cur.push(u);
      cw += u.w;
    }
    if (cur.length) lines.push(cur);

    let yy = y;
    const step = size * 1.45 + lineGap;
    let drawn = 0;
    for (const ln of lines) {
      if (drawn >= maxLines) break;
      let lw = 0;
      for (const u of ln) lw += u.w;
      let pen = align === 'right' ? x + width : align === 'center' ? x + (width - lw) / 2 : x;
      // از راست به چپ می‌چینیم؛ برای left/center هم شروع از لبهٔ راستِ متن
      if (align !== 'right') pen += lw;
      for (const u of ln) {
        if (u.t === 'sp') { pen -= u.w; continue; }
        pen -= u.w;
        if (u.t === 'num') drawNumeric(doc, u.s, pen, yy, size);
        else doc.text(shapeUnit(u), pen, yy, { lineBreak: false, features: false });
      }
      yy += step;
      drawn += 1;
    }
    return yy;
  }

  /** یک تکه متن در یک نقطه، راست‌چین نسبت به xRight */
  textRightAt(str, xRight, y, { size = 10, weight = 'regular', color = '#0f172a' } = {}) {
    this.setFont(weight);
    this.doc.fontSize(size).fillColor(color);
    const units = splitUnits(String(str));
    for (const u of units) u.w = this.unitWidth(u, size);
    let pen = xRight;
    for (const u of units) {
      if (u.t === 'sp') { pen -= u.w; continue; }
      pen -= u.w;
      if (u.t === 'num') drawNumeric(this.doc, u.s, pen, y, size);
      else this.doc.text(shapeUnit(u), pen, y, { lineBreak: false, features: false });
    }
    // عرض کل متن رسم‌شده (برای چیدن چیزهای بعدی کنارش)
    const total = units.reduce((a, u) => a + u.w, 0);
    return total;
  }

  /** یک تکه متن در یک نقطه، چپ‌چین از xLeft */
  textLeftAt(str, xLeft, y, { size = 10, weight = 'regular', color = '#0f172a' } = {}) {
    this.setFont(weight);
    this.doc.fontSize(size).fillColor(color);
    const units = splitUnits(String(str));
    for (const u of units) u.w = this.unitWidth(u, size);
    // برای چپ‌چین، واحدها از راست به چپ چیده می‌شوند و بلوک از xLeft شروع می‌شود
    let total = 0;
    for (const u of units) total += u.w;
    let pen = xLeft + total;
    for (const u of units) {
      if (u.t === 'sp') { pen -= u.w; continue; }
      pen -= u.w;
      if (u.t === 'num') drawNumeric(this.doc, u.s, pen, y, size);
      else this.doc.text(shapeUnit(u), pen, y, { lineBreak: false, features: false });
    }
  }

  /** عرض متن برای برش/کوتاه‌کردن (سه‌نقطه در ابتدا، چون راست‌چین است) */
  ellipsize(str, maxWidth, size, weight = 'regular') {
    this.setFont(weight);
    const w = (t) => this.doc.fontSize(size).widthOfString(PersianShaper.convertArabic(t));
    if (w(str) <= maxWidth) return str;
    const chars = [...str];
    while (chars.length > 3 && w(`…${chars.join('')}`) > maxWidth) chars.shift();
    return `…${chars.join('')}`;
  }
}

export default RtlWriter;
