#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ابزار یک‌بارمصرف: تبدیل پچ‌های پایتونی (legacy-python/patch_vNN.py) به ماژول‌های Node.

هر پچ پایتونی از دو چیز ساخته شده:
  ۱) ثابت‌های متنی (SEED_OLD/SEED_NEW, CSS_ADD, …)
  ۲) لیست COMMON و چند فراخوانی apply(BASE/"file", ...) و slices

خروجی: src/patches/vNN.js با ساختار
    { version, title, files: [{ path, replacements, slices }] }
"""
import ast
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEGACY = ROOT / "legacy-python"
OUT = ROOT / "src" / "patches"

TRIPLE = ('"""', "'''")
QUOTES = ("'", '"')


def pyval(raw):
    """ارزش واقعی یک رشتهٔ پایتونی (با پردازش درست escape ها)"""
    try:
        v = ast.literal_eval(raw.strip())
        return v if isinstance(v, str) else None
    except Exception:
        return None


def collect_consts(src):
    consts = {}
    pattern = re.compile(
        r"^([A-Z][A-Z0-9_]*) = ('''[\s\S]*?'''|\"\"\"[\s\S]*?\"\"\"|'[^\n]*'|\"[^\n]*\")", re.M)
    for m in pattern.finditer(src):
        name, raw = m.group(1), m.group(2)
        v = pyval(raw)
        if v is not None:
            consts[name] = v
    return consts


def js_str(text):
    return json.dumps(text, ensure_ascii=False)


def _read_expr(s, i):
    """یک عبارت پایتونی را از i بخوان (رشتهٔ تک/دوتایی/سه‌گانه یا عبارت ساده)"""
    while i < len(s) and s[i] in " \n\t":
        i += 1
    if i >= len(s):
        return "", i
    for q in TRIPLE:
        if s.startswith(q, i):
            j = s.index(q, i + 3)
            return s[i:j + 3], j + 3
    if s[i] in QUOTES:
        quote = s[i]
        j = i + 1
        while j < len(s):
            if s[j] == "\\":
                j += 2
                continue
            if s[j] == quote:
                return s[i:j + 1], j + 1
            j += 1
        raise SystemExit("!! رشتهٔ بسته‌نشده")
    depth = 0
    j = i
    while j < len(s):
        c = s[j]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            if depth == 0:
                break
            depth -= 1
        elif c == "," and depth == 0:
            break
        j += 1
    return s[i:j].strip(), j


def unquote(raw):
    v = pyval(raw)
    if v is not None:
        return v
    for q in TRIPLE:
        if raw.startswith(q) and raw.endswith(q) and len(raw) >= 6:
            return raw[3:-3]
    if raw[:1] in QUOTES and raw[-1:] == raw[:1] and len(raw) >= 2:
        body = raw[1:-1]
        body = body.replace("\\'", "'").replace('\\"', '"')
        body = body.replace("\\\\", "\\").replace("\\n", "\n").replace("\\t", "\t")
        return body
    return None


def parse_reps(block, consts):
    """تاپل‌های (\"name\", OLD, NEW, cnt) → لیست dict"""
    reps = []
    i = 0
    while True:
        i = block.find("(", i)
        if i < 0:
            break
        i += 1
        parts = []
        while True:
            expr, i = _read_expr(block, i)
            parts.append(expr)
            if i < len(block) and block[i] == ",":
                i += 1
                continue
            break
        if i < len(block) and block[i] == ")":
            i += 1
        if len(parts) < 4:
            continue
        name = unquote(parts[0].strip())
        if name is None:
            continue

        def val(expr):
            expr = expr.strip()
            if expr in consts:
                return consts[expr]
            rm = re.fullmatch(r"(\w+)\.replace\((.+)\)", expr, re.S)
            if rm and rm.group(1) in consts:
                base = consts[rm.group(1)]
                args = [_read_expr(rm.group(2), 0)]
                parts = []
                seg = rm.group(2)
                i2 = 0
                while True:
                    a2, i2 = _read_expr(seg, i2)
                    parts.append(a2)
                    if i2 < len(seg) and seg[i2] == ",":
                        i2 += 1
                        continue
                    break
                pairs = [(unquote(x) or "") for x in parts]
                if len(pairs) == 2:
                    return base.replace(pairs[0], pairs[1])
            u = unquote(expr)
            if u is not None:
                return u
            raise SystemExit("!! expression نامشخص: " + expr[:60])

        reps.append({"name": name, "from": val(parts[1]), "to": val(parts[2]),
                     "fromRaw": unquote(parts[1].strip()), "toIsText": unquote(parts[2].strip()) is not None,
                     "count": int(parts[3].strip())})
    return reps


def list_block(src, name):
    m = re.search(r"^" + name + r" = \[(.*?)^\]", src, re.M | re.S)
    return m.group(1) if m else ""


def convert(path, version, title):
    src = path.read_text(encoding="utf-8")
    consts = collect_consts(src)
    common = parse_reps(list_block(src, "COMMON"), consts)

    files = []
    for m in re.finditer(r'apply\(BASE/"([^"]+)"', src):
        fname = m.group(1)
        rest = src[m.end():]
        depth = 0
        j = 0
        while j < len(rest):
            ch = rest[j]
            if ch in "[({":
                depth += 1
            elif ch in "])}":
                if depth == 0:
                    break
                depth -= 1
            j += 1
        call_args = rest[:j + 1]
        tail = rest[j + 1:]

        if call_args.startswith(", COMMON"):
            body = call_args[len(", COMMON"):].strip()
            if body.startswith("+"):
                body = body[1:].strip()
                local = parse_reps(body[1:body.rindex("]")], consts)
            else:
                local = []
            reps = common + local
        else:
            reps = parse_reps(call_args[1:call_args.rindex("]")], consts)

        slices = []
        sm = re.search(r"slices=\[(.*?)\]", tail, re.S)
        if sm:
            for sm2 in re.finditer(r'\(\s*"([^"]+)"\s*,\s*(.+?)\s*,\s*(.+?)\s*\)', sm.group(1)):
                def sv(expr):
                    expr = expr.strip()
                    if expr in consts:
                        return consts[expr]
                    return unquote(expr) or expr
                slices.append({"name": sm2.group(1), "start": sv(sm2.group(2)),
                               "end": sv(sm2.group(3)), "sliceConst": "MOBILE_CAL"})
        files.append({"path": fname, "replacements": reps, "slices": slices})

    for m in re.finditer(r'slice_cal\(BASE/"([^"]+)",\s*(\w+)\)', src):
        fname, cname = m.group(1), m.group(2)
        for f in files:
            if f["path"] == fname:
                f["slices"].append({"name": "calHTML", "start": "function calHTML(){",
                                    "end": "\nfunction ", "sliceConst": cname})
    return {"version": version, "title": title, "consts": consts, "files": files}


def emit(mod, out_path):
    lines = [
        "/**",
        " * پچ v%s (پورت Node از patch_v%s.py)" % (mod["version"], mod["version"]),
        " * %s" % mod["title"],
        " *",
        " * این فایل از نسخهٔ پایتونی تولید شده (legacy-python/convert_patches.py) و همان",
        " * جایگزینی‌ها را روی قالب‌های همان نسخه انجام می‌دهد.",
        " * اجرا: node scripts/apply-patch.js v%s --dir <پوشهٔ نسخهٔ قبل>" % mod["version"],
        " */",
        'export const version = %s;' % js_str(mod["version"]),
        'export const title = %s;' % js_str(mod["title"]),
        "",
        "export const files = [",
    ]
    for f in mod["files"]:
        lines.append("  {")
        lines.append("    path: %s," % js_str(f["path"]))
        lines.append("    replacements: [")
        for r in f["replacements"]:
            extra = ""
            if r.get("fromRaw") is not None and r["fromRaw"] != r["from"] and r["name"] != "extra-js":
                extra = ", fromRaw: %s" % js_str(r["fromRaw"])
            if r.get("toIsText"):
                extra += ", toIsText: true"
            lines.append("      { name: %s, from: %s, to: %s, count: %d%s }," % (
                js_str(r["name"]), js_str(r["from"]), js_str(r["to"]), r["count"], extra))
        lines.append("    ],")
        if f["slices"]:
            lines.append("    slices: [")
            for sl in f["slices"]:
                repl = mod["consts"].get(sl.get("sliceConst"), sl.get("replace", ""))
                lines.append("      { name: %s, start: %s, end: %s, replace: %s }," % (
                    js_str(sl["name"]), js_str(sl["start"]), js_str(sl["end"]), js_str(repl)))
            lines.append("    ],")
        lines.append("  },")
    lines += ["];", "", "export default { version, title, files };"]
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


TITLES = {
    "12": "کلاس‌های جدید، خانمم، حذف کونگ‌فو، اعلان نیم‌ساعت قبل",
    "13": "تم یِکا: خانهٔ تقویمی، تیک کارها، تقویم دو-تقویمی",
    "14": "هدر یِکا + یادآور نیم‌ساعت قبل برای هر کار",
    "15": "اضافه/حذف برنامهٔ هر روز + خانهٔ تقویمی دسکتاپ",
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for v in ("12", "13", "14", "15"):
        mod = convert(LEGACY / ("patch_v%s.py" % v), v, TITLES[v])
        emit(mod, OUT / ("v%s.js" % v))
        print("OK v%s → %d فایل، %d جایگزینی، %d slice" % (
            v, len(mod["files"]),
            sum(len(f["replacements"]) for f in mod["files"]),
            sum(len(f["slices"]) for f in mod["files"])))
