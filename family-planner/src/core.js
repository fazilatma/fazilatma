/**
 * planner/core.js — منطق مشترک ابزار «برنامه‌ریز هفتگی» (پورت Node از planner.py)
 *
 * تقویم شمسی/میلادی • ساعت و مدت فارسی • زمان‌بندی کارهای ثابت و انعطاف‌پذیر
 * این ماژول هیچ وابستگی بیرونی ندارد تا هم CLI و هم تست‌ها بتوانند بدون نصب چیزی اجرایش کنند.
 */

export const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
export const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
export const G_MONTHS = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];

export const PRIORITY_NAME = { 1: 'بالا', 2: 'متوسط', 3: 'پایین' };
export const PRIORITY_COLOR = { 1: '#e11d48', 2: '#d97706', 3: '#059669' };
export const PRIORITY_TINT = { 1: '#ffe4e6', 2: '#fef3c7', 3: '#d1fae5' };
export const PRIORITY_PDF = { 1: [225, 29, 72], 2: [217, 119, 6], 3: [5, 150, 105] };
export const FIXED_COLOR = '#b45309';
export const FIXED_PDF = [180, 83, 9];

export const WINDOWS = { صبح: [360, 720], ظهر: [720, 1020], عصر: [1020, 1260], شب: [1260, 1440] };

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** ارقام لاتین → فارسی */
export function faNum(x) {
  return String(x).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** ارقام فارسی/عربی → لاتین */
export function enNum(s) {
  return String(s).replace(/[۰-۹٠-٩]/g, (c) => {
    const i = FA_DIGITS.indexOf(c);
    return String(i >= 0 ? i : AR_DIGITS.indexOf(c));
  });
}

/* ─────────────────────────── تبدیل تاریخ ─────────────────────────── */

/** تاریخ JS → [سال، ماه، روز] شمسی */
export function toJalali(gy, gm, gd) {
  const gDM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400) + gd + gDM[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm, jd;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

/** ایندکس روز هفته با مبنای شنبه (۰=شنبه … ۶=جمعه) */
export function dayIndex(d) {
  return (d.getDay() + 1) % 7;
}

/** شنبهٔ همان هفته */
export function saturdayOfWeek(d) {
  return addDays(d, -dayIndex(d));
}

export function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** کلید یکتای روز به شکل YYYY-MM-DD (میلادی) */
export function dkey(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** «YYYY-MM-DD» → Date (نیمه‌شب محلی) */
export function parseDkey(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function jalaliStr(d, withWeekday = true) {
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const s = `${faNum(jd)} ${J_MONTHS[jm - 1]} ${faNum(jy)}`;
  return withWeekday ? `${DAY_NAMES[dayIndex(d)]} ${s}` : s;
}

export function gregorianStr(d, withWeekday = true) {
  const s = `${faNum(d.getDate())} ${G_MONTHS[d.getMonth()]} ${faNum(d.getFullYear())}`;
  return withWeekday ? `${DAY_NAMES[dayIndex(d)]} ${s}` : s;
}

/* ─────────────────────────── زمان و مدت ─────────────────────────── */

/** «۹:۳۰» یا «09:30» → دقیقه از نیمه‌شب */
export function parseHHMM(s, fallback = null) {
  const t = enNum(String(s)).trim().replace(/[٫،]/g, ':');
  const m = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(t);
  if (!m) return fallback;
  const h = Number(m[1]);
  const mi = Number(m[2] || 0);
  if (h > 24 || mi > 59) return fallback;
  return h * 60 + mi;
}

/** «10:00 تا 12:00» یا «9-11:30» → [شروع، پایان] یا null */
export function parseRange(s) {
  const parts = enNum(String(s)).trim().split(/\s*(?:تا|–|—|-|to)\s*/);
  if (parts.length === 2) {
    const a = parseHHMM(parts[0]);
    const b = parseHHMM(parts[1]);
    if (a !== null && b !== null && b > a) return [a, b];
  }
  return null;
}

/** مدت به دقیقه: عدد (دقیقه)، «1:30»، «۱٫۵ ساعت»، «45 دقیقه» */
export function parseDuration(v, fallback = 60) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return Number.isInteger(v) && v >= 8 ? Math.round(v) : Math.round(v * 60);
  }
  const s = enNum(String(v)).trim();
  let m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = /([\d.]+)\s*(ساعت|hour|h)/.exec(s);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = /(\d+)\s*(دقیقه|min)?/.exec(s);
  if (m) return Number(m[1]);
  return fallback;
}

export function fmtTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return faNum(`${h}:${mm}`);
}

export function fmtRange(s, e) {
  return `${fmtTime(s)} تا ${fmtTime(e)}`;
}

export function fmtDur(m) {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  if (h && mm) return `${faNum(h)} ساعت و ${faNum(mm)} دقیقه`;
  if (h) return `${faNum(h)} ساعت`;
  return `${faNum(mm)} دقیقه`;
}

/* ─────────────────────────── خواندن تنظیمات ─────────────────────────── */

const normDay = (s) => enNum(String(s)).replace(/[\s\u200c]+/g, '');

const DAY_ALIASES = [
  ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'],
];

/** روزهای هدف کار از فیلدهای days/day/همه‌روزها */
export function resolveDays(task, active, warnings, tindex) {
  let raw = task.days;
  if (raw === undefined && 'day' in task) raw = [task.day];
  if (raw === undefined || raw === null) return [...active];
  if (typeof raw === 'string') {
    const n = normDay(raw);
    if (['دائی', 'هرروز', 'روزانه', 'daily', 'everyday', 'all'].includes(n)) return [...active];
    raw = [raw];
  }
  if (!Array.isArray(raw)) raw = [raw];
  const out = new Set();
  for (const item of raw) {
    if (typeof item === 'boolean') continue;
    if (typeof item === 'number') {
      if (item >= 0 && item <= 6) out.add(item);
      continue;
    }
    const n = normDay(item);
    let matched = false;
    DAY_NAMES.forEach((name, i) => {
      if (matched) return;
      if (n === normDay(name) || n === DAY_ALIASES[0][i]) {
        out.add(i);
        matched = true;
      }
    });
    if (!matched) {
      warnings.push(`کار ${faNum(tindex)}: روز نامعتبر «${item}» نادیده گرفته شد.`);
    }
  }
  const filtered = [...out].filter((i) => active.includes(i)).sort((a, b) => a - b);
  if (filtered.length) return filtered;
  return out.size ? [] : [...active];
}

/**
 * خواندن متن فایل؛ در Node از fs و در مرورگر از fetch استفاده می‌شود.
 * (به‌جای import ثابت fs تا این ماژول در مرورگر هم بارگذاری شود.)
 */
export function readTextFile(path) {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = globalThis.__plannerFs;
    if (fs) return fs.readFileSync(path, 'utf8');
    throw new Error('برای خواندن فایل در Node، setFs(fs) را یک‌بار صدا بزنید.');
  }
  throw new Error('خواندن فایل در این محیط پشتیبانی نمی‌شود؛ شیء تنظیمات را مستقیم بدهید.');
}

/** تزریق fs برای محیط Node (CLI این کار را خودکار انجام می‌دهد) */
export function setFs(fsImpl) {
  globalThis.__plannerFs = fsImpl;
}

export function normalizePriority(v) {
  if (typeof v === 'boolean' || v === null || v === undefined) return 2;
  if (typeof v === 'number') return Math.min(3, Math.max(1, Math.round(v)));
  const s = enNum(String(v)).trim().toLowerCase();
  if (['1', '2', '3'].includes(s)) return Number(s);
  const table = {
    'بالا': 1, 'زیاد': 1, high: 1, 'مهم': 1,
    'متوسط': 2, 'وسط': 2, medium: 2, normal: 2,
    'پایین': 3, 'کم': 3, low: 3,
  };
  return table[s] || 2;
}

/**
 * خواندن فایل تنظیمات (شیء یا مسیر)
 * @returns {{cfg:object, weekStart:Date, dayStart:number, dayEnd:number, active:number[], tasks:Array, warnings:string[]}}
 */
export function loadConfig(input, today = new Date()) {
  const cfg = typeof input === 'string' ? JSON.parse(readTextFile(input)) : input;
  const warnings = [];

  let weekStart = null;
  if (cfg.week_start) {
    const d = parseDkey(enNum(String(cfg.week_start)).trim());
    if (d) weekStart = d;
    else warnings.push('week_start نامعتبر است؛ از هفتهٔ جاری استفاده شد.');
  }
  if (!weekStart) weekStart = saturdayOfWeek(today);

  let dayStart = parseHHMM(cfg.day_start ?? '08:00', 8 * 60);
  let dayEnd = parseHHMM(cfg.day_end ?? '22:00', 22 * 60);
  if (dayEnd <= dayStart) {
    warnings.push('day_end باید بعد از day_start باشد؛ از مقادیر پیش‌فرض استفاده شد.');
    dayStart = 8 * 60;
    dayEnd = 22 * 60;
  }

  let active = cfg.days;
  if (!Array.isArray(active) || !active.length) active = [0, 1, 2, 3, 4, 5, 6];
  const set = new Set(active.filter((d) => typeof d === 'number' && d >= 0 && d <= 6).map((d) => d % 7));
  active = set.size ? [...set].sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6];

  let tasks = cfg.tasks;
  if (!Array.isArray(tasks)) tasks = [];
  return { cfg, weekStart, dayStart, dayEnd, active, tasks, warnings };
}

/* ─────────────────────────── زمان‌بند ─────────────────────────── */

export class DayPlan {
  constructor(idx, date) {
    this.idx = idx;
    this.date = date;
    this.blocks = [];
    this._free = null;
  }

  invalidate() { this._free = null; }

  /** بازه‌های خالی روز داخل [ws, we) */
  freeIntervals(ws, we) {
    if (this._free === null) {
      const busy = this.blocks
        .map((b) => [Math.max(b.start, ws), Math.min(b.end, we)])
        .filter(([s, e]) => s < e)
        .sort((a, b) => a[0] - b[0]);
      const free = [];
      let cur = ws;
      for (const [s, e] of busy) {
        if (s > cur) free.push([cur, s]);
        cur = Math.max(cur, e);
      }
      if (cur < we) free.push([cur, we]);
      this._free = free;
    }
    return this._free;
  }

  freeMinutes(ws, we, window = null) {
    const free = this.freeIntervals(ws, we);
    if (!window) return free.reduce((a, [s, e]) => a + (e - s), 0);
    const [w1, w2] = WINDOWS[window];
    return free.reduce((a, [s, e]) => (Math.max(s, w1) < Math.min(e, w2)
      ? a + Math.min(e, w2) - Math.max(s, w1) : a), 0);
  }
}

/** اولین جای خالی مناسب؛ خروجی: [[s,e], ignoredWindow] یا [null,false] */
export function findSlot(free, dur, window) {
  const fits = (list) => list.filter(([s, e]) => e - s >= dur).sort((a, b) => a[0] - b[0]);
  if (window) {
    const [w1, w2] = WINDOWS[window];
    const cands = fits(free
      .map(([s, e]) => [Math.max(s, w1), Math.min(e, w2)])
      .filter(([s, e]) => s < e));
    if (cands.length) return [cands[0], false];
    const loose = fits(free);
    if (loose.length) return [loose[0], true];
    return [null, false];
  }
  const loose = fits(free);
  return loose.length ? [loose[0], false] : [null, false];
}

/** زمان‌بندی کامل هفته؛ خروجی Map<روز، DayPlan> */
export function scheduleWeek(weekStart, active, dayStart, dayEnd, tasks, warnings) {
  const days = new Map();
  for (const i of active) days.set(i, new DayPlan(i, addDays(weekStart, i)));

  const fixedTasks = [];
  const flexTasks = [];

  tasks.forEach((raw, k) => {
    const i = k + 1;
    if (!raw || typeof raw !== 'object' || !raw.title) {
      warnings.push(`کار ${faNum(i)}: عنوان ندارد؛ نادیده گرفته شد.`);
      return;
    }
    const t = { ...raw };
    t._pr = normalizePriority(t.priority);
    t._dur = parseDuration(t.duration, 60);
    if (t.window && !WINDOWS[t.window]) {
      warnings.push(`کار ${faNum(i)}: پنجرهٔ «${t.window}» نامعتبر است (صبح/ظهر/عصر/شب).`);
      t.window = null;
    }
    const rng = t.time ? parseRange(t.time) : null;
    if (t.time && rng === null) {
      warnings.push(`کار ${faNum(i)} («${t.title}»): قالب ساعت نامفهوم است؛ به‌صورت انعطاف‌پذیر چیده شد.`);
    }
    t._rng = rng;
    (rng ? fixedTasks : flexTasks).push([i, t]);
  });

  /* مرحله ۱: کارهای ساعت‌ثابت */
  for (const [i, t] of fixedTasks) {
    const dlist = resolveDays(t, active, warnings, i);
    if (!dlist.length) {
      warnings.push(`کار ${faNum(i)} («${t.title}»): هیچ‌کدام از روزهایش در روزهای فعال هفته نیست.`);
      continue;
    }
    const [s, e] = t._rng;
    if (s < dayStart || e > dayEnd) {
      warnings.push(`کار ${faNum(i)} («${t.title}»): بیرون از بازهٔ روز (${fmtTime(dayStart)} تا ${fmtTime(dayEnd)}) است ولی ثبت شد.`);
    }
    for (const di of dlist) {
      for (const b of days.get(di).blocks) {
        if (s < b.end && e > b.start) {
          warnings.push(`تداخل: «${t.title}» با «${b.title}» در ${DAY_NAMES[di]} هم‌پوشانی دارند.`);
        }
      }
      days.get(di).blocks.push({
        start: s, end: e, title: t.title, kind: 'fixed',
        priority: t._pr, notes: t.notes ?? null, window: null, part: null,
      });
      days.get(di).invalidate();
    }
  }

  /* مرحله ۲: کارهای انعطاف‌پذیر (اولویت، بعد بلندترها) */
  flexTasks.sort((a, b) => (a[1]._pr - b[1]._pr)
    || (b[1]._dur - a[1]._dur)
    || String(a[1].title).localeCompare(String(b[1].title)));

  for (const [i, t] of flexTasks) {
    const cand = resolveDays(t, active, warnings, i);
    if (!cand.length) {
      warnings.push(`کار ${faNum(i)} («${t.title}»): روز هدفی باقی نماند؛ جا نیفتاد.`);
      continue;
    }
    const explicit = t.days !== undefined || 'day' in t;
    let need = Math.trunc(t.per_week ?? (explicit ? cand.length : (t.every_day ? active.length : 1)));
    need = Math.max(1, Math.min(need, cand.length));
    const usedDays = new Set();
    let placed = 0;

    for (let n = 0; n < need; n += 1) {
      let best = null;
      let bestScore = -1;
      let bestFlag = false;
      for (const di of cand) {
        if (usedDays.has(di)) continue;
        const [slot, ignored] = findSlot(days.get(di).freeIntervals(dayStart, dayEnd), t._dur, t.window);
        if (!slot) continue;
        const score = days.get(di).freeMinutes(dayStart, dayEnd, t.window) - di * 0.01;
        if (score > bestScore) {
          best = [di, slot];
          bestScore = score;
          bestFlag = ignored;
        }
      }
      if (!best) {
        if (t.split && t._dur >= 60) {
          if (trySplit(days, cand, t, dayStart, dayEnd, usedDays)) {
            placed += 2;
            need -= 1;
            continue;
          }
        }
        warnings.push(`«${t.title}»: جای خالی ${fmtDur(t._dur)}${t.window ? ` در پنجرهٔ ${t.window}` : ''} پیدا نشد`
          + (t.split ? ' و به دو بخش تقسیم هم نشد.' : ' (با "split": true اجازهٔ تقسیم بده).'));
        break;
      }
      const [di, [s]] = best;
      if (bestFlag) {
        warnings.push(`«${t.title}» در ${DAY_NAMES[di]} خارج از پنجرهٔ «${t.window}» چیده شد (جایی نبود).`);
      }
      days.get(di).blocks.push({
        start: s, end: s + t._dur, title: t.title, kind: 'flex',
        priority: t._pr, notes: t.notes ?? null, window: t.window ?? null, part: null,
      });
      days.get(di).invalidate();
      usedDays.add(di);
      placed += 1;
    }
    void placed;
  }

  for (const d of days.values()) d.blocks.sort((a, b) => a.start - b.start);
  return days;
}

/** شکستن کار به دو بخش در دو بازهٔ خالیِ یک روز */
export function trySplit(days, cand, t, dayStart, dayEnd, usedDays) {
  const scored = [];
  for (const di of cand) {
    if (usedDays.has(di)) continue;
    const free = days.get(di).freeIntervals(dayStart, dayEnd);
    const gaps = free.map(([s, e]) => [e - s, s, e]).sort((a, b) => b[0] - a[0]).slice(0, 2);
    if (gaps.length === 2 && gaps[0][0] + gaps[1][0] >= t._dur
      && gaps[0][0] >= 30 && gaps[1][0] >= 30) {
      scored.push([gaps[0][0] + gaps[1][0], di, gaps]);
    }
  }
  if (!scored.length) return false;
  scored.sort((a, b) => a[0] - b[0]);
  const [, di, [g1, g2]] = scored[scored.length - 1];
  const d1 = Math.min(g1[0], t._dur - 30);
  const d2 = t._dur - d1;
  const pairs = [[g1, d1, '۱ از ۲'], [g2, d2, '۲ از ۲']];
  for (const [[gl, gs], dd, part] of pairs) {
    void gl;
    days.get(di).blocks.push({
      start: gs, end: gs + dd, title: t.title, kind: 'flex',
      priority: t._pr, notes: t.notes ?? null, window: null, part,
    });
  }
  days.get(di).invalidate();
  usedDays.add(di);
  return true;
}

/** آمار کلی هفته */
export function weekStats(days) {
  let blocks = 0;
  let minutes = 0;
  for (const d of days.values()) {
    blocks += d.blocks.length;
    minutes += d.blocks.reduce((a, b) => a + (b.end - b.start), 0);
  }
  return { blocks, minutes };
}
