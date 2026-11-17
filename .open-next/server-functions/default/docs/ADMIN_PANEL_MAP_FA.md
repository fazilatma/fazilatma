# نقشهٔ کامل پنل ادمین OptiBid

> هدف: ادامهٔ کار روی `/admin/dashboard` بدون گشتن در فایل ۷٫۲۸۸ خطی.
> مسیر فایل اصلی: `src/app/admin/dashboard/AdminDashboardClient.tsx`

---

## ۱. فایل‌های درگیر

| فایل | خط | نقش |
|---|---:|---|
| `src/app/admin/dashboard/page.tsx` | ۸۱ | Server Component؛ داده اولیه را با `json-store` می‌گیرد و به کلاینت می‌دهد |
| `src/app/admin/dashboard/AdminDashboardClient.tsx` | ۷٬۲۸۸ | تمام UI و منطق پنل (Client Component) |
| `src/lib/json-store.ts` | ۵٬۹۹۰ | خواندن/نوشتن تنظیمات و داده‌ها |
| `src/middleware.ts` | — | گارد `/admin` با کوکی `optibid_admin` |
| `src/app/api/login/route.ts` | — | ورود ادمین (`admin` / `1234`) |

**props ورودی از سرور:** `realStats`، `sellerRankings`، `initialKycUsers`، `initialManagedUsers`، `adminReports`، `initialCatalogCategories`.

---

## ۲. تب‌های منو با شماره خط

ترتیب منو در فایل با ترتیب رندر یکی نیست؛ جدول بر اساس **محل منو** است.

| # | تب (`activeTab`) | عنوان منو | محدودهٔ کد | حجم |
|---|---|---|---:|---:|
| ۱ | `overview` | 💰 تراکنش‌های امانی (Escrow) | 5280–5362 | ۸۳ |
| ۲ | `verifications` | 🛡️ تایید هویت کاربران (KYC) | 5363–5507 | ۱۴۵ |
| ۳ | `users` | 👥 مدیریت خریداران و فروشندگان | 2026–2030 | ۵ |
| ۴ | `sellerScores` | 📊 امتیازدهی فروشندگان | 2031–2158 | ۱۲۸ |
| ۵ | `reports` | 📑 گزارش‌گیری تفکیکی | 2159–2369 | ۲۱۱ |
| ۶ | `analytics` | 🤖 تحلیل آماری و AI | 2370–2654 | ۲۸۵ |
| ۷ | `appearance` | 🎨 تنظیمات ظاهر و محتوا | 2655–2750 | ۹۶ |
| ۸ | `homepage` | 🏠 مدیریت صفحه اصلی | 3724–4474 | ۷۵۱ |
| ۹ | `reverseAuctionPilot` | 🚀 مزایده معکوس و جذب فروشنده | 2807–2883 | ۷۷ |
| ۱۰ | `storeImport` | 🤖 استخراج‌گر لینک و محصولات | 2884–3723 | ۸۴۰ |
| ۱۱ | `contact` | 📞 اطلاعات تماس با ما | 4612–4674 | ۶۳ |
| ۱۲ | `support` | 🎧 صفحه و چت پشتیبانی | 4475–4611 | ۱۳۷ |
| ۱۳ | `financial` | 💵 تنظیمات مالی و کمیسیون | 4675–5279 | ۶۰۵ |
| ۱۴ | `enamad` | 🛡️ اینماد و مجوزها | 2751–2806 | ۵۶ |
| ۱۵ | `socialAuth` | 🔐 ورود با گوگل و فیسبوک | 5508–5702 | ۱۹۵ |
| ۱۶ | `categories` | 📂 مدیریت دسته‌بندی‌ها | 5703–5926 | ۲۲۴ |

**کامپوننت‌های انتهای فایل:**

| محدوده | محتوا |
|---|---:|
| 5927–5958 | توابع کمکی نمایشی (`adminMoney`, `adminDate`, `roleLabel`, `kycLabel`, `userAvatarUrl`) |
| 5959–6607 | `UserManagementPanel` — پنل مدیریت کاربران (جستجو، فیلتر، ویرایش، ریست رمز) |
| 6608–6650 | `AnalyticsList` |
| 6651–7288 | `ProductAnalysisChart` — نمودار قیمت/تقاضا/اندیکاتورها (SMA، EMA، RSI، MACD…) |

---

## ۳. State های مهم (شروع محدودهٔ تعریف، خط)

| خط | State |
|---:|---|
| 247 | `activeTab` — تب فعال |
| 248–254 | `reportView`, `chartMode`, `selectedProductName`, `indicatorPanelOpen`, `indicatorSearch` |
| 259–289 | `kycReasons`، `catalogCategories`، `categoryDraft`، `commissionRate`، `siteSlogan`، `siteSubSlogan`، `fontFamily`، `fontSize`، `contactPhone`، `contactEmail`، `contactAddress`، `workingHours`، `platformFinance` |
| 399–417 | `computerPartSources`، تراکنش‌ها، برداشت‌ها، پیام‌های پشتیبانی، پرداخت‌های زرین‌پال، فایل‌های اسلایدر، فلگ‌های saving |
| 418–446 | کل بلوک ایمپورت محصول: `productImportUrl/Limit/PriceMultiplier/ScanMode/Strategy/Categories`، پیش‌نمایش‌ها، انتخاب‌ها، پیام‌ها و خطاها |
| 447–456 | رفرش قیمت: مراجع، ضریب، تعداد، offset، نتایج و هشدارها |
| 457–465 | پایلوت مزایده معکوس، اینماد، دیسپچ (`dispatchData`, `dispatchRequestId`, `dispatchSellerIds`) |
| 5964–5980 | استیت‌های داخلی `UserManagementPanel` |

---

## ۴. توابع/هندلرها (خط تعریف)

| خط | تابع | کار |
|---:|---|---|
| 469 | `useEffect` اولیه | `GET /api/admin/finance` → پر کردن همهٔ تنظیمات مالی/فروشگاه/زرین‌پال |
| 495–546 | `updatePlatformFinanceField`، `updateStorePriceMultiplier`، مدیریت منابع قطعات | ویرایش فرم |
| 546–618 | `ensureHomepageSlides`، `updateHomepageSlide`، `ensureStorefrontSlides`، `updateStorefrontSlide` | اسلایدرها |
| 619 | `saveStorefrontSlider` | `POST /api/admin/storefront-slider` |
| 656 | `saveHomepageImageSlider` | `POST /api/admin/homepage-slider` |
| 693 | `saveFinance` | `PATCH /api/admin/finance` (بیشتر تنظیمات از اینجا ذخیره می‌شوند) |
| 715 | `loadReverseAuctionDispatch` | `GET /api/admin/reverse-auction/dispatch` |
| 728 | `saveReverseAuctionPilot` | `POST` همان روت |
| 755 | `dispatchRequestToSellers` | ارسال دستی درخواست به فروشندگان منتخب |
| 778 | `saveEnamadSettings` | `POST /api/admin/enamad` |
| 803 | `saveStoreCatalogSettings` | `PATCH /api/admin/finance` |
| 834 | `resolveKyc` | `PATCH /api/admin/kyc` (تأیید/رد با دلیل) |
| 874 | `resolveWithdrawal` | `PATCH /api/admin/withdrawals` |
| **909** | **`handleSave(section)`** | **⚠️ استاب: فقط `alert` می‌دهد و چیزی ذخیره نمی‌کند** |
| 970–1076 | مدیریت دسته‌بندی‌ها | `saveCategoryDraft`، `saveCatalogCategories` → `POST /api/admin/categories` |
| 1077–1252 | ایمپورت قطعات از منبع | `importComputerPartsFromSource` → `POST /api/admin/store-products/import-multiple` |
| 1276 | `clearStoreProducts` | `POST /api/admin/store-products/clear` |
| 1299 | `refreshStorePrices` | `POST /api/admin/store-products/refresh-prices` |
| 1386 | `repairProductCsvFile` | `POST /api/admin/store-products/repair-csv` |
| 1432 | `prepareProductCsvPreview` | خواندن CSV در مرورگر |
| 1466 | `runProductCsvImport` | `POST /api/admin/store-products/import-csv` |
| 1583 | `requestUniversalCrawlBatch` | `POST /api/admin/store-products/crawl-batch` |
| 1626 | `runUniversalProductCrawl` | کراول گروهی لینک‌ها |
| 1755 | `importUniversalLinkDrafts` | ذخیرهٔ پیش‌نویس‌های لینک |
| 1794 | `runProductImport` | `POST /api/admin/store-products/import` |
| 5995–6102 | `UserManagementPanel` | `GET/PATCH/POST /api/admin/users` |

---

## ۵. API های پنل ادمین

| مسیر | متدها | کار |
|---|---|---|
| `/api/admin/finance` | GET, PATCH | تنظیمات مالی، کمیسیون، درگاه، اسلایدر، صفحه اصلی، کاتالوگ، پشتیبانی، تماس، OAuth |
| `/api/admin/users` | GET, PATCH, POST | لیست/ویرایش/ریست رمز کاربران |
| `/api/admin/kyc` | GET, PATCH | صف احراز هویت و تأیید/رد |
| `/api/admin/kyc-document` | GET | دریافت امن تصویر مدرک |
| `/api/admin/withdrawals` | GET, PATCH | تأیید/رد برداشت |
| `/api/admin/categories` | GET, POST | درخت دسته‌بندی |
| `/api/admin/enamad` | GET, POST | نماد اعتماد |
| `/api/admin/homepage-slider` | POST | اسلایدهای صفحه اصلی |
| `/api/admin/storefront-slider` | POST | اسلایدهای فروشگاه |
| `/api/admin/reverse-auction/dispatch` | GET, POST | دیسپچ درخواست به فروشندگان |
| `/api/admin/seller-metrics` | PATCH | معیارهای عملکرد فروشنده |
| `/api/admin/store-products/import` | POST | ایمپورت تک/لینک |
| `/api/admin/store-products/import-csv` | POST | ایمپورت CSV |
| `/api/admin/store-products/import-multiple` | POST | ایمپورت گروهی |
| `/api/admin/store-products/crawl-batch` | POST | کراول گروهی |
| `/api/admin/store-products/digikala-page` | GET | خواندن صفحهٔ دیجی‌کالا |
| `/api/admin/store-products/refresh-prices` | POST | رفرش قیمت‌ها |
| `/api/admin/store-products/repair-csv` | POST | ترمیم CSV خراب |
| `/api/admin/store-products/clear` | POST | پاک‌سازی محصولات |

---

## ۶. ⚠️ نقص‌های شناسایی‌شده در پنل

1. **ذخیره‌نشدن ظاهر و تماس**
   - دکمهٔ ذخیرهٔ تب «🎨 ظاهر و محتوا» (خط ۲۷۴۱) → `handleSave("ظاهر و محتوا")`
   - دکمهٔ ذخیرهٔ تب «📞 اطلاعات تماس» (خط ۴۶۶۶) → `handleSave("اطلاعات تماس")`
   - `handleSave` (خط ۹۰۹) فقط `alert` موفقیت نشان می‌دهد؛ **هیچ درخواستی به سرور نمی‌فرستد**.
   - نتیجه: `siteSlogan`, `siteSubSlogan`, `fontFamily`, `fontSize`, `contactPhone`, `contactEmail`, `contactAddress`, `workingHours` با رفرش از بین می‌روند.
   - راه‌حل پیشنهادی: این فیلدها به `platformFinance` وصل شوند و با `PATCH /api/admin/finance` ذخیره گردند (یا روت اختصاصی `live-content` با متد POST ساخته شود؛ الان `/api/live-content` فقط GET دارد).
2. **`/api/live-content` فقط خواندنی است** و `src/data/live-content.json` منبع آن؛ ادمین راه نوشتن ندارد.
3. **`users` تب فقط ۵ خط است** و کل UI در `UserManagementPanel` جدا شده — برای تغییر ظاهر لیست کاربران همان‌جا (۵۹۵۹ به بعد) را ویرایش کنید.
4. **قواعد ذخیره‌سازی دوگانه**: بعضی تنظیمات با `PATCH /api/admin/finance` و بعضی با روت اختصاصی ذخیره می‌شوند؛ برای فیلد جدید باید بدانید کدام مسیر را انتخاب می‌کنید.

---

## ۷. نکات کار با فایل

- فایل ۳۸۰KB است؛ ویرایش با جست‌وجوی متن یکتا (مثل عنوان فارسی همان بخش) امن‌تر از پرش با شماره خط است، چون هر تغییر خطوط بعدی را جابه‌جا می‌کند.
- بعد از هر تغییر: `npx tsc --noEmit` (با `npm run typecheck` که snapshot را هم می‌سازد) و سپس رفرش `/admin/dashboard` با ورود `admin` / `1234`.
- برای تست تغییرات تنظیمات: مقدار را عوض کنید → ذخیره → `curl -s -b cookie.txt localhost:3000/api/admin/finance` را ببینید یا صفحه را رفرش کنید.
