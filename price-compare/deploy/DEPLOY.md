# 🚀 راهنمای استقرار قیمت‌یار پرو روی سرور ایرانی

هدف: اجرای واقعی با داده‌ی زنده از **ترب، دیجی‌کالا، باسلام** (که به IP خارج از ایران سرویس نمی‌دهند) + نوتیفیکیشن تلگرام + هشدارهای زمان‌بندی‌شده.

---

## ۱) تهیه‌ی سرور

- یک **VPS لینوکس (Ubuntu 22.04)** از هر ارائه‌دهنده‌ی ایرانی (آروان‌کلاد، لیرا، ابرآروان، عصر تلکام...) — مهم است که IP **ایران** باشد.
- دامنه (اختیاری ولی برای HTTPS لازم): مثل `pricehunter.example.ir`

## ۲) نصب پیش‌نیازها

```bash
sudo apt update && sudo apt install -y curl git build-essential nginx
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## ۳) انتقال کد و نصب

```bash
mkdir -p ~/apps && cd ~/apps
# از گیت خودت کلون کن یا فایل‌ها را با scp/rsync بفرست:
# scp -r price-compare user@SERVER_IP:~/apps/
cd ~/apps/price-compare
npm install
```

## ۴) متغیرهای محیطی

```bash
cp .env.example .env
nano .env
```
- `TG_CHANNELS=kanal1,kanal2` — کانال‌های عمومی معاملات
- `TELEGRAM_BOT_TOKEN` از [@BotFather](https://t.me/BotFather) و `TELEGRAM_CHAT_ID` از [@userinfobot](https://t.me/userinfobot)
- (اختیاری) `SERPAPI_KEY` برای Google Shopping واقعی

نکته: Next متغیرهای env را در API routes سمت سرور از process.env می‌خواند؛ هنگام اجرای با PM2 فایل ‎+.env+ را هم می‌شناسد (Next به‌صورت پیش‌فرض dotenv را لود می‌کند).

## ۵) بیلد و اجرا با PM2

```bash
npm run build
pm2 start deploy/ecosystem.config.js
pm2 save && pm2 startup   # پایداری بعد از ری‌استارت
curl http://localhost:3000  # تست داخلی
```

## ۶) Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/pricehunter
sudo nano /etc/nginx/sites-available/pricehunter   # دامنه‌ات را جایگزین کن
sudo ln -s /etc/nginx/sites-available/pricehunter /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.ir
```

## ۷) هشدارهای زمان‌بندی‌شده (کرون)

هر ۳۰ دقیقه بازار را بخزد و در صورت تغییر، در تلگرام اطلاع بده:

```bash
chmod +x scripts/check-alerts.sh
crontab -e
# این خط را اضافه کن:
*/30 * * * * /home/YOURUSER/apps/price-compare/scripts/check-alerts.sh >> /var/log/pricehunter-alerts.log 2>&1
```

تست دستی:
```bash
./scripts/check-alerts.sh
```

## ۸) چک‌لیست تأیید واقعی شدن کانکتورها

پس از استقرار، یک ‎GET به ‎/api/hunt?q=آیفون بزن و ببین آرایه‌ی `sources` برای ترب/دیجی‌کالا/باسلام حالت `'real'` گرفته یا `'demo'`.
- اگر `demo` ماند: با `curl 'https://api.digikala.com/v1/search/?q=تست' -v` از خود سرور تست کن؛ گاهی لازم است در `lib/connectors/*.js` هدر `x-web-client: desktop` یا کوکی ست شود.

## ۹) (اختیاری) Docker

```bash
docker build -t pricehunter -f deploy/Dockerfile .
docker run -d --name pricehunter -p 3000:3000 --env-file .env pricehunter
```

## ۱۰) مانیتورینگ ساده

```bash
pm2 monit
pm2 logs pricehunter --lines 100
```

---

### عیب‌یابی رایج
| مشکل | راه‌حل |
|---|---|
| پورت 3000 بسته | بررسی ‎pm2 logs‎ و `ufw allow 80,443` — فراموش نشود Nginx پروکسی می‌کند |
| `sources` همه demo | IP سرور در ایران نیست، یا آن API ساختار پاسخ را عوض کرده (پارسر را در connectors به‌روز کن) |
| تلگرام نمی‌فرستد | توکن/چت‌آیدی و اینکه اول بات را start کرده‌ای (/start) |
| بیلد سنگین | سرور با حداقل ۱G رم؛ اگر کم است `.env` با ‎NODE_OPTIONS=--max-old-space-size=768 بساز |
