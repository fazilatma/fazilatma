# فعال‌سازی ثبت‌نام و ورود MMDS

این قابلیت از MySQL/MariaDB و دو کانال تأیید استفاده می‌کند: یک کد یک‌بارمصرف جداگانه برای موبایل (ملی‌پیامک) و ایمیل (Gmail SMTP). کدها ۱۰ دقیقه اعتبار دارند، پس از ۵ تلاش ناموفق پذیرفته نمی‌شوند و برای ارسال مجدد حداقل ۶۰ ثانیه فاصله لازم است. گذرواژه با `password_hash` ذخیره می‌شود و OTP خام در پایگاه‌داده ذخیره نمی‌شود.

## نصب روی هاست

1. فایل‌های `index.php` و `auth.php` را کنار هم در پوشه‌ی سایت بگذارید.
2. `schema.sql` را یک بار روی پایگاه‌داده‌ی MySQL/MariaDB اجرا کنید.
3. PHP 8.1 یا جدیدتر، افزونه‌های `PDO_MySQL`، `cURL` و `OpenSSL` را فعال کنید.
4. متغیرهای زیر را در تنظیمات محیطی PHP/FPM یا پنل امن هاست تنظیم کنید؛ آن‌ها را در کد یا Git قرار ندهید:

```text
MMDS_DB_DSN=mysql:host=localhost;dbname=YOUR_DB;charset=utf8mb4
MMDS_DB_USER=YOUR_DB_USER
MMDS_DB_PASSWORD=YOUR_DB_PASSWORD
MMDS_OTP_PEPPER=یک-رشته-تصادفی-حداقل-۳۲-کاراکتری
MMDS_MELIPAYAMAK_USERNAME=نام-کاربری-پنل
MMDS_MELIPAYAMAK_PASSWORD=رمز-یا-توکن-پنل
MMDS_MELIPAYAMAK_FROM=شماره-خط-ارسال
MMDS_GMAIL_USER=your-address@gmail.com
MMDS_GMAIL_APP_PASSWORD=رمز-برنامه-Gmail
MMDS_MAIL_FROM_NAME=MMDS
```

`MMDS_MELIPAYAMAK_URL` به‌طور پیش‌فرض روی endpoint رایج REST ملی‌پیامک است؛ اگر پنل شما endpoint یا قالب اعتبارسنجی متفاوتی دارد، URL و اتصال API باید مطابق مستندات همان پنل تنظیم شود. Gmail باید با SMTP و App Password تنظیم شده باشد؛ رمز اصلی حساب Google را استفاده نکنید.

5. HTTPS را فعال کنید و دسترسی نوشتن/خواندن جدول‌ها را برای کاربر پایگاه‌داده محدود کنید. فایل `auth.php` API است و نباید به‌صورت متن خام از سرور دانلود شود؛ مطمئن شوید PHP واقعاً روی هاست اجرا می‌شود.

برای پاک‌سازی دوره‌ای درخواست‌های تأیید منقضی‌شده می‌توانید این SQL را زمان‌بندی کنید:

```sql
DELETE FROM mmds_pending_users WHERE expires_at < NOW();
```

این قابلیت از secrets داخل مخزن استفاده نمی‌کند. کدهای واقعی ارسال پیامک/ایمیل فقط بعد از تنظیم مقادیر بالا روی هاست کار می‌کنند.
