# نصب OptiBid روی سرور با Host Console (PHP WebConsole)

این راهنما برای همان کنسول PHP (`hostconsole.php` / WebConsole Pro) است که دستور شل روی سرور اجرا می‌کند.
کل نصب با **یک دستور** انجام می‌شود؛ اسکریپت خودش Node.js 20 را (با nvm، بدون نیاز به root) نصب می‌کند،
سورس را می‌آورد، `.env` می‌سازد، بیلد می‌گیرد و سرویس دائمی می‌سازد.

## ۱) فایل‌ها را روی سرور بگذارید

یکی از دو روش:

**الف) با فایل zip سورس** (`optibid-source.zip`):

از همان کنسول، در پوشهٔ خانه:

```bash
mkdir -p ~/optibid-app && cd ~/optibid-app
# فایل zip را با «آپلود فایل» کنسول یا با scp/curl در همین پوشه بگذارید
ls -lh optibid-source.zip
```

**ب) با گیت**

```bash
git clone -b arena/8f071753-fazilatma <REPO_URL> ~/optibid-app
```

## ۲) اجرای نصب‌کننده

```bash
cd ~/optibid-app
bash scripts/install-optibid.sh --zip ~/optibid-app/optibid-source.zip --dir ~/optibid-app --port 3000
```

یا اگر با گیت آورده‌اید:

```bash
bash scripts/install-optibid.sh --git <REPO_URL> --branch arena/8f071753-fazilatma --dir ~/optibid --port 3000
```

پارامترهای اختیاری:

| پارامتر | کار |
|---|---|
| `--dir` | پوشهٔ نصب (پیش‌فرض `~/optibid`) |
| `--port` | پورت اجرا (پیش‌فرض `3000`) |
| `--mode systemd\|pm2\|nohup` | نحوهٔ اجرای دائمی (پیش‌فرض خودکار) |
| `--skip-build` | فقط راه‌اندازی بدون بیلد مجدد |

اسکریپت در پایان آدرس، پورت، محل داده‌ها و دستورهای ری‌استارت را چاپ می‌کند.

## ۳) دامنه و HTTPS

Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

سپس:

```bash
certbot --nginx -d your-domain.com
```

و در `.env`:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

بعد ری‌استارت: `systemctl restart optibid` (یا `pm2 restart optibid`).

## ۴) داده‌ها و بکاپ

- داده‌ها بیرون از کد و در `${APP_DIR}/.optibid-data/optibid-data.json` ذخیره می‌شوند.
- مدارک KYC در `.optibid-data/kyc-uploads`.
- بکاپ: `tar czf backup-$(date +%F).tgz .optibid-data .env`
- کلید `OPTIBID_BANK_ENCRYPTION_KEY` را بعد از اولین ثبت اطلاعات **تغییر ندهید**.

## ۵) به‌روزرسانی نسخه

```bash
cd ~/optibid
bash scripts/install-optibid.sh --dir ~/optibid --skip-build   # فقط ری‌استارت با کد فعلی
# یا برای نسخهٔ جدید:
unzip -oq ~/optibid-source.zip -d ~/optibid && npm ci && npm run build
systemctl restart optibid
```

## ۶) نکات Host Console

- کنسول جاب‌ها را detach اجرا می‌کند ولی **بعد از ریبوت سرور** سرویس را systemd/pm2 بالا می‌آورد (اسکریپت همین را تنظیم می‌کند).
- اگر کاربر PHP شما root نیست، اسکریپت به‌جای systemd از pm2/nohup استفاده می‌کند و همه‌چیز در پوشهٔ خانه می‌ماند.
- پورت انتخابی باید در فایروال/پنل سرور باز باشد.
- برای ربات قیمت روزانه، در `.env` مقدار `CRON_SECRET` ساخته می‌شود؛ اجرای دستی:
  `curl -X POST http://127.0.0.1:3000/api/store-products/auto-refresh -H "Authorization: Bearer $CRON_SECRET"`
