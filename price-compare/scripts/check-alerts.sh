#!/usr/bin/env bash
# بررسی هشدارهای قیمت‌یار پرو — برای کرون
# نوتیفیکیشن تلگرام در سمت سرور انجام می‌شود؛ این اسکریپت فقط API چک را صدا می‌زند و نتیجه را لاگ می‌گیرد.
set -euo pipefail

BASE_URL="${PRICEHUNTER_URL:-http://127.0.0.1:3000}"
TS="$(date '+%Y-%m-%d %H:%M:%S')"

RESPONSE=$(curl -sf --max-time 120 "${BASE_URL}/api/alerts?check=1" || echo '{"error":"request failed"}')

TRIGGERED=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('triggered', -1))" 2>/dev/null || echo "-1")

echo "[$TS] check-alerts → triggered=$TRIGGERED"

if [ "$TRIGGERED" -gt 0 ]; then
  echo "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for e in d.get('freshEvents', []):
    print('  •', e.get('message', ''))
"
fi
