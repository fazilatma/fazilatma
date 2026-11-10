import { NextResponse } from "next/server";
import { refreshStaleStorePrices } from "@/lib/store-price-refresh-run";
import { kvGetText, kvPutText } from "@/lib/kv-storage";

export const dynamic = "force-dynamic";

/**
 * «تازه‌سازی خزندهٔ قیمت».
 *
 * قیمت‌ها در Cloudflare Worker با زمان‌بند داخلی به‌روز نمی‌شوند، بنابراین
 * محصولاتی که مدت زیادی بررسی نشده‌اند با بازدید صفحات فروشگاه (حداکثر دو
 * کالا در هر اجرا و حداکثر یک اجرا در ۱۰ دقیقه) از مرجع بازار دوباره خوانده
 * می‌شوند تا قیمت فروشگاه از قیمت واقعی بازار عقب نماند.
 */
const LOCK_KEY = "optibid:price-tick-lock";
const LOCK_MINUTES = 10;
const MAX_PRODUCTS_PER_TICK = 2;
const STALE_HOURS = 6;

export async function POST(request: Request) {
  try {
    // فقط درخواست‌های هم‌مبدأ (از خود سایت) پذیرفته می‌شوند.
    const origin = request.headers.get("origin") || "";
    const host = request.headers.get("host") || "";
    if (origin && host && !origin.endsWith(host)) {
      return NextResponse.json({ success: false, message: "درخواست معتبر نیست." }, { status: 403 });
    }

    const lock = Number(await kvGetText(LOCK_KEY).catch(() => null) || 0);
    if (Number.isFinite(lock) && Date.now() - lock < LOCK_MINUTES * 60 * 1000) {
      return NextResponse.json({ success: true, skipped: true, reason: "locked" });
    }
    await kvPutText(LOCK_KEY, String(Date.now())).catch(() => undefined);

    const result = await refreshStaleStorePrices(MAX_PRODUCTS_PER_TICK, STALE_HOURS);
    return NextResponse.json({
      success: true,
      refreshed: result.updated,
      checked: result.checked,
      details: result.results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "تازه‌سازی قیمت ناموفق بود.",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
