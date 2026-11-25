# قابلیت بروزرسانی خودکار (Auto-Update)

این سامانه طوری تنظیم شده است که سایت شما روی هاست (`https://sabashopping.ir/project/optibid/`) بدون نیاز به دانلود و آپلود دستی، به‌صورت خودکار به‌روز شود.

---

### روش‌های بروزرسانی خودکار

#### ۱. وب‌هوک مستقیم گیت‌هاب (GitHub Webhook - توصیه می‌شود)
برای اینکه **با هر بار push روی گیت‌هاب** سایت فوراً و خودکار آپدیت شود:
1. در گیت‌هاب به مخزن خود بروید: `https://github.com/fazilatma/fazilatma`
2. وارد منوی **Settings** > **Webhooks** شوید و روی **Add webhook** کلیک کنید.
3. در فیلد **Payload URL** این آدرس را وارد کنید:
   ```text
   https://sabashopping.ir/project/optibid/?mmds=update&token=mmds_auto_update_token&branch=arena/9a5c1fc9-fazilatma&force=1
   ```
4. بخش **Content type** را روی `application/json` بگذارید.
5. گزینه **Just the push event** را انتخاب کرده و دکمه **Add webhook** را بزنید.
از این پس، به محض پوش هر کامیت، گیت‌هاب این آدرس را فراخوانی کرده و سایت فوراً آخرین فایل‌ها را جایگزین می‌کند.

---

#### ۲. بررسی خودکار در پس‌زمینه (Zero-Config Auto-Check)
حتی اگر وب‌هوک را تنظیم نکنید:
- در هر بار بازدید از سایت (حداکثر هر ۳ دقیقه یک‌بار در پس‌زمینه)، آخرین کامیت برنچ `arena/9a5c1fc9-fazilatma` از گیت‌هاب استعلام می‌شود.
- در صورت وجود نسخهٔ جدید، فایل‌های `index.php`، `auth.php`، `update.php` و `schema.sql` خودکار دانلود و جایگزین می‌شوند.

---

#### ۳. دکمهٔ بروزرسانی دستی در هدر سایت
در بالای سایت دکمهٔ **«🔄 بروزرسانی سایت»** قرار دارد که با کلیک روی آن، همان لحظه آخرین نسخه از گیت‌هاب دریافت شده و صفحه دوباره بارگذاری می‌شود.

---

#### ۴. اجرای دوره‌ای با Cron Job هاست (اختیاری)
اگر مایلید هاست هر ۵ دقیقه وضعیت را بررسی کند، در cPanel یک Cron Job ساده تعریف کنید:
```bash
curl -s "https://sabashopping.ir/project/optibid/?mmds=update&token=mmds_auto_update_token&branch=arena/9a5c1fc9-fazilatma" > /dev/null 2>&1
```

---

### تنظیمات امنیتی (اختیاری)
توکن پیش‌فرض `mmds_auto_update_token` است. در صورت نیاز می‌توانید در متغیرهای محیطی هاست آن را تغییر دهید:
```text
MMDS_UPDATE_TOKEN=توکن-اختصاصی-دلخواه
MMDS_UPDATE_BRANCH=arena/9a5c1fc9-fazilatma
```
