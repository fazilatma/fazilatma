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

`deploy:cf` اکنون smart/fast است: اگر خروجی آماده‌ی OpenNext در `.open-next` همراه commit
وجود داشته باشد و با hash سورس هماهنگ باشد، Cloudflare دیگر `next build` را اجرا نمی‌کند
و همان artifact آماده را deploy می‌کند. اگر artifact وجود نداشته باشد یا stale باشد، برای
جلوگیری از انتشار نسخه اشتباه، build کامل به صورت fallback انجام می‌شود.

برای اینکه هر `git push` روی سایت live اعمال شود، در همین بخش مقدار **Git branch**
باید روی برنچی باشد که واقعاً push می‌کنید (برای این نشست Arena: `arena/01a020d5-fazilatma`).
اگر production branch در Cloudflare روی `main` باقی بماند، push روی برنچ‌های دیگر فقط
بعد از merge شدن به `main` روی live اعمال می‌شود.

اسکریپت `deploy:cf` به صورت خودکار:

1. hash سورس پروژه را محاسبه می‌کند (`scripts/worker-artifact.mjs`)
2. اگر artifact آماده و تازه‌ی `.open-next` داخل repo باشد، همان را استفاده می‌کند و
   build کامل Next.js را skip می‌کند.
3. اگر artifact وجود نداشته باشد یا با سورس هماهنگ نباشد، به عنوان fallback پروژه را
   برای Workers بیلد می‌کند (`opennextjs-cloudflare build`).
4. در صورت نبود، KV Namespace با عنوان `OPTIBID_KV` **می‌سازد** و شناسه
   آن را در `wrangler.jsonc` ثبت می‌کند (`scripts/cf-ensure-kv.mjs`). این مرحله
   اگر `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` در محیط وجود داشته باشد از
   Cloudflare REST API استفاده می‌کند؛ در غیر این صورت تلاش می‌کند از احراز هویت
   داخلی Wrangler در Cloudflare Workers Builds استفاده کند تا deploy با push و بدون
   تنظیم دستی متغیرهای build انجام شود.
5. با `wrangler deploy` دیپلوی می‌کند

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

## تغییرات سریع بعد از Push

### تغییرات بزرگ‌تر کد

برای اینکه تغییرات همین چت/سشن بعد از push سریع‌تر روی live اعمال شوند، خروجی build
OpenNext هم در commit قرار می‌گیرد. روال پیشنهادی برای تغییرات کد این است:

```bash
npm run build:worker
# سپس سورس + پوشه .open-next را commit و push کنید
```

بعد از این کار، Cloudflare Workers Builds پس از push فقط `npm ci` و `npm run deploy:cf`
را اجرا می‌کند؛ چون artifact آماده و تازه است، `next build` دوباره اجرا نمی‌شود و انتشار
live بسیار سریع‌تر می‌شود.

اگر کسی سورس را تغییر دهد اما `.open-next` تازه را همراه commit نکند، `deploy:cf` عمداً
build کامل را fallback اجرا می‌کند تا نسخه اشتباه روی live نرود.

### تغییرات متنی بدون انتظار برای Build

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

## اتصال زرین‌پال

برای فعال‌سازی پرداخت خریدار از طریق زرین‌پال:

1. در پنل زرین‌پال یک پذیرنده بسازید و `Merchant ID` را دریافت کنید.
2. در ادمین OptiBid مسیر **تنظیمات مالی و کمیسیون → اتصال درگاه پرداخت زرین‌پال** را باز کنید.
3. `Merchant ID`، حالت Sandbox/Production و آدرس پایه سایت را ثبت کنید.
4. آدرس Callback که در ادمین نمایش داده می‌شود باید در تنظیمات پذیرنده/دامنه زرین‌پال معتبر باشد:

```text
https://optibid.fazilat-ma.workers.dev/api/payments/zarinpal/callback
```

5. در حالت عملیاتی، دامنه باید HTTPS و تاییدشده باشد. برای Worker فعلی مقدار پیشنهادی `NEXT_PUBLIC_SITE_URL`:

```text
https://optibid.fazilat-ma.workers.dev
```

به جای ذخیره Merchant ID در JSON، می‌توانید آن را به عنوان Secret در Cloudflare Workers تنظیم کنید:

```text
ZARINPAL_MERCHANT_ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX = true|false
NEXT_PUBLIC_SITE_URL = https://optibid.fazilat-ma.workers.dev
```

## ورود با گوگل و فیسبوک

برای فعال شدن دکمه‌های ورود/ثبت‌نام اجتماعی، این Secretها را در Cloudflare Workers تنظیم کنید:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL=https://optibid.fazilat-ma.workers.dev
```

Redirect URIهایی که باید در پنل Google Cloud و Facebook Developers ثبت شوند:

```text
https://optibid.fazilat-ma.workers.dev/api/auth/social/google/callback
https://optibid.fazilat-ma.workers.dev/api/auth/social/facebook/callback
```

اگر این Secretها تنظیم نشده باشند، دکمه‌ها دیگر بی‌عمل نیستند و پیام دقیق کمبود تنظیمات را در صفحه ورود نمایش می‌دهند.

همچنین ادمین می‌تواند بدون تغییر کد از مسیر **داشبورد مدیریت → ورود با گوگل و فیسبوک** همین Client ID/Secretها و Callbackها را ثبت کند. اگر Secretهای Cloudflare تنظیم شده باشند، نسبت به مقدار ذخیره‌شده در ادمین اولویت دارند.

اگر کلیدهای Google/Facebook هنوز تنظیم نشده باشند، مسیرهای ورود اجتماعی برای جلوگیری از بی‌عمل بودن آیکون‌ها به حالت آزمایشی داخلی OptiBid می‌روند و یک حساب تست اجتماعی می‌سازند. پس از ثبت Client ID/Secret واقعی در ادمین یا Cloudflare Secrets، همین دکمه‌ها به OAuth واقعی گوگل و فیسبوک وصل می‌شوند.
