#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
برنامه‌ریز هفتگی
════════════════════════════════════════════════════════════
کارهای هفته‌ات را در tasks.json بنویس؛ این اسکریپت آن‌ها را
در بهترین بازه‌های خالی روزها می‌چیند و خروجی HTML (آمادهٔ
پرینت) و PDF می‌سازد. تقویم: شمسی + میلادی، هفته از شنبه.

اجرا:
    pip install -r requirements.txt
    python3 planner.py                # خواندن tasks.json و ساخت خروجی
    python3 planner.py --no-pdf       # فقط HTML
    python3 planner.py --week 2026-09-12
    python3 planner.py --input my.json --out myout
"""

import argparse
import base64
import json
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent
FONT_DIR = BASE / "fonts"


def today_local() -> date:
    """تاریخ امروز به وقت ایران (اگر منطقهٔ زمانی در دسترس نبود، UTC+3:30)"""
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("Asia/Tehran")).date()
    except Exception:
        return datetime.utcfromtimestamp(time.time() + 3.5 * 3600).date()

# ─────────────────────────── ثابت‌ها ───────────────────────────
FA_MAP = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
EN_MAP = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")

DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"]
J_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"]
G_MONTHS = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
            "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"]

PRIORITY_NAME = {1: "بالا", 2: "متوسط", 3: "پایین"}
PRIORITY_COLOR = {1: "#e11d48", 2: "#d97706", 3: "#059669"}
PRIORITY_TINT = {1: "#ffe4e6", 2: "#fef3c7", 3: "#d1fae5"}
PRIORITY_PDF = {1: (225, 29, 72), 2: (217, 119, 6), 3: (5, 150, 105)}
FIXED_COLOR = "#b45309"
FIXED_PDF = (180, 83, 9)

WINDOWS = {"صبح": (360, 720), "ظهر": (720, 1020), "عصر": (1020, 1260), "شب": (1260, 1440)}


def fa_num(x):
    """تبدیل ارقام لاتین به فارسی"""
    return str(x).translate(FA_MAP)


def en_num(s):
    """تبدیل ارقام فارسی/عربی به لاتین"""
    return str(s).translate(EN_MAP)


# ─────────────────────────── تبدیل تاریخ ───────────────────────────
def gregorian_to_jalali(gy, gm, gd):
    """تبدیل میلادی به شمسی (الگوریتم استاندارد)"""
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) \
        + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm = 1 + (days // 31)
        jd = 1 + (days % 31)
    else:
        jm = 7 + ((days - 186) // 30)
        jd = 1 + ((days - 186) % 30)
    return jy, jm, jd


def day_index(d: date) -> int:
    """ایندکس روز هفته با مبنا شنبه (۰=شنبه … ۶=جمعه)"""
    return (d.weekday() + 2) % 7


def saturday_of_week(d: date) -> date:
    return d - timedelta(days=day_index(d))


def jalali_str(d: date, with_weekday=True) -> str:
    jy, jm, jd = gregorian_to_jalali(d.year, d.month, d.day)
    s = f"{fa_num(jd)} {J_MONTHS[jm - 1]} {fa_num(jy)}"
    return f"{DAY_NAMES[day_index(d)]} {s}" if with_weekday else s


def gregorian_str(d: date, with_weekday=True) -> str:
    s = f"{fa_num(d.day)} {G_MONTHS[d.month - 1]} {fa_num(d.year)}"
    return f"{DAY_NAMES[day_index(d)]} {s}" if with_weekday else s


# ─────────────────────────── زمان و مدت ───────────────────────────
def parse_hhmm(s, default=None):
    """"۹:۳۰" یا "09:30" → دقیقه از نیمه‌شب"""
    s = en_num(str(s)).strip().replace("٫", ":").replace("،", ":")
    m = re.fullmatch(r"(\d{1,2})(?::(\d{1,2}))?", s)
    if not m:
        return default
    h, mi = int(m.group(1)), int(m.group(2) or 0)
    if h > 24 or mi > 59:
        return default
    return h * 60 + mi


def parse_range(s):
    """"10:00 تا 12:00" یا "9-11:30" → (شروع، پایان)"""
    parts = re.split(r"\s*(?:تا|–|—|-|to)\s*", en_num(str(s)).strip())
    if len(parts) == 2:
        a, b = parse_hhmm(parts[0]), parse_hhmm(parts[1])
        if a is not None and b is not None and b > a:
            return a, b
    return None


def parse_duration(v, default=60):
    """مدت به دقیقه: عدد، "1:30" یا "۱٫۵ ساعت" """
    if v is None:
        return default
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return int(v * 60) if v < 8 and isinstance(v, float) else int(v)
    s = en_num(str(v)).strip()
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", s)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    m = re.search(r"([\d.]+)\s*(ساعت|hour|h)", s)
    if m:
        return int(float(m.group(1)) * 60)
    m = re.search(r"(\d+)\s*(دقیقه|min)?", s)
    if m:
        return int(m.group(1))
    return default


def fmt_time(minutes) -> str:
    return fa_num(f"{minutes // 60:02d}:{minutes % 60:02d}")


def fmt_range(s, e) -> str:
    return f"{fmt_time(s)} تا {fmt_time(e)}"


def fmt_dur(m) -> str:
    h, mm = divmod(int(m), 60)
    if h and mm:
        return f"{fa_num(h)} ساعت و {fa_num(mm)} دقیقه"
    if h:
        return f"{fa_num(h)} ساعت"
    return f"{fa_num(mm)} دقیقه"


# ─────────────────────────── خواندن تنظیمات ───────────────────────────
def norm_day(s):
    return re.sub(r"[\s\u200c]+", "", en_num(str(s)))


def resolve_days(task, active, warnings, tindex):
    """استخراج روزهای هدف کار از days/day/هرروز"""
    raw = task.get("days")
    if raw is None and "day" in task:
        raw = [task["day"]]
    if raw is None:
        return list(active)
    if isinstance(raw, str):
        if norm_day(raw) in ("دائی", "هرروز", "روزانه", "daily", "everyday", "all"):
            return list(active)
        raw = [raw]
    out = set()
    for item in raw:
        if isinstance(item, bool):
            continue
        if isinstance(item, int):
            if 0 <= item <= 6:
                out.add(item)
            continue
        n = norm_day(item)
        matched = False
        for i, name in enumerate(DAY_NAMES):
            if n == norm_day(name) or n in (["sat", "sun", "mon", "tue", "wed", "thu", "fri"][i],):
                out.add(i)
                matched = True
                break
        if not matched:
            warnings.append(f"کار {fa_num(tindex)}: روز نامعتبر «{item}» نادیده گرفته شد.")
    return sorted(out & set(active)) or (list(active) if not out else [])


def normalize_priority(v):
    if isinstance(v, bool) or v is None:
        return 2
    if isinstance(v, int):
        return min(3, max(1, v))
    s = en_num(str(v)).strip().lower()
    if s in ("1", "2", "3"):
        return int(s)
    table = {"بالا": 1, "زیاد": 1, "high": 1, "مهم": 1,
             "متوسط": 2, "وسط": 2, "medium": 2, "normal": 2,
             "پایین": 3, "کم": 3, "low": 3}
    return table.get(s, 2)


def load_config(path: Path):
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    warnings = []

    week_start = None
    if cfg.get("week_start"):
        m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", en_num(str(cfg["week_start"])).strip())
        if m:
            week_start = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        else:
            warnings.append("week_start نامعتبر است؛ از هفتهٔ جاری استفاده شد.")
    if week_start is None:
        week_start = saturday_of_week(today_local())

    day_start = parse_hhmm(cfg.get("day_start", "08:00"), 8 * 60)
    day_end = parse_hhmm(cfg.get("day_end", "22:00"), 22 * 60)
    if day_end <= day_start:
        warnings.append("day_end باید بعد از day_start باشد؛ از مقادیر پیش‌فرض استفاده شد.")
        day_start, day_end = 8 * 60, 22 * 60

    active = cfg.get("days", [0, 1, 2, 3, 4, 5, 6])
    if not isinstance(active, list) or not active:
        active = [0, 1, 2, 3, 4, 5, 6]
    active = sorted({d % 7 for d in active if isinstance(d, int) and 0 <= d <= 6} or set(range(7)))

    tasks = cfg.get("tasks", [])
    if not isinstance(tasks, list):
        tasks = []
    return cfg, week_start, day_start, day_end, active, tasks, warnings


# ─────────────────────────── زمان‌بند ───────────────────────────
class DayPlan:
    def __init__(self, idx: int, d: date):
        self.idx = idx
        self.date = d
        self.blocks = []          # dict ها: start,end,title,kind,priority,notes,window,part
        self._free = None

    def invalidate(self):
        self._free = None

    def free_intervals(self, ws, we):
        if self._free is None:
            busy = sorted((max(b["start"], ws), min(b["end"], we))
                          for b in self.blocks if max(b["start"], ws) < min(b["end"], we))
            free, cur = [], ws
            for s, e in busy:
                if s > cur:
                    free.append((cur, s))
                cur = max(cur, e)
            if cur < we:
                free.append((cur, we))
            self._free = free
        return self._free

    def free_minutes(self, ws, we, window=None):
        free = self.free_intervals(ws, we)
        if window is None:
            return sum(e - s for s, e in free)
        w1, w2 = WINDOWS[window]
        return sum(min(e, w2) - max(s, w1) for s, e in free if max(s, w1) < min(e, w2))

    def window_covered(self, ws, we):
        """آیا پنجرهٔ هدف کاملاً بیرون از بازهٔ روز است؟"""
        return True


def find_slot(free, dur, window):
    """اولین جای خالی مناسب؛ خروجی: (slot یا None، آیا پنجره نادیده گرفته شد)"""
    if window:
        w1, w2 = WINDOWS[window]
        cands = [(max(s, w1), min(e, w2)) for s, e in free if max(s, w1) < min(e, w2)]
        cands = [(s, e) for s, e in cands if e - s >= dur]
        if cands:
            return min(cands, key=lambda t: t[0]), False
        cands = [(s, e) for s, e in free if e - s >= dur]
        if cands:
            return min(cands, key=lambda t: t[0]), True
        return None, False
    cands = [(s, e) for s, e in free if e - s >= dur]
    if cands:
        return min(cands, key=lambda t: t[0]), False
    return None, False


def schedule_week(week_start, active, day_start, day_end, tasks, warnings):
    days = {i: DayPlan(i, week_start + timedelta(days=i)) for i in active}

    # ── مرحله ۱: کارهای ساعت‌ثابت
    fixed_tasks, flex_tasks = [], []
    for i, t in enumerate(tasks, 1):
        if not isinstance(t, dict) or not t.get("title"):
            warnings.append(f"کار {fa_num(i)}: عنوان ندارد؛ نادیده گرفته شد.")
            continue
        t = dict(t)
        t["_pr"] = normalize_priority(t.get("priority"))
        t["_dur"] = parse_duration(t.get("duration"), 60)
        if t.get("window") and t["window"] not in WINDOWS:
            warnings.append(f"کار {fa_num(i)}: پنجرهٔ «{t['window']}» نامعتبر است (صبح/ظهر/عصر/شب).")
            t["window"] = None
        rng = parse_range(t["time"]) if t.get("time") else None
        if t.get("time") and rng is None:
            warnings.append(f"کار {fa_num(i)} («{t['title']}»): قالب ساعت نامفهوم است؛ به‌صورت انعطاف‌پذیر چیده شد.")
        t["_rng"] = rng
        (fixed_tasks if rng else flex_tasks).append((i, t))

    for i, t in fixed_tasks:
        dlist = resolve_days(t, active, warnings, i)
        if not dlist:
            warnings.append(f"کار {fa_num(i)} («{t['title']}»): هیچ‌کدام از روزهایش در روزهای فعال هفته نیست.")
            continue
        s, e = t["_rng"]
        if s < day_start or e > day_end:
            warnings.append(f"کار {fa_num(i)} («{t['title']}»): بیرون از بازهٔ روز ({fmt_time(day_start)} تا {fmt_time(day_end)}) است ولی ثبت شد.")
        for di in dlist:
            for b in days[di].blocks:
                if s < b["end"] and e > b["start"]:
                    warnings.append(f"تداخل: «{t['title']}» با «{b['title']}» در {DAY_NAMES[di]} هم‌پوشانی دارند.")
            days[di].blocks.append({"start": s, "end": e, "title": t["title"], "kind": "fixed",
                                    "priority": t["_pr"], "notes": t.get("notes"), "window": None, "part": None})
            days[di].invalidate()

    # ── مرحله ۲: کارهای انعطاف‌پذیر (به ترتیب اولویت، بلندها اول)
    flex_tasks.sort(key=lambda it: (it[1]["_pr"], -it[1]["_dur"], str(it[1]["title"])))
    for i, t in flex_tasks:
        cand = resolve_days(t, active, warnings, i)
        if not cand:
            warnings.append(f"کار {fa_num(i)} («{t['title']}»): روز هدفی باقی نماند؛ جا نیفتاد.")
            continue
        explicit = t.get("days") is not None or "day" in t
        need = int(t.get("per_week", len(cand) if explicit else (len(active) if t.get("every_day") else 1)))
        need = max(1, min(need, len(cand)))
        used_days, placed = set(), 0

        for _ in range(need):
            best, best_score, best_flag = None, -1, False
            for di in cand:
                if di in used_days:
                    continue
                slot, ignored = find_slot(days[di].free_intervals(day_start, day_end), t["_dur"], t.get("window"))
                if slot is None:
                    continue
                score = days[di].free_minutes(day_start, day_end, t.get("window")) - di * 0.01
                if score > best_score:
                    best, best_score, best_flag = (di, slot), score, ignored
            if best is None:
                # تلاش برای شکستن کار به دو بخش
                if t.get("split") and t["_dur"] >= 60:
                    if try_split(days, cand, t, day_start, day_end, used_days):
                        placed += 2
                        need -= 1
                        continue
                warnings.append(f"«{t['title']}»: جای خالی {fmt_dur(t['_dur'])}{' در پنجرهٔ ' + t['window'] if t.get('window') else ''} پیدا نشد"
                                + (" و به دو بخش تقسیم هم نشد." if t.get("split") else " (با \"split\": true اجازهٔ تقسیم بده)."))
                break
            di, (s, e) = best
            e2 = s + t["_dur"]
            if best_flag:
                warnings.append(f"«{t['title']}» در {DAY_NAMES[di]} خارج از پنجرهٔ «{t['window']}» چیده شد (جایی نبود).")
            days[di].blocks.append({"start": s, "end": e2, "title": t["title"], "kind": "flex",
                                    "priority": t["_pr"], "notes": t.get("notes"),
                                    "window": t.get("window"), "part": None})
            days[di].invalidate()
            used_days.add(di)
            placed += 1

    for di in days:
        days[di].blocks.sort(key=lambda b: b["start"])
    return days


def try_split(days, cand, t, day_start, day_end, used_days):
    """شکستن کار به دو بخش در دو بازهٔ خالیِ یک روز"""
    scored = []
    for di in cand:
        if di in used_days:
            continue
        free = days[di].free_intervals(day_start, day_end)
        gaps = sorted(((e - s, s, e) for s, e in free), reverse=True)[:2]
        if len(gaps) == 2 and gaps[0][0] + gaps[1][0] >= t["_dur"] \
                and gaps[0][0] >= 30 and gaps[1][0] >= 30:
            scored.append((gaps[0][0] + gaps[1][0], di, gaps))
    if not scored:
        return False
    _, di, (g1, g2) = max(scored)
    d1 = min(g1[0], t["_dur"] - 30)
    d2 = t["_dur"] - d1
    for (gl, gs, ge), dd, part in ((g1, d1, "۱ از ۲"), (g2, d2, "۲ از ۲")):
        days[di].blocks.append({"start": gs, "end": gs + dd, "title": t["title"], "kind": "flex",
                                "priority": t["_pr"], "notes": t.get("notes"), "window": None, "part": part})
    days[di].invalidate()
    used_days.add(di)
    return True


# ─────────────────────────── خروجی HTML ───────────────────────────
def b64_font(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode() if path.exists() else ""


def build_html(days, week_start, day_start, day_end, warnings):
    reg = b64_font(FONT_DIR / "Vazirmatn-Regular.woff2")
    med = b64_font(FONT_DIR / "Vazirmatn-Medium.woff2")
    bold = b64_font(FONT_DIR / "Vazirmatn-Bold.woff2")

    fontfaces = ""
    if reg:
        fontfaces += f"@font-face{{font-family:'Vazirmatn';font-weight:400;src:url(data:font/woff2;base64,{reg}) format('woff2');}}"
    if med:
        fontfaces += f"@font-face{{font-family:'Vazirmatn';font-weight:500;src:url(data:font/woff2;base64,{med}) format('woff2');}}"
    if bold:
        fontfaces += f"@font-face{{font-family:'Vazirmatn';font-weight:700;src:url(data:font/woff2;base64,{bold}) format('woff2');}}"

    css = """
:root{--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--bg:#eef2f7;--card:#ffffff;--accent:#4f46e5;
--fixed:#b45309;--p1:#e11d48;--p2:#d97706;--p3:#059669}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Vazirmatn',Tahoma,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);
padding:28px 18px 60px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wrap{max-width:1080px;margin:0 auto}
header.top{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px 28px;
display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;margin-bottom:22px;
box-shadow:0 10px 30px rgba(15,23,42,.06)}
h1{font-size:24px;font-weight:800;display:flex;align-items:center;gap:10px}
h1 .logo{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
display:inline-flex;align-items:center;justify-content:center;color:#fff}
.range{color:var(--muted);font-size:14px;margin-top:6px;line-height:1.9}
.range b{color:var(--ink);font-weight:600}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{background:#eef2ff;color:#4338ca;border:1px solid #e0e7ff;border-radius:999px;
padding:5px 12px;font-size:12.5px;font-weight:600;white-space:nowrap}
.toolbar{display:flex;gap:10px;align-items:center;justify-content:center;margin-bottom:20px}
.btn{background:var(--accent);color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:14px;
font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(79,70,229,.35)}
.btn:hover{filter:brightness(1.08)}
.hint{color:var(--muted);font-size:12.5px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;
display:flex;flex-direction:column;box-shadow:0 6px 18px rgba(15,23,42,.05);break-inside:avoid;page-break-inside:avoid}
.card.today{border-color:#818cf8;box-shadow:0 8px 24px rgba(79,70,229,.14)}
.card-h{padding:13px 18px 11px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.card-h .dname{font-size:16px;font-weight:800}
.card-h .today-badge{background:#4f46e5;color:#fff;border-radius:999px;font-size:10.5px;padding:2px 9px;margin-right:6px;vertical-align:2px}
.card-h .jdate{font-size:12px;color:var(--muted)}
.card-sub{padding:5px 18px 0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
.rows{padding:8px 10px 6px;flex:1}
.row{display:grid;grid-template-columns:88px 1fr;gap:8px;padding:8px 6px;border-radius:10px;align-items:start}
.row+.row{border-top:1px dashed var(--line)}
.row .t{font-weight:800;font-size:13px;letter-spacing:.2px;line-height:1.5}
.row .t .till{display:block;font-size:10.5px;color:var(--muted);font-weight:500}
.row .t .bar{display:inline-block;width:4px;height:26px;border-radius:3px;background:var(--pc,#334155);
margin-left:7px;vertical-align:-7px}
.row.fixed .t{color:var(--fixed)}
.title{font-weight:700;font-size:13.5px;line-height:1.6}
.meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px;align-items:center}
.tag{font-size:10.5px;font-weight:700;border-radius:6px;padding:2px 8px}
.tag.fix{background:#fef3c7;color:#92400e;display:inline-flex;align-items:center;gap:4px}
.tag.win{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
.tag.pr{border-radius:999px}
.notes{font-size:11px;color:var(--muted);margin-top:3px;line-height:1.7}
.notes::before{content:'✎ ';opacity:.7}
.empty{color:#94a3b8;font-size:13px;text-align:center;padding:26px 0}
.card-f{border-top:1px solid var(--line);padding:9px 18px 11px;font-size:11.5px;color:var(--muted)}
.card-f .meter{height:5px;background:#eef2f7;border-radius:99px;margin-top:7px;overflow:hidden}
.card-f .meter i{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:99px}
.summary{margin-top:22px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 24px;
box-shadow:0 6px 18px rgba(15,23,42,.05)}
.summary h2{font-size:16px;font-weight:800;margin-bottom:12px}
.leg{display:flex;flex-wrap:wrap;gap:14px;font-size:12.5px;color:var(--muted)}
.leg span{display:inline-flex;align-items:center;gap:6px}
.leg i{width:11px;height:11px;border-radius:3px;display:inline-block}
.warns{margin-top:14px;border-top:1px dashed var(--line);padding-top:12px}
.warns h3{font-size:13px;color:#b45309;margin-bottom:8px}
.warns li{font-size:12.5px;color:#7c2d12;line-height:2;margin-right:18px}
footer.credit{text-align:center;color:#94a3b8;font-size:11.5px;margin-top:26px}
@media print{
 @page{size:A4;margin:9mm}
 body{background:#fff;padding:0;font-size:12px}
 .toolbar,.hint{display:none!important}
 header.top{box-shadow:none;border:1px solid #cbd5e1;border-radius:12px;padding:12px 16px;margin-bottom:10px}
 h1{font-size:18px}
 .grid{grid-template-columns:1fr 1fr;gap:8px}
 .card{box-shadow:none;border:1px solid #cbd5e1;border-radius:10px}
 .card.today{border-color:#6366f1}
 .summary{box-shadow:none;border:1px solid #cbd5e1;margin-top:10px;padding:12px 16px}
}
"""
    css = fontfaces + css

    lock_svg = ('<svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">'
                '<path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z"/></svg>')

    today = today_local()
    week_end = week_start + timedelta(days=6)

    total_blocks = sum(len(d.blocks) for d in days.values())
    total_minutes = sum(b["end"] - b["start"] for d in days.values() for b in d.blocks)
    span_j = f"شنبه {jalali_str(week_start, False)} تا جمعه {jalali_str(week_end, False)}"
    span_g = f"{gregorian_str(week_start, False)} تا {gregorian_str(week_end, False)}"

    parts = []
    parts.append(f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>برنامه هفتگی — {span_j}</title>
<style>{css}</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <div>
    <h1><span class="logo"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm14 8H3v10h18V10zM7 12h4v4H7v-4z"/></svg></span>برنامهٔ هفتگی من</h1>
    <div class="range"><b>{span_j}</b><br><span>{span_g}</span> &nbsp;•&nbsp; روز کاری: {fmt_time(day_start)} تا {fmt_time(day_end)}</div>
  </div>
  <div class="chips">
    <span class="chip">{fa_num(total_blocks)} کار زمان‌بندی‌شده</span>
    <span class="chip">مجموع {fmt_dur(total_minutes)}</span>
    <span class="chip">تولید: {jalali_str(today)}</span>
  </div>
</header>
<div class="toolbar no-print">
  <button class="btn" onclick="window.print()">🖨 چاپ / ذخیره به‌صورت PDF</button>
  <span class="hint">در پنجرهٔ چاپ، مقصد را «Save as PDF» انتخاب کن</span>
</div>
<div class="grid">
""")

    for di in sorted(days):
        d = days[di]
        is_today = d.date == today
        free = d.free_intervals(day_start, day_end)
        free_min = sum(e - s for s, e in free)
        planned = sum(b["end"] - b["start"] for b in d.blocks)
        span_min = day_end - day_start
        pct = min(100, int(planned * 100 / span_min)) if span_min else 0

        rows = []
        for b in d.blocks:
            pc = PRIORITY_COLOR[b["priority"]]
            tint = PRIORITY_TINT[b["priority"]]
            fixed = b["kind"] == "fixed"
            title = b["title"] + (f' <span style="color:#94a3b8;font-weight:600">({b["part"]})</span>' if b["part"] else "")
            tags = ""
            if fixed:
                tags += f'<span class="tag fix">{lock_svg} ساعت ثابت</span>'
            if b["window"]:
                tags += f'<span class="tag win">پنجره: {b["window"]}</span>'
            tags += (f'<span class="tag pr" style="background:{tint};color:{pc}">اولویت '
                     f'{PRIORITY_NAME[b["priority"]]}</span>')
            tags += f'<span class="tag win">{fmt_dur(b["end"] - b["start"])}</span>'
            notes = f'<div class="notes">{b["notes"]}</div>' if b.get("notes") else ""
            bar_color = FIXED_COLOR if fixed else pc
            rows.append(f"""<div class="row{' fixed' if fixed else ''}" style="--pc:{bar_color}">
<div class="t"><span class="bar"></span>{fmt_time(b["start"])}<span class="till">تا {fmt_time(b["end"])}</span></div>
<div><div class="title">{title}</div><div class="meta">{tags}</div>{notes}</div>
</div>""")
        body = "\n".join(rows) if rows else '<div class="empty">روز آزاد است — برنامه‌ای ثبت نشده 🌿</div>'

        free_txt = f"زمان آزاد: {fmt_dur(free_min)}" if free_min > 0 else "روز کاملاً پر شد"
        parts.append(f"""<section class="card{' today' if is_today else ''}">
<div class="card-h"><span class="dname">{DAY_NAMES[di]}{'<span class="today-badge">امروز</span>' if is_today else ''}</span>
<span class="jdate">{jalali_str(d.date, False)}</span></div>
<div class="card-sub"><span>{gregorian_str(d.date, False)}</span><span>{fa_num(len(d.blocks))} مورد</span></div>
<div class="rows">{body}</div>
<div class="card-f"><span>{free_txt}</span><div class="meter"><i style="width:{pct}%"></i></div></div>
</section>""")

    warn_html = ""
    if warnings:
        items = "\n".join(f"<li>{w}</li>" for w in warnings)
        warn_html = f'<div class="warns"><h3>⚠️ نکته‌ها و هشدارها</h3><ul>{items}</ul></div>'

    parts.append(f"""</div>
<section class="summary">
<h2>خلاصه</h2>
<div class="leg">
<span><i style="background:{FIXED_COLOR}"></i>ساعت ثابت (جلسه/کلاس)</span>
<span><i style="background:{PRIORITY_COLOR[1]}"></i>اولویت بالا</span>
<span><i style="background:{PRIORITY_COLOR[2]}"></i>اولویت متوسط</span>
<span><i style="background:{PRIORITY_COLOR[3]}"></i>اولویت پایین</span>
</div>
<p style="margin-top:10px;font-size:13px;color:var(--muted);line-height:2">
در این هفته <b style="color:var(--ink)">{fa_num(total_blocks)} کار</b> به مدت مجموع <b style="color:var(--ink)">{fmt_dur(total_minutes)}</b> زمان‌بندی شده است.
</p>
{warn_html}
</section>
<footer class="credit">ساخته‌شده با «برنامه‌ریز هفتگی» — برای تغییر برنامه، tasks.json را ویرایش و دوباره اجرا کن.</footer>
</div>
</body>
</html>""")
    return "\n".join(parts)


# ─────────────────────────── خروجی PDF ───────────────────────────
def build_pdf(days, week_start, day_start, day_end, warnings, out_path: Path):
    try:
        from fpdf import FPDF
    except ImportError:
        print("⚠️  برای PDF بستهٔ fpdf2 لازم است:  pip install fpdf2 arabic-reshaper python-bidi")
        return False

    use_shaping = True
    try:
        import uharfbuzz  # noqa: F401
        from fpdf import FPDF  # noqa: F401
    except ImportError:
        use_shaping = False

    reshaper = bidi = None
    if not use_shaping:
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display as bidi
            reshaper = arabic_reshaper
        except ImportError:
            print("⚠️  PDF فارسی نیازمند «fpdf2 uharfbuzz» یا «arabic-reshaper python-bidi» است؛ PDF ساخته نشد.")
            return False

    ft_reg = FONT_DIR / "Vazirmatn-Regular.ttf"
    ft_bold = FONT_DIR / "Vazirmatn-Bold.ttf"
    if not ft_reg.exists():
        print("⚠️  فونت Vazirmatn در پوشهٔ fonts پیدا نشد؛ PDF ساخته نشد.")
        return False

    def T(s: str) -> str:
        """آماده‌سازی متن فارسی برای رندر"""
        if use_shaping:
            return s
        return bidi(reshaper.reshape(s))

    pdf = FPDF(orientation="P", format="A4", unit="mm")
    pdf.set_auto_page_break(False)
    pdf.set_margins(8, 8, 8)
    pdf.add_font("Vazir", "", str(ft_reg))
    if ft_bold.exists():
        pdf.add_font("Vazir", "B", str(ft_bold))
    try:
        pdf.set_text_shaping(use_shaping)
    except Exception:
        pass

    W, H = 210, 297
    ML, MR, MT, MB = 8, 8, 8, 8
    CW = W - ML - MR
    INK = (15, 23, 42)
    MUT = (100, 116, 139)
    LINE = (203, 213, 225)
    ACC = (79, 70, 229)

    pdf.add_page()

    # ── سربرگ
    pdf.set_font("Vazir", "B", 15)
    pdf.set_text_color(*INK)
    pdf.set_xy(ML, 9)
    pdf.cell(CW, 8, T("برنامهٔ هفتگی من"), align="R")
    week_end = week_start + timedelta(days=6)
    span_j = f"شنبه {jalali_str(week_start, False)} تا جمعه {jalali_str(week_end, False)}"
    span_g = f"{gregorian_str(week_start, False)} — {gregorian_str(week_end, False)}"
    pdf.set_font("Vazir", "", 9.5)
    pdf.set_text_color(*MUT)
    pdf.set_xy(ML, 17)
    pdf.cell(CW, 5, T(f"{span_j}  |  {span_g}"), align="R")
    total_blocks = sum(len(d.blocks) for d in days.values())
    total_minutes = sum(b["end"] - b["start"] for d in days.values() for b in d.blocks)
    pdf.set_xy(ML, 22)
    pdf.cell(CW, 5, T(f"{fa_num(total_blocks)} کار • مجموع {fmt_dur(total_minutes)} • روز کاری: "
                      f"{fmt_time(day_start)} تا {fmt_time(day_end)}"), align="R")
    pdf.set_draw_color(*ACC)
    pdf.set_line_width(0.5)
    pdf.line(ML, 28.5, W - MR, 28.5)

    # ── شبکهٔ ۲×۴ (۷ روز + خلاصه)
    gx, gy = 3, 3
    top = 31.5
    avail_h = H - MB - top
    card_w = (CW - gx) / 2
    card_h = (avail_h - 3 * gy) / 4

    def clip_text(s, max_w):
        while pdf.get_string_width(s) > max_w and len(s) > 3:
            s = s[:-1]
        return s

    def draw_day_card(x, y, w, h, d):
        try:
            pdf.rect(x, y, w, h, style="D", round_corners=True, corner_radius=2.5)
        except TypeError:
            pdf.rect(x, y, w, h, style="D")
        # سربرگ کارت
        pdf.set_font("Vazir", "B", 10.5)
        pdf.set_text_color(*INK)
        pdf.set_xy(x + 3, y + 2.2)
        pdf.cell(w - 26, 5, T(DAY_NAMES[d.idx]), align="R")
        pdf.set_font("Vazir", "", 8)
        pdf.set_text_color(*MUT)
        pdf.set_xy(x + w - 24, y + 2.6)
        pdf.cell(21, 4.4, T(jalali_str(d.date, False)), align="L")
        pdf.set_font("Vazir", "", 6.8)
        pdf.set_xy(x + 3, y + 7.4)
        pdf.cell(w - 26, 3.4, T(gregorian_str(d.date, False)), align="R")
        free_min = sum(e - s for s, e in d.free_intervals(day_start, day_end))
        pdf.set_xy(x + w - 24, y + 7.4)
        pdf.cell(21, 3.4, T("آزاد: " + fmt_dur(free_min) if free_min else "پُر"), align="L")
        pdf.set_draw_color(*LINE)
        pdf.set_line_width(0.2)
        pdf.line(x + 3, y + 11.8, x + w - 3, y + 11.8)

        items = sorted(d.blocks, key=lambda b: b["start"])
        max_items = int((h - 14) // 6.1)
        extra = len(items) - max_items
        if extra > 0:
            items = items[:max_items]
        yy = y + 13
        for n, b in enumerate(items):
            if n % 2 == 1:
                pdf.set_fill_color(248, 250, 252)
                pdf.rect(x + 1.5, yy - 1, w - 3, 5.8, style="F")
            col = FIXED_PDF if b["kind"] == "fixed" else PRIORITY_PDF[b["priority"]]
            pdf.set_fill_color(*col)
            pdf.rect(x + w - 4.2, yy + 0.6, 1.3, 3.4, style="F")
            pdf.set_font("Vazir", "B", 7.6)
            pdf.set_text_color(*(FIXED_PDF if b["kind"] == "fixed" else INK))
            pdf.set_xy(x + w - 30, yy)
            pdf.cell(25, 4.6, T(fmt_time(b["start"]) + "–" + fmt_time(b["end"])), align="R")
            title = b["title"] + (f" ({b['part']})" if b["part"] else "")
            tw = w - 30 - 6
            pdf.set_font("Vazir", "", 7.8)
            while pdf.get_string_width(title) > tw and len(title) > 3:
                title = title[:-1]
            if title != b["title"]:
                title += "…"
            pdf.set_text_color(*INK)
            pdf.set_xy(x + 3, yy)
            pdf.cell(tw, 4.6, T(title), align="R")
            yy += 6.1
        if extra > 0:
            pdf.set_font("Vazir", "", 7)
            pdf.set_text_color(*MUT)
            pdf.set_xy(x + 3, yy)
            pdf.cell(w - 6, 4, T(f"… و {fa_num(extra)} مورد دیگر"), align="R")
        if not items:
            pdf.set_font("Vazir", "", 8)
            pdf.set_text_color(*MUT)
            pdf.set_xy(x + 3, yy + 2)
            pdf.cell(w - 6, 4, T("روز آزاد است"), align="R")

    def draw_summary_cell(x, y, w, h):
        try:
            pdf.rect(x, y, w, h, style="D", round_corners=True, corner_radius=2.5)
        except TypeError:
            pdf.rect(x, y, w, h, style="D")
        pdf.set_font("Vazir", "B", 10)
        pdf.set_text_color(*INK)
        pdf.set_xy(x + 3, y + 2.2)
        pdf.cell(w - 6, 5, T("خلاصه و راهنما"), align="R")
        pdf.set_draw_color(*LINE)
        pdf.set_line_width(0.2)
        pdf.line(x + 3, y + 9, x + w - 3, y + 9)
        yy = y + 11
        legend = [(FIXED_PDF, "ساعت ثابت (جلسه/کلاس)"),
                  (PRIORITY_PDF[1], "اولویت بالا"),
                  (PRIORITY_PDF[2], "اولویت متوسط"),
                  (PRIORITY_PDF[3], "اولویت پایین")]
        for col, label in legend:
            pdf.set_fill_color(*col)
            pdf.rect(x + w - 8, yy + 0.8, 3, 3, style="F")
            pdf.set_font("Vazir", "", 7.6)
            pdf.set_text_color(*INK)
            pdf.set_xy(x + 3, yy)
            pdf.cell(w - 12, 4.4, T(label), align="R")
            yy += 5
        yy += 1.5
        pdf.set_font("Vazir", "", 7.6)
        pdf.set_text_color(*MUT)
        pdf.set_xy(x + 3, yy)
        pdf.cell(w - 6, 4.4, T(f"مجموع: {fa_num(total_blocks)} کار — {fmt_dur(total_minutes)}"), align="R")
        yy += 5.5
        if warnings:
            pdf.set_font("Vazir", "", 6.9)
            pdf.set_text_color(146, 64, 14)
            max_w = w - 6
            shown = 0
            for wn in warnings:
                if yy > y + h - 6 or shown >= 4:
                    break
                line = "• " + wn
                while pdf.get_string_width(line) > max_w and len(line) > 4:
                    line = line[:-1]
                pdf.set_xy(x + 3, yy)
                pdf.cell(max_w, 3.9, T(line), align="R")
                yy += 4.2
                shown += 1

    sorted_days = [days[k] for k in sorted(days)]
    cells = sorted_days + [None]  # None = خلاصه
    for i, d in enumerate(cells):
        col, row = i % 2, i // 2
        x = ML + col * (card_w + gx)
        y = top + row * (card_h + gy)
        if d is None:
            draw_summary_cell(x, y, card_w, card_h)
        else:
            draw_day_card(x, y, card_w, card_h, d)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(out_path))
    return True


# ─────────────────────────── گزارش ترمینال ───────────────────────────
def terminal_report(days, week_start, warnings, html_path, pdf_ok, pdf_path):
    week_end = week_start + timedelta(days=6)
    total = sum(len(d.blocks) for d in days.values())
    line = "─" * 56
    print()
    print(line)
    print("✅  برنامهٔ هفتگی آماده شد")
    print(line)
    print(f"   هفته:  {jalali_str(week_start)}  تا  {jalali_str(week_end)}")
    print(f"          {gregorian_str(week_start)}  تا  {gregorian_str(week_end)}")
    print(f"   کارهای زمان‌بندی‌شده: {fa_num(total)}")
    for k in sorted(days):
        print(f"     • {DAY_NAMES[k]}: {fa_num(len(days[k].blocks))} مورد")
    if warnings:
        print(f"   ⚠️  {fa_num(len(warnings))} نکته (در خروجی هم آمده):")
        for w in warnings:
            print(f"     - {w}")
    print(f"   🌐 HTML: {html_path}")
    if pdf_ok:
        print(f"   📄 PDF : {pdf_path}")
    print(line)
    print("   برای پرینت: فایل HTML را در مرورگر باز کن و Ctrl+P بزن.")
    print()


# ─────────────────────────── main ───────────────────────────
def main():
    parser = argparse.ArgumentParser(description="برنامه‌ریز هفتگی — زمان‌بندی خودکار کارها با خروجی HTML/PDF")
    parser.add_argument("-i", "--input", default=str(BASE / "tasks.json"), help="مسیر فایل کارها (پیش‌فرض: tasks.json)")
    parser.add_argument("-o", "--out", default=str(BASE / "output"), help="پوشهٔ خروجی (پیش‌فرض: output)")
    parser.add_argument("--week", default=None, help="شنبهٔ شروع هفته به قالب 2026-09-12")
    parser.add_argument("--no-pdf", action="store_true", help="فقط HTML بساز")
    parser.add_argument("--quiet", action="store_true", help="گزارش ترمینال را کوتاه کن")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"❌ فایل {in_path} پیدا نشد. با گزینهٔ --input مسیرش را بده.")
        sys.exit(1)

    cfg, week_start, day_start, day_end, active, tasks, warnings = load_config(in_path)
    if args.week:
        m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", en_num(args.week).strip())
        if m:
            week_start = saturday_of_week(date(int(m.group(1)), int(m.group(2)), int(m.group(3))))
        else:
            warnings.append(f"--week نامعتبر: {args.week} (قالب درست: 2026-09-12)")

    if not tasks:
        warnings.append("هیچ کاری در فایل ورودی نیست.")

    days = schedule_week(week_start, active, day_start, day_end, tasks, warnings)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = out_dir / "weekly-plan.html"
    html_path.write_text(build_html(days, week_start, day_start, day_end, warnings), encoding="utf-8")

    pdf_ok = False
    pdf_path = out_dir / "weekly-plan.pdf"
    if not args.no_pdf:
        pdf_ok = build_pdf(days, week_start, day_start, day_end, warnings, pdf_path)

    if not args.quiet:
        terminal_report(days, week_start, warnings, html_path, pdf_ok, pdf_path)


if __name__ == "__main__":
    main()
