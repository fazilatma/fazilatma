#!/usr/bin/env bash
# نصب خودکار OptiBid روی سرور با Host Console — فقط با curl/git/npm
# استفاده:
#   bash install-optibid-curl.sh --src https://github.com/user/repo --branch main \
#        --dir /home/USER/optibid --port 3000 --domain example.com \
#        [--console-data /path/to/.wconsole_data]
#   یا آپلود zip:  --zip https://your-host/optibid-source.zip
set -euo pipefail
SRC=""; BRANCH="main"; ZIP=""; DIR="$HOME/optibid"; PORT="3000"
DOMAIN=""; CONSOLE_DATA=""; USER_NAME="$(id -un)"
while [ $# -gt 0 ]; do case "$1" in
  --src) SRC="$2"; shift 2;; --branch) BRANCH="$2"; shift 2;; --zip) ZIP="$2"; shift 2;;
  --dir) DIR="$2"; shift 2;; --port) PORT="$2"; shift 2;; --domain) DOMAIN="$2"; shift 2;;
  --console-data) CONSOLE_DATA="$2"; shift 2;; --user) USER_NAME="$2"; shift 2;;
  *) echo "پارامتر ناشناخته: $1"; exit 1;; esac; done

log(){ printf "\033[0;32m[optibid]\033[0m %s\n" "$*"; }

# 1) Node
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  log "نصب Node 20 با nvm…"
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash >/dev/null 2>&1
  . "$NVM_DIR/nvm.sh"; nvm install 20 >/dev/null 2>&1; nvm use 20 >/dev/null 2>&1
fi
log "node $(node -v)"

# 2) سورس
mkdir -p "$DIR"
if [ -n "$ZIP" ]; then
  log "دانلود zip…"; curl -fL --retry 3 -o /tmp/optibid-source.zip "$ZIP"
  unzip -oq /tmp/optibid-source.zip -d "$DIR"
  [ -f "$DIR/package.json" ] || { inner=$(find "$DIR" -maxdepth 2 -name package.json -printf '%h\n'|head -1); [ -n "$inner" ] && cp -a "$inner"/. "$DIR"/; }
elif [ -n "$SRC" ]; then
  log "کلون گیت…"
  [ -d "$DIR/.git" ] && git -C "$DIR" fetch --all -q && git -C "$DIR" reset --hard "origin/$BRANCH" -q \
    || git -c safe.directory='*' clone -q -b "$BRANCH" "$SRC" "$DIR"
fi
cd "$DIR"; [ -f package.json ] || { echo "package.json پیدا نشد"; exit 1; }

# 3) env + secrets
KEY="$(openssl rand -hex 32 2>/dev/null || head -c32 /dev/urandom|od -An -tx1|tr -d ' \n')"
CRON="$(openssl rand -hex 32 2>/dev/null || head -c32 /dev/urandom|od -An -tx1|tr -d ' \n')"
mkdir -p "$DIR/.optibid-data/kyc-uploads"
cat > .env <<EOF
HOST=0.0.0.0
PORT=$PORT
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://localhost:$PORT}
OPTIBID_DATA_FILE=$DIR/.optibid-data/optibid-data.json
OPTIBID_UPLOAD_DIR=$DIR/.optibid-data/kyc-uploads
OPTIBID_BANK_ENCRYPTION_KEY=$KEY
OPTIBID_PASSWORD_RESET_MODE=demo
CRON_SECRET=$CRON
EOF
chmod 600 .env
log ".env ساخته شد"

# 4) نصب و بیلد
log "npm ci…"; npm ci --no-audit --no-fund || npm install --no-audit --no-fund
log "build…"; npm run build

# 5) اجرا
pkill -f "next start -p $PORT" >/dev/null 2>&1 || true
if command -v pm2 >/dev/null 2>&1 || npm i -g pm2 >/dev/null 2>&1; then
  pm2 delete optibid >/dev/null 2>&1 || true
  pm2 start npm --name optibid -- run start -- -H 0.0.0.0 -p "$PORT" >/dev/null
  pm2 save >/dev/null 2>&1 || true; MODE=pm2
else
  nohup npm run start -- -H 0.0.0.0 -p "$PORT" > "$DIR/optibid.log" 2>&1 & MODE=nohup
fi
log "اجرا با $MODE"

# 6) ثبت پروژه در Host Console
if [ -n "$CONSOLE_DATA" ]; then
  F="$CONSOLE_DATA/projects.json"
  python3 - "$F" "$DIR" "$PORT" "$USER_NAME" "$DOMAIN" <<'PY'
import json,sys,os,time
f,dir_,port,user,domain=sys.argv[1:6]
data=[]
if os.path.exists(f):
    try: data=json.load(open(f,encoding='utf-8')) or []
    except Exception: data=[]
entry={"id":"optibid","name":"OptiBid","type":"node","node_version":"20",
 "deploy_path":dir_,"repo_url":"","branch":"","start_cmd":f"npm run start -- -H 0.0.0.0 -p {port}",
 "port":int(port),"bind_host":"0.0.0.0","is_daemon":True,"auto_start":True,"auto_update":False,
 "preserve_configs":[".env",".optibid-data"],"auth_token":"","env":{"NODE_ENV":"production","PORT":str(port)},
 "domain_enabled":bool(domain),"domain_kind":"proxy","domain":domain or "",
 "domain_path":"/","domain_https":bool(domain),"domain_ws":True,"domain_timeout":300,
 "domain_mode":"proxy","domain_docroot":""}
data=[p for p in data if p.get("id")!="optibid"]+[entry]
os.makedirs(os.path.dirname(f),exist_ok=True)
json.dump(data,open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print("project registered in", f)
PY
fi

# 7) تست
for i in $(seq 1 30); do curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && { log "سالم: http://127.0.0.1:$PORT"; break; }; sleep 2; done
log "تمام شد. داده‌ها: $DIR/.optibid-data"
