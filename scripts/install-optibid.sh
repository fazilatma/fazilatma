#!/usr/bin/env bash
# ============================================================================
#  OptiBid — نصب‌کنندهٔ تک‌دستوری برای سرور / Host Console (PHP WebConsole)
#
#  استفاده در کنسول:
#     bash install-optibid.sh                 # نصب از همین پوشه
#     bash install-optibid.sh --zip ~/optibid-source.zip --dir /var/www/optibid
#     bash install-optibid.sh --git https://github.com/user/repo --branch main
#
#  کارهایی که انجام می‌دهد:
#   1) بررسی/نصب Node.js 20 (nvm) و ساخت ابزارهای لازم
#   2) استخراج سورس (از zip، از گیت، یا از همان پوشه)
#   3) ساخت فایل .env با کلید رمزنگاری تصادفی
#   4) npm ci && npm run build
#   5) اجرای دائمی با systemd (اگر root باشد) یا pm2 / nohup
#   6) تست سلامت روی /api/health
# ============================================================================
set -euo pipefail

APP_NAME="${APP_NAME:-optibid}"
APP_DIR="${APP_DIR:-$HOME/optibid}"
APP_PORT="${APP_PORT:-3000}"
NODE_MAJOR="${NODE_MAJOR:-20}"
SOURCE_ZIP=""
SOURCE_GIT=""
SOURCE_BRANCH=""
RUN_MODE="auto"      # auto | systemd | pm2 | nohup
SKIP_BUILD="0"

c_green='\033[0;32m'; c_yellow='\033[0;33m'; c_red='\033[0;31m'; c_off='\033[0m'
log()  { printf "${c_green}[OptiBid]${c_off} %s\n" "$*"; }
warn() { printf "${c_yellow}[هشدار]${c_off} %s\n" "$*"; }
die()  { printf "${c_red}[خطا]${c_off} %s\n" "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) APP_DIR="$2"; shift 2 ;;
    --port) APP_PORT="$2"; shift 2 ;;
    --zip) SOURCE_ZIP="$2"; shift 2 ;;
    --git) SOURCE_GIT="$2"; shift 2 ;;
    --branch) SOURCE_BRANCH="$2"; shift 2 ;;
    --mode) RUN_MODE="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD="1"; shift ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) die "پارامتر ناشناخته: $1" ;;
  esac
done

need_cmd() { command -v "$1" >/dev/null 2>&1; }

install_pkg() {
  if need_cmd apt-get; then
    SUDO=""; [ "$(id -u)" -ne 0 ] && need_cmd sudo && SUDO="sudo"
    $SUDO apt-get update -y -qq >/dev/null 2>&1 || true
    $SUDO apt-get install -y -qq "$@" >/dev/null 2>&1 || true
  elif need_cmd dnf; then
    SUDO=""; [ "$(id -u)" -ne 0 ] && need_cmd sudo && SUDO="sudo"
    $SUDO dnf install -y -q "$@" >/dev/null 2>&1 || true
  elif need_cmd yum; then
    yum install -y -q "$@" >/dev/null 2>&1 || true
  elif need_cmd apk; then
    apk add --no-cache "$@" >/dev/null 2>&1 || true
  fi
}

# ---------------------------------------------------------------- 1) ابزارها
log "بررسی ابزارهای پایه…"
for tool in curl unzip tar git; do
  if ! need_cmd "$tool"; then
    warn "نصب $tool"
    install_pkg "$tool" || true
  fi
done
need_cmd curl || die "curl نصب نیست و نصب خودکار ممکن نشد (apt install curl)."

# ---------------------------------------------------------------- 2) Node.js
node_ok() {
  need_cmd node || return 1
  local major
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  [ "$major" -ge 18 ]
}

if ! node_ok; then
  log "نصب Node.js ${NODE_MAJOR} با nvm (بدون نیاز به root)…"
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash >/dev/null 2>&1 || \
      die "نصب nvm ناموفق بود. Node.js ${NODE_MAJOR} را دستی نصب کنید."
  fi
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm install "$NODE_MAJOR" >/dev/null 2>&1 || die "نصب Node.js ناموفق بود."
  nvm use "$NODE_MAJOR" >/dev/null 2>&1 || true
  grep -q 'NVM_DIR' "$HOME/.bashrc" 2>/dev/null || {
    printf '\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"\n' >> "$HOME/.bashrc"
  }
fi
export PATH="$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1)/bin:$PATH"
log "Node: $(node -v) / npm: $(npm -v)"

# ---------------------------------------------------------------- 3) سورس
if [ -n "$SOURCE_GIT" ]; then
  log "دریافت کد از گیت: $SOURCE_GIT"
  need_cmd git || die "git لازم است."
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" fetch --all --quiet || true
  else
    mkdir -p "$(dirname "$APP_DIR")"
    git clone --quiet ${SOURCE_BRANCH:+-b "$SOURCE_BRANCH"} "$SOURCE_GIT" "$APP_DIR" || die "clone ناموفق بود."
  fi
elif [ -n "$SOURCE_ZIP" ]; then
  [ -f "$SOURCE_ZIP" ] || die "فایل zip پیدا نشد: $SOURCE_ZIP"
  log "استخراج $SOURCE_ZIP در $APP_DIR"
  rm -rf "$APP_DIR"; mkdir -p "$APP_DIR"
  unzip -q "$SOURCE_ZIP" -d "$APP_DIR"
  # اگر zip یک پوشهٔ تو در تو داشت، محتویاتش را بالا می‌آوریم
  if [ ! -f "$APP_DIR/package.json" ]; then
    inner="$(find "$APP_DIR" -maxdepth 2 -name package.json -printf '%h\n' | head -1)"
    [ -n "$inner" ] && { shopt -s dotglob; mv "$inner"/* "$APP_DIR"/ 2>/dev/null || true; shopt -u dotglob; }
  fi
else
  HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  if [ -f "$HERE/package.json" ]; then
    log "استفاده از همین پوشه: $HERE"
    APP_DIR="$HERE"
  else
    die "نه zip دادید، نه گیت، و نه داخل پوشهٔ پروژه هستید."
  fi
fi
[ -f "$APP_DIR/package.json" ] || die "package.json در $APP_DIR پیدا نشد."
cd "$APP_DIR"

# ---------------------------------------------------------------- 4) env
if [ ! -f .env ]; then
  log "ساخت .env"
  SECRET="$( (openssl rand -hex 32 2>/dev/null) || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  cat > .env <<EOF
# مسیر داده‌ها و آپلودها (روی دیسک پایدار، بیرون از کد)
OPTIBID_DATA_FILE=${APP_DIR}/.optibid-data/optibid-data.json
OPTIBID_UPLOAD_DIR=${APP_DIR}/.optibid-data/kyc-uploads
OPTIBID_BANK_ENCRYPTION_KEY=${SECRET}
OPTIBID_PASSWORD_RESET_MODE=demo
NEXT_PUBLIC_SITE_URL=http://localhost:${APP_PORT}
PORT=${APP_PORT}
HOST=0.0.0.0
# برای ربات قیمت (اختیاری)
CRON_SECRET=${SECRET}
EOF
  chmod 600 .env
else
  log "‏.env از قبل هست؛ دست نمی‌زنیم."
fi
mkdir -p "$APP_DIR/.optibid-data/kyc-uploads"

# ---------------------------------------------------------------- 5) بیلد
if [ "$SKIP_BUILD" != "1" ]; then
  log "نصب وابستگی‌ها (npm ci)…"
  if ! npm ci --no-audit --no-fund; then
    warn "npm ci نشد؛ npm install اجرا می‌شود."
    npm install --no-audit --no-fund
  fi
  log "بیلد پروژه…"
  npm run build
fi

# ---------------------------------------------------------------- 6) اجرا
can_systemd() {
  [ "$(id -u)" -eq 0 ] && need_cmd systemctl && systemctl list-units >/dev/null 2>&1
}

stop_existing() {
  if can_systemd && systemctl list-units --full -all 2>/dev/null | grep -q "${APP_NAME}.service"; then
    systemctl stop "${APP_NAME}" >/dev/null 2>&1 || true
  fi
  if need_cmd pm2; then pm2 delete "$APP_NAME" >/dev/null 2>&1 || true; fi
  pkill -f "next start -p ${APP_PORT}" >/dev/null 2>&1 || true
}

stop_existing

if [ "$RUN_MODE" = "auto" ]; then
  if can_systemd; then RUN_MODE="systemd"
  elif need_cmd pm2 || npm i -g pm2 >/dev/null 2>&1; then RUN_MODE="pm2"
  else RUN_MODE="nohup"; fi
fi

case "$RUN_MODE" in
  systemd)
    log "ثبت سرویس systemd"
    cat > "/etc/systemd/system/${APP_NAME}.service" <<EOF
[Unit]
Description=OptiBid storefront
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=$(command -v npm) run start -- -H 0.0.0.0 -p ${APP_PORT}
Restart=always
RestartSec=5
User=$(id -un)

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable --now "${APP_NAME}" >/dev/null
    ;;
  pm2)
    log "اجرا با pm2"
    pm2 start npm --name "$APP_NAME" -- run start -- -H 0.0.0.0 -p "$APP_PORT" >/dev/null
    pm2 save >/dev/null 2>&1 || true
    ;;
  *)
    log "اجرا در پس‌زمینه با nohup (بدون سرویس‌منیجر)"
    nohup npm run start -- -H 0.0.0.0 -p "$APP_PORT" > "$APP_DIR/optibid.log" 2>&1 &
    ;;
esac

# ---------------------------------------------------------------- 7) تست
log "صبر برای بالا آمدن سرور…"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    log "سرور سالم است: http://127.0.0.1:${APP_PORT}"
    break
  fi
  sleep 2
  [ "$i" = "30" ] && warn "پاسخ سلامت نیامد؛ لاگ را ببینید: tail -n 50 ${APP_DIR}/optibid.log"
done

IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"
cat <<EOF

============================================================
  نصب کامل شد ✅
  پوشهٔ برنامه : ${APP_DIR}
  پورت         : ${APP_PORT}
  حالت اجرا    : ${RUN_MODE}
  آدرس فعلی    : http://${IP:-SERVER_IP}:${APP_PORT}
  داده‌ها      : ${APP_DIR}/.optibid-data
  فایل تنظیمات : ${APP_DIR}/.env
------------------------------------------------------------
  دستورهای روزمره:
    systemctl status ${APP_NAME}        # وضعیت (اگر systemd)
    systemctl restart ${APP_NAME}       # ری‌استارت
    pm2 restart ${APP_NAME}             # اگر pm2
    tail -f ${APP_DIR}/optibid.log      # لاگ (حالت nohup)
------------------------------------------------------------
  مرحله بعد (توصیه‌شده):
   1) دامنه را با Nginx/Apache روی پورت ${APP_PORT} پروکسی کنید (HTTPS).
   2) در .env مقدار NEXT_PUBLIC_SITE_URL را به دامنه تغییر دهید و ری‌استارت کنید.
   3) ورود مدیر: /login  (بعد از اولین ورود، کد ادمین/cookie ست می‌شود)
============================================================
EOF
