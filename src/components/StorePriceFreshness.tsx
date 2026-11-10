"use client";

import { useEffect } from "react";

/** یک بار در هر نیم‌ساعت، قیمت یک تا دو کالای قدیمی را از مرجع بازار تازه می‌کند. */
const STORAGE_KEY = "optibidPriceTickAt";
const THROTTLE_MS = 30 * 60 * 1000;

export default function StorePriceFreshness() {
  useEffect(() => {
    try {
      const last = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
      if (Number.isFinite(last) && Date.now() - last < THROTTLE_MS) return;
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // دسترسی به storage همیشه ممکن نیست؛ در این حالت تیک سرور خودش قفل دارد.
    }
    const timer = window.setTimeout(() => {
      void fetch("/api/store/price-refresh-tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        keepalive: true,
      }).catch(() => undefined);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
