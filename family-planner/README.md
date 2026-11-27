# برنامه‌ریز خانواده — نسخهٔ Node.js (v16)

برنامهٔ هفتگی خانواده: تقویم شمسی، شیفت کاری، رانندهٔ بچه‌ها، کلاس‌ها و برنامهٔ روزانه.
کل پروژه با **Node.js** اجرا می‌شود — دیگر هیچ بخشی از زنجیرهٔ ساخت/تست/PDF به پایتون وابسته نیست.
(نسخهٔ پایتونیِ تاریخی فقط برای مرجع در `legacy-python/` نگه داشته شده.)

## نصب و اجرا

```bash
cd family-planner
npm install                # فقط دو وابستگی: pdfkit + arabic-persian-reshaper

npm run build              # planner-app.html + planner-mobile.html (از قالب‌ها)
npm run pdf                # output/weekly-plan.html + output/weekly-plan.pdf
npm run week               # «برنامه-این-هفته.html» برای همین هفته
npm test                   # ۱۱۳ تست هسته
npm run test:ui            # رابط دسکتاپ + موبایل (تاریخ ثابت) + تست PDF
npm run test:pdf           # فقط تست رنگ‌ها و ساخت PDF
npm run verify             # بررسی کل زنجیره: build + تست‌ها + PDF + پچ‌ها + برابری با پایتون
npm run serve              # پیش‌نمایش اپ در مرورگر (localhost:8123)
```

### گزینه‌های خط فرمان (`npm run pdf -- …`)

| گزینه | کار |
|---|---|
| `-i, --input <file>` | فایل ورودی JSON (پیش‌فرض `tasks.json`) |
| `-o, --out <dir>` | پوشهٔ خروجی (پیش‌فرض `output/`) |
| `--week <YYYY-MM-DD>` | هفتهٔ دلخواه (شنبهٔ آن هفته) |
| `--no-pdf` | فقط HTML |
| `--quiet` | بدون گزارش ترمینال |

```bash
node scripts/planner.js --week 2026-09-12 --no-pdf --quiet
```

## ساختار

```
src/
  core.js          موتور برنامه: تاریخ شمسی/میلادی، شیفت، راننده، چیدمان وظایف (همان core مشترک مرورگر)
  html.js          ساخت HTML برنامهٔ هفته
  pdf.js           ساخت PDF با pdfkit
  rtl-pdf.js       چیدمان و شکل‌دهی راست‌به‌چپ (شکل‌دهی حروف + ارقام فارسی)
  cli.js           parseArgs + گزارش ترمینال (همان پرچم‌های نسخهٔ پایتون)
  patch-engine.js  موتور پچ متنی با بررسی سخت‌گیرانهٔ لنگر
  patches/v12..v15.js  تاریخچهٔ نسخه‌های اپ (پورت‌شده از patch_v*.py)
  assets/weekly-plan.css
scripts/
  build.js         تزریق core + فونت‌ها + مانیفست PWA در قالب‌ها
  planner.js       نقطهٔ ورود CLI
  gen-week.cjs     ساخت «برنامه-این-هفته.html» (CJS)
  apply-patch.js   list | status | <version> [--dir] [--dry-run]
  verify.js        بررسی سلامت کل زنجیره
tests/             test-core.cjs، test-ui.cjs، test-ui-mobile.cjs، fixed-date.cjs، fixtures/
legacy-python/     نسخهٔ پایتونی قدیمی (فقط مرجع؛ اجرا نمی‌شود)
```

## پچ‌های نسخه‌ها

پچ‌ها «تاریخچه» هستند: هر پچ دقیقاً همان جایگزینی‌هایی را انجام می‌دهد که نسخهٔ پایتونی
انجام می‌داد، و روی قالب‌های همان نسخه اجرا می‌شود. اگر لنگر پیدا نشود، پچ با خطا متوقف
می‌شود و هیچ فایلی نیمه‌کاره ذخیره نمی‌شود.

```bash
node scripts/apply-patch.js list           # پچ‌های موجود
node scripts/apply-patch.js v14 --dir ./x  # اجرا روی پوشهٔ نسخهٔ ۱۳
node scripts/apply-patch.js status         # چند لنگر اعمال‌شده/قابل اجرا/بازنویسی‌شده
```

`node scripts/apply-patch.js status` روی قالب‌های فعلی نشان می‌دهد v15 کامل اعمال شده و
بخش‌هایی از v12–v14 با نسخه‌های بعدی بازنویسی شده‌اند — این طبیعی است و همان چیزی است که
در تاریخچهٔ پایتونی هم رخ داده بود.

## برابری با نسخهٔ پایتون

خروجی HTML با نسخهٔ پایتون **بایت‌به‌بایت** یکی است (۲۲۰٬۸۷۷ بایت، پس از یکسان‌سازی دادهٔ
فونت‌ها)؛ این بررسی بخشی از `npm run verify` است و با فیکسچر
`tests/fixtures/py-weekly-plan.html` مقایسه می‌شود.

PDF در یک صفحه با فونت وزیرمتن ساخته می‌شود؛ متن فارسی با شکل‌دهی حروف و ارقام فارسی
راست‌به‌چپ چیده می‌شود. کارت امروز با قاب بنفش و نشان «امروز» مشخص می‌شود و نوار رنگی
اولویت کنار هر کار می‌آید.

نکتهٔ pdfkit: رنگ را همیشه **هگز** بدهید (`#0f172a`)، نه `rgb(15,23,42)`. با رشتهٔ `rgb()`
pdfkit رنگ را برای همهٔ متن‌های بعدی نگه می‌دارد و کارت‌ها سفید روی سفید می‌شوند.
`tests/test-pdf.cjs` نگهبان همین مورد است.

## تست‌ها

```bash
npm test                                       # هسته: ۱۱۳ ✓
npm run test:ui                                # رابط دسکتاپ + موبایل
node -r ./tests/fixed-date.cjs tests/test-ui.cjs
```

`tests/fixed-date.cjs` تاریخ را روی شنبه ۷ آذر ۱۴۰۵ (۲۸ نوامبر ۲۰۲۶) ثابت می‌کند تا
تست‌ها مستقل از روز اجرا باشند. فایل‌های تست `.cjs` هستند چون بسته `"type": "module"` است.
