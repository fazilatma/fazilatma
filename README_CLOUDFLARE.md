# راهنمای دیپلوی روی Cloudflare Workers

این پروژه Next.js با آداپتور **OpenNext for Cloudflare** روی Cloudflare Workers اجرا می‌شود.

## چرا `npx wrangler deploy` به تنهایی خطا می‌داد؟

پیام خطای `Could not detect a directory containing static files` به این دلیل است که:

1. خروجی Next.js مستقیماً قابل اجرا روی Workers نیست و باید ابتدا با
   `opennextjs-cloudflare build` به یک Worker تبدیل شود.
2. این پروژه از `node:fs` برای ذخیره داده‌ها استفاده می‌کرد؛ در Workers فایل‌سیستم
   پایدار وجود ندارد و ذخیره‌سازی به **Cloudflare KV** منتقل شده است.

## تنظیمات Workers Builds در داشبورد Cloudflare

در بخش **Settings → Build** ورکر خود این مقادیر را تنظیم کنید:

| فیلد | مقدار |
|---|---|
| Build command | `npm ci` |
| Deploy command | `npm run deploy:cf` |
| Root directory | `/` (پیش‌فرض) |

برای اینکه هر `git push` روی سایت live اعمال شود، در همین بخش مقدار **Git branch**
باید روی برنچی باشد که واقعاً push می‌کنید (برای این نشست Arena: `arena/01a020d5-fazilatma`).
اگر production branch در Cloudflare روی `main` باقی بماند، push روی برنچ‌های دیگر فقط
بعد از merge شدن به `main` روی live اعمال می‌شود.

اسکریپت `deploy:cf` به صورت خودکار:

1. اسنپ‌شات سورس‌کد را تولید می‌کند (`scripts/generate-source-snapshot.mjs`)
2. پروژه را برای Workers بیلد می‌کند (`opennextjs-cloudflare build`)
3. در صورت نبود، KV Namespace با عنوان `OPTIBID_KV` **می‌سازد** و شناسه
   آن را در `wrangler.jsonc` ثبت می‌کند (`scripts/cf-ensure-kv.mjs`). این مرحله
   اگر `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` در محیط وجود داشته باشد از
   Cloudflare REST API استفاده می‌کند؛ در غیر این صورت تلاش می‌کند از احراز هویت
   داخلی Wrangler در Cloudflare Workers Builds استفاده کند تا deploy با push و بدون
   تنظیم دستی متغیرهای build انجام شود.
4. با `wrangler deploy` دیپلوی می‌کند

> نکته: اگر ترجیح می‌دهید دستور دیپلوی همان `npx wrangler deploy` بماند، کافی است
> Build command را `npm ci && npm run cf:prepare` قرار دهید.

## معماری ذخیره‌سازی

| محیط | ذخیره‌سازی | توضیح |
|---|---|---|
| Cloudflare Workers | KV (کلید `optibid:data`) | کل داده‌های JSON + مدارک رمزنگاری‌شده KYC (پیشوند `optibid:kyc:`) |
| Node (سرور PaaS / `next dev`) | فایل JSON روی دیسک | همان رفتار قبلی، بدون تغییر |

انتخاب حالت به صورت خودکار در `src/lib/kv-storage.ts` انجام می‌شود؛ اگر binding
مربوط به `OPTIBID_KV` در دسترس باشد از KV و در غیر این صورت از فایل استفاده می‌شود.

## متغیرهای محیطی (اختیاری ولی توصیه‌شده)

در داشبورد Cloudflare بخش **Settings → Variables and Secrets** مقدار زیر را به عنوان
**Secret** تنظیم کنید:

```
OPTIBID_BANK_ENCRYPTION_KEY = یک رشته تصادفی طولانی
```

این کلید برای رمزنگاری اطلاعات بانکی و مدارک احراز هویت (AES-256-GCM) استفاده می‌شود.
اگر تنظیم نشود از کلید پیش‌فرض توسعه استفاده می‌شود که برای محیط عملیاتی مناسب نیست.
**پس از ثبت اولیه اطلاعات، این مقدار را تغییر ندهید.**

سایر متغیرهای `.env.example` (`OPTIBID_DATA_FILE`، `OPTIBID_UPLOAD_DIR` و...) فقط
برای محیط Node معنا دارند و در Workers استفاده نمی‌شوند.

## اجرای محلی

```bash
# حالت Node (داده‌ها در فایل JSON — مثل قبل)
npm run dev

# حالت Workers با رانتایم واقعی workerd (داده‌ها در KV محلی)
npm run preview
```

داده‌های KV محلی در پوشه `.wrangler/state` نگهداری می‌شوند و بین ری‌استارت‌ها باقی
می‌مانند (فقط برای توسعه).

## نکته درباره سازگاری

- فایل `src/middleware.ts` عمداً از قرارداد قدیمی (به جای `proxy.ts` نسخه ۱۶) استفاده
  می‌کند؛ زیرا آداپتور OpenNext در حال حاضر فقط Middleware لبه (Edge) را پشتیبانی
  می‌کند و `proxy.ts` روی رانتایم Node اجرا می‌شود.
- KV در Cloudflare «سرانجام‌سازگار» (eventually consistent) است؛ یعنی نوشتن و بلافاصله
  خواندن از یک لوکیشن دیگر ممکن است چند ثانیه تأخیر داشته باشد. برای این سطح از
  برنامه کاملاً کافی است.
- صفحات «کد منبع» و دانلود ZIP در Workers از اسنپ‌شاتی که هنگام build تولید می‌شود
  استفاده می‌کنند (چون فایل‌های پروژه روی Workers وجود ندارند).

## تغییرات متنی بدون انتظار برای Build

برای متن‌های ساده و پرتکرار سایت (مثل نام شهر و آدرس‌ها)، فایل زیر به عنوان منبع live استفاده می‌شود:

```text
data/live-content.json
```

Worker در runtime این فایل را از برنچ GitHub می‌خواند:

```text
https://raw.githubusercontent.com/fazilatma/fazilatma/refs/heads/arena/01a020d5-fazilatma/data/live-content.json
```

بنابراین برای تغییر سریع شهر/آدرس در live page کافی است فقط همین فایل JSON را ویرایش، commit و push کنید. صفحه با refresh بعدی مقدار جدید را از GitHub raw می‌خواند و برای این نوع تغییر لازم نیست منتظر پایان build/deploy Cloudflare بمانید.

> توجه: Cloudflare Workers Builds ممکن است همچنان بعد از push در پس‌زمینه build را شروع کند؛ اما نمایش این متن‌های live به کامل شدن آن build وابسته نیست.

## دستورات مفید

```bash
npx wrangler tail        # مشاهده لاگ‌های زنده ورکر دیپلای‌شده
npx wrangler kv key list --binding OPTIBID_KV   # مشاهده کلیدهای KV
npx wrangler login       # ورود برای اجرای دستی wrangler روی سیستم خودتان
```
