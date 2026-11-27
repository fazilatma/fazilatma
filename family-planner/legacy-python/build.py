#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ساخت نسخه‌های نهایی:
   planner-app.html    (دسکتاپ)
   planner-mobile.html (موبایل — قابل نصب روی گوشی)
هستهٔ منطق از core.js، فونت‌ها و آیکون/مانیفست به‌صورت inline تزریق می‌شود.
"""
import base64
import json
from pathlib import Path
from urllib.parse import quote

BASE = Path(__file__).resolve().parent
core = (BASE / "core.js").read_text(encoding="utf-8")

def b64font(name):
    return base64.b64encode((BASE / "fonts" / name).read_bytes()).decode()

def inject_fonts(html):
    return (html
        .replace("__FONT_R__", b64font("Vazirmatn-Regular.woff2"))
        .replace("__FONT_M__", b64font("Vazirmatn-Medium.woff2"))
        .replace("__FONT_B__", b64font("Vazirmatn-Bold.woff2")))

# ── دسکتاپ ──
desktop = (BASE / "app-template.html").read_text(encoding="utf-8")
assert "/*__CORE__*/" in desktop
desktop = desktop.replace("/*__CORE__*/", core)
desktop = inject_fonts(desktop)
(BASE / "planner-app.html").write_text(desktop, encoding="utf-8")
print(f"OK planner-app.html ({len(desktop)//1024} KB)")

# ── موبایل ──
svg_icon = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>"
    "<rect width='128' height='128' rx='28' fill='#4f46e5'/>"
    "<rect x='24' y='32' width='80' height='72' rx='10' fill='#ffffff'/>"
    "<rect x='24' y='32' width='80' height='18' rx='9' fill='#c7d2fe'/>"
    "<rect x='38' y='22' width='8' height='18' rx='4' fill='#ffffff'/>"
    "<rect x='82' y='22' width='8' height='18' rx='4' fill='#ffffff'/>"
    "<rect x='36' y='60' width='14' height='12' rx='3' fill='#818cf8'/>"
    "<rect x='57' y='60' width='14' height='12' rx='3' fill='#e0e7ff'/>"
    "<rect x='78' y='60' width='14' height='12' rx='3' fill='#e0e7ff'/>"
    "<rect x='36' y='80' width='14' height='12' rx='3' fill='#e0e7ff'/>"
    "<rect x='57' y='80' width='14' height='12' rx='3' fill '#e0e7ff'/>"
    "</svg>")

icon_uri = "data:image/svg+xml," + quote(svg_icon, safe="")

manifest = {
    "name": "برنامه‌ریز من",
    "short_name": "برنامه‌ریز",
    "dir": "rtl",
    "lang": "fa",
    "start_url": ".",
    "scope": ".",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#eef2f7",
    "theme_color": "#4f46e5",
    "icons": [
        {"src": icon_uri, "sizes": "any", "type": "image/svg+xml", "purpose": "any"}
    ],
}
manifest_uri = "data:application/manifest+json," + quote(json.dumps(manifest, ensure_ascii=False), safe="")

mobile = (BASE / "app-mobile-template.html").read_text(encoding="utf-8")
assert "/*__CORE__*/" in mobile and "__MANIFEST__" in mobile
mobile = mobile.replace("/*__CORE__*/", core)
mobile = mobile.replace("__MANIFEST__", manifest_uri.replace("&", "&amp;"))
mobile = mobile.replace("__ICON__", icon_uri.replace("&", "&amp;"))
mobile = inject_fonts(mobile)
(BASE / "planner-mobile.html").write_text(mobile, encoding="utf-8")
print(f"OK planner-mobile.html ({len(mobile)//1024} KB)")
