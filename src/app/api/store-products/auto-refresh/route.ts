import { NextResponse, type NextRequest } from "next/server";
import { runDueSourceAutoRefreshes } from "@/lib/store-source-auto-refresh";
import { refreshStaleStorePrices } from "@/lib/store-price-refresh-run";

export const dynamic = "force-dynamic";

function extractToken(request: NextRequest) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("token") || url.searchParams.get("secret") || "";
  if (fromQuery) return fromQuery.trim();
  const authorization = request.headers.get("authorization") || "";
  return authorization.replace(/^Bearer\s+/i, "").trim();
}

function isAdminRequest(request: NextRequest) {
  if (request.cookies.get("optibid_admin")?.value === "1") return true;
  if (request.headers.get("x-optibid-preview-admin") === "1") return true;
  return Boolean(request.headers.get("x-optibid-admin-token"));
}

/**
 * اجرای ربات به‌روزرسانی روزانهٔ قیمت لینک‌ها.
 *
 * این مسیر عمداً عمومی است تا سرویس‌های زمان‌بند (cron-job.org، Cloudflare
 * Cron Trigger، Liara …) بتوانند با توکن `CRON_SECRET` آن را صدا بزنند.
 * پنل مدیریت هم با کوکی ادمین همین مسیر را برای «جبران عقب‌ماندگی» صدا می‌زند.
 */
async function handle(request: NextRequest) {
  const token = extractToken(request);
  const secret = (process.env.CRON_SECRET || process.env.OPTIBID_CRON_SECRET || "").trim();
  const authorized = (secret && token && token === secret) || isAdminRequest(request);
  if (!authorized) {
    return NextResponse.json(
      { success: false, message: "توکن اجرای ربات نامعتبر است." },
      { status: 401 },
    );
  }

  try {
    const result = await runDueSourceAutoRefreshes();
    // محصولاتی که از لینک مرجع نیامده‌اند هم باید قیمت‌شان تازه بماند.
    const stale = await refreshStaleStorePrices(3, 12).catch(() => null);
    return NextResponse.json({ success: true, ...result, staleProducts: stale });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "اجرای ربات به‌روزرسانی روزانه ناموفق بود.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
