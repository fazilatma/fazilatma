#!/usr/bin/env bash
# ============================================================
#  قیمت‌یار (PriceHunter) — نصب یک‌دستوری روی سرور اوبونتو
#
#  مثال روی سرور خالی (نصب از گیت):
#    curl -fsSL https://raw.githubusercontent.com/USERNAME/REPO/main/install.sh | \
#      sudo bash -s -- --repo https://github.com/USERNAME/REPO.git --domain example.ir
#
#  مثال وقتی کد همین حالا روی سرور است (داخل پوشه پروژه):
#    bash install.sh --domain example.ir
#
#  آپدیت: همان دستور را دوباره اجرا کنید (pull + build + restart).
# ============================================================
set -euo pipefail

# ---------- پیش‌فرض‌ها ----------
APP_NAME="pricehunter"
PORT=3000
REPO_URL="${REPO_URL:-}"
DOMAIN="${DOMAIN:-}"
SSL_EMAIL=""
BRANCH="main"
WITH_CRON=0

if [ "$(id -u)" -eq 0 ]; then APP_DIR="${APP_DIR:-/opt/price-compare}"; else APP_DIR="${APP_DIR:-$HOME/apps/price-compare}"; fi

# ---------- آرگومان‌ها ----------
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)    REPO_URL="$2"; shift 2 ;;
    --domain)  DOMAIN="$2"; shift 2 ;;
    --dir)     APP_DIR="$2"; shift 2 ;;
    --port)    PORT="$2"; shift 2 ;;
    --branch)  BRANCH="$2"; shift 2 ;;
    --ssl)     SSL_EMAIL="$2"; shift 2 ;;
    --cron)    WITH_CRON=1; shift ;;
    -h|--help)
      grep -E '^#( |  )' "$0" | sed 's/^# \{0,2\}//'; exit 0 ;;
    *) echo "آرگومان ناشناخته: $1" >&2; exit 1 ;;
  esac
done

# ---------- ابزارها ----------
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}✔ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
die()  { echo -e "${RED}✖ $*${NC}" >&2; exit 1; }

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  command -v sudo >/dev/null 2>&1 || die "برای نصب سیستمی یا با root اجرا کنید یا sudo داشته باشید."
  SUDO="sudo"
fi

[ -f /etc/debian_version ] || die "این اسکریپت برای اوبونتو/دبیان نوشته شده است."

# ---------- ۱) پکیج‌های پایه ----------
log "نصب پکیج‌های پایه (curl, git, nginx)..."
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq curl git build-essential nginx >/dev/null

# ---------- ۲) Node.js 20 ----------
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
fi
if [ "$NODE_MAJOR" -lt 20 ]; then
  log "نصب Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash - >/dev/null
  $SUDO apt-get install -y -qq nodejs >/dev/null
fi
log "Node $(node -v) / npm $(npm -v)"

# ---------- ۳) PM2 ----------
if ! command -v pm2 >/dev/null 2>&1; then
  log "نصب PM2..."
  $SUDO npm install -g pm2 >/dev/null
fi

# ---------- ۴) دریافت کد ----------
if [ -n "$REPO_URL" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    log "آپدیت کد در $APP_DIR ..."
    git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
  else
    log "کلون پروژه در $APP_DIR ..."
    $SUDO mkdir -p "$(dirname "$APP_DIR")"
    git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
  fi
elif [ -f "./package.json" ] && grep -q '"next"' ./package.json; then
  APP_DIR="$(pwd)"
  warn "از کد موجود در همین پوشه استفاده می‌شود: $APP_DIR"
else
  die "نه --repo داده شد و نه داخل پوشه پروژه هستید. یکی از دو روش مثال بالای اسکریپت را استفاده کنید."
fi
cd "$APP_DIR"
[ -f package.json ] || die "package.json در $APP_DIR پیدا نشد."

# ---------- ۵) متغیرهای محیطی ----------
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  log "فایل .env از روی .env.example ساخته شد — مقادیرش را بعداً کامل کنید."
fi
set_env() { # set_env KEY VALUE
  [ -n "${2:-}" ] || return 0
  touch .env
  if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi
}
set_env TG_CHANNELS       "${TG_CHANNELS:-}"
set_env SERPAPI_KEY       "${SERPAPI_KEY:-}"
set_env TELEGRAM_BOT_TOKEN "${TELEGRAM_BOT_TOKEN:-}"
set_env TELEGRAM_CHAT_ID  "${TELEGRAM_CHAT_ID:-}"
set_env IG_ACCESS_TOKEN   "${IG_ACCESS_TOKEN:-}"
set_env IG_BUSINESS_ID    "${IG_BUSINESS_ID:-}"

# ---------- ۶) نصب وابستگی و بیلد ----------
log "نصب وابستگی‌ها..."
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

# روی سرورهای کم‌رم، سقف حافظه بیلد را تنظیم کن
MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
if [ "$MEM_MB" -lt 2048 ]; then
  export NODE_OPTIONS="--max-old-space-size=768"
  warn "رم سرور ${MEM_MB}MB است؛ NODE_OPTIONS برای بیلد تنظیم شد."
fi
log "بیلد پروداکشن..."
npm run build

# ---------- ۷) اجرا با PM2 ----------
log "اجرا با PM2 روی پورت $PORT ..."
if [ "$PORT" = "3000" ] && [ -f deploy/ecosystem.config.js ]; then
  pm2 startOrRestart deploy/ecosystem.config.js
else
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  pm2 start node_modules/next/dist/bin/next --name "$APP_NAME" -- start -H 0.0.0.0 -p "$PORT"
fi
pm2 save >/dev/null
if [ "$(id -u)" -eq 0 ]; then
  env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || \
    warn "برای اجرای خودکار بعد از ری‌استارت، خروجی دستور pm2 startup را دستی اجرا کنید."
else
  warn "برای اجرای خودکار بعد از ری‌استارت یک بار این را بزنید: sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME"
fi

# ---------- ۸) Nginx + دامنه (اختیاری) ----------
if [ -n "$DOMAIN" ]; then
  log "تنظیم Nginx برای $DOMAIN ..."
  $SUDO tee "/etc/nginx/sites-available/$APP_NAME" >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    client_max_body_size 10m;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90s;
        proxy_cache_bypass \$http_upgrade;
    }
    access_log /var/log/nginx/$APP_NAME.access.log;
    error_log  /var/log/nginx/$APP_NAME.error.log;
}
EOF
  $SUDO ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
  $SUDO nginx -t
  $SUDO systemctl reload nginx

  if [ -n "$SSL_EMAIL" ]; then
    log "دریافت گواهی HTTPS برای $DOMAIN ..."
    $SUDO apt-get install -y -qq certbot python3-certbot-nginx >/dev/null
    $SUDO certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
      --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect || \
      warn "صدور گواهی ناموفق بود؛ DNS دامنه را بررسی و دوباره certbot را دستی بزنید."
  else
    warn "برای HTTPS بعداً بزنید: sudo certbot --nginx -d $DOMAIN"
  fi
else
  warn "دامنه داده نشد؛ سایت مستقیم روی پورت $PORT در دسترس است."
fi

# ---------- ۹) فایروال (اگر فعال بود) ----------
if command -v ufw >/dev/null 2>&1 && $SUDO ufw status | grep -q "Status: active"; then
  $SUDO ufw allow 80/tcp >/dev/null; $SUDO ufw allow 443/tcp >/dev/null
  [ -z "$DOMAIN" ] && $SUDO ufw allow "$PORT"/tcp >/dev/null
  log "قوانین فایروال تنظیم شد."
fi

# ---------- ۱۰) کرون هشدارها (اختیاری) ----------
if [ "$WITH_CRON" -eq 1 ] && [ -f scripts/check-alerts.sh ]; then
  chmod +x scripts/check-alerts.sh
  ( crontab -l 2>/dev/null | grep -v 'check-alerts.sh' || true
    echo "*/30 * * * * $APP_DIR/scripts/check-alerts.sh >> /var/log/$APP_NAME-alerts.log 2>&1"
  ) | crontab -
  log "کرون بررسی هشدارها (هر ۳۰ دقیقه) فعال شد."
fi

# ---------- ۱۱) تست سلامت ----------
log "تست سلامت سرویس..."
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
    log "سرویس سالمه و پاسخ می‌دهد."
    break
  fi
  [ "$i" -eq 30 ] && { pm2 logs "$APP_NAME" --lines 50 --nostream || true; die "سرویس بالا نیامد؛ لاگ بالا را ببینید."; }
  sleep 2
done

echo
echo "============================================================"
log "نصب تمام شد."
echo "  پوشه پروژه : $APP_DIR"
if [ -n "$DOMAIN" ]; then echo "  آدرس سایت  : http://$DOMAIN  (بعد از --ssl با https)"; else echo "  آدرس سایت  : http://SERVER_IP:$PORT"; fi
echo "  وضعیت      : pm2 status"
echo "  لاگ        : pm2 logs $APP_NAME"
echo "  آپدیت      : همین اسکریپت را دوباره اجرا کنید"
echo "============================================================"
