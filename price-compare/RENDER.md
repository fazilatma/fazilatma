# 🚀 استقرار قیمت‌یار روی Render

پروژه یک وب‌اپ **Next.js 14** است که در زیرپوشه‌ی `price-compare/` قرار دارد.

## روش ۱ — Blueprint (خودکار، پیشنهادی)

فایل `render.yaml` در **ریشه‌ی ریپو** آماده است:

1. وارد https://dashboard.render.com شوید → **New → Blueprint**
2. ریپوی GitHub را وصل کنید و برنچ `arena/30a54db8-fazilatma` را انتخاب کنید
3. Render خودش `render.yaml` را می‌خواند و سرویس `gheymatyar` را می‌سازد
4. در همان صفحه، مقدار env var هایی که `sync: false` دارند را پر کنید (در صورت نیاز)

## روش ۲ — Web Service دستی

1. **New → Web Service** → ریپو را وصل کنید
2. تنظیمات:

| فیلد | مقدار |
|---|---|
| Name | `gheymatyar` |
| Region | `Singapore` |
| Branch | `arena/30a54db8-fazilatma` |
| **Root Directory** | `price-compare` |
| Runtime | `Node` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npx next start -H 0.0.0.0 -p $PORT` |
| Instance Type | `Free` |
| Health Check Path | `/` |

3. در بخش **Environment Variables**:

| کلید | مقدار | اجباری؟ |
|---|---|---|
| `NODE_VERSION` | `20` | بله |
| `TG_CHANNELS` | کانال‌های عمومی تلگرام با کاما، مثل `example_deals,offers` | اختیاری |
| `SERPAPI_KEY` | کلید serpapi.com برای Google Shopping واقعی | اختیاری |
| `TELEGRAM_BOT_TOKEN` | از @BotFather | اختیاری (برای نوتیفیکیشن) |
| `TELEGRAM_CHAT_ID` | از @userinfobot | اختیاری (برای نوتیفیکیشن) |
| `IG_ACCESS_TOKEN` | Instagram Graph API | اختیاری |
| `IG_BUSINESS_ID` | Instagram Business ID | اختیاری |

4. **Create Web Service** — چند دقیقه بعد روی آدرس `https://gheymatyar.onrender.com` بالا می‌آید.

## ⚠️ نکات مهم Render

- **داده‌ها موقتی‌اند:** قوانین هشدار، اسنپ‌شات‌ها و کاربران در `data/` روی دیسک موقت Render نوشته می‌شوند و با هر ری‌استارت/ری‌دیپلوی **پاک می‌شوند**. برای ماندگاری: **Disks** (پلن پولی) یا انتقال `lib/store.js` و `lib/auth.js` به دیتابیس (Postgres/Redis رایگان Render).
- **پلن Free بعد از ۱۵ دقیقه بی‌فعالیتی sleep می‌کند**؛ اولین بازدید بعدش ~۳۰-۶۰ ثانیه طول می‌کشد (cold start).
- **کرون هشدارها:** روی Render از **Cron Jobs** استفاده کنید (جدا از وب‌سرویس):
  - Command: `curl -sf https://gheymatyar.onrender.com/api/alerts?check=1`
  - Schedule: مثلا `*/30 * * * *`
- **منابع ایرانی (ترب/دیجی‌کالا/باسلام):** سرورهای Render خارج از ایران‌اند و این APIها به IP خارجی سرویس نمی‌دهند → حالت **دمو**. تلگرام و SerpApi واقعی کار می‌کنند. برای داده‌ی واقعی این سه منبع به سرور ایرانی نیاز است (راهنما: `deploy/DEPLOY.md`).

## تست بعد از استقرار

```bash
curl https://gheymatyar.onrender.com/api/hunt?q=آیفون
```

اگر پاسخ JSON با آرایه‌ی `sources` برگشت، سرویس سالم است.
