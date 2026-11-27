# 🗄 بایگانی نسخهٔ پایتونی

این پوشه فقط برای **مرجع تاریخی** نگه داشته شده است. هیچ بخشی از پروژهٔ فعلی به آن وابسته نیست:

- `planner.py` — تولید HTML + PDF برنامهٔ هفته (معادل فعلی: `src/cli.js` + `src/html.js` + `src/pdf.js`)
- `build.py` — مونتاژ اپ تک‌فایلی (معادل فعلی: `scripts/build.js`)
- `patch_v12.py` … `patch_v15.py` — تاریخچهٔ نسخه‌های اپ (پورت‌شده به `src/patches/v12..v15.js`)
- `patch_tests_v12/13/15.py` — وصله‌های تست (همه در `tests/*.cjs` ادغام شده‌اند؛ برای همین پورت نشدند)
- `convert_patches.py` — ابزار یک‌بارمصرف که پچ‌های پایتونی را به ماژول‌های Node تبدیل کرد
- `requirements.txt` — وابستگی‌های پایتونی قدیمی (fpdf2، uharfbuzz، arabic-reshaper، python-bidi، pymupdf)

## چرا نگه داشته شد؟
برای اینکه بشود خروجی نسخهٔ پایتونی را دوباره تولید و با نسخهٔ Node مقایسه کرد
(فیکسچر آمادهٔ آن در `tests/fixtures/py-weekly-plan.html` است و `npm run verify` برابری را بررسی می‌کند).

## اجرای نسخهٔ قدیمی (در صورت نیاز به مقایسه)
```bash
cd legacy-python
pip install --break-system-packages -r requirements.txt
python3 planner.py        # → output/weekly-plan.html + .pdf
python3 build.py          # → planner-app.html + planner-mobile.html
```
توجه: اسکریپت‌های پچ نسخه‌محور هستند و روی قالب‌های همان نسخه اجرا می‌شوند؛ روی قالب‌های
فعلی (v15) اجرا نمی‌شوند. برای همین معادل Node آن‌ها ابزار `node scripts/apply-patch.js status`
را دارد که نشان می‌دهد هر لنگر اعمال شده یا با نسخهٔ بعدی بازنویسی شده است.
