import { NextResponse } from "next/server";
import { getOptiBidData, writeOptiBidData } from "@/lib/json-store";
import { normalizePriceReferences } from "@/lib/store-price-refresh";
import { runStorePriceRefreshBatch } from "@/lib/store-price-refresh-run";

export const dynamic = "force-dynamic";

/**
 * به‌روزرسانی خودکار قیمت محصولات فروشگاه از لینک منبع درون‌ریزی
 * و مراجع انتخاب‌شده در ادمین، تا «سقف شبانه‌روزی» تعیین‌شده در پنل
 * («حداکثر محصول در هر شبانه‌روز» — تا ۱۰٬۰۰۰ محصول).
 *
 * هر فراخوانی فقط چند بچ فنی کوچک اجرا می‌کند (محدودیت منابع Cloudflare)،
 * اما زمان‌بند هر چند دقیقه دوباره صدا می‌زند و اجرا از ادامهٔ چرخه پیش
 * می‌رود تا یا چرخهٔ کامل کاتالوگ تمام شود یا سقف آن روز پر شود. شمارندهٔ
 * پیشرفت روز (تاریخ تهران، تعداد بررسی‌شده و اتمام چرخه) در تنظیمات ذخیره
 * می‌شود؛ با شروع روز تازه (نیمه‌شب تهران) شمارنده صفر و چرخه از ابتدا
 * آغاز می‌شود.
 *
 * فراخوانی‌کننده‌ها:
 * - زمان‌بند Cloudflare Cron در `worker.ts` (هر ۱۰ دقیقه)
 * - زمان‌بند GitHub Actions (فایل آماده: `docs/workflows/daily-price-refresh.yml`)
 * - یا هر سرویس کرون خارجی
 *
 * امنیت: مقدار محرمانهٔ محیطی `CRON_SECRET` باید با هدر
 * `Authorization: Bearer <secret>` یا `x-cron-secret` ارسال شود.
 * اگر این متغیر تنظیم نشده باشد، اندپوینت کاملاً غیرفعال است.
 *
 * پارامترهای اختیاری: `batches` (۱ تا ۱۰ بچ پشت‌سرهم در یک فراخوانی) و
 * `force=1` برای اجرا حتی وقتی کلید فعال‌سازی خاموش است یا سقف روز پر
 * شده است (تست دستی). پیشرفت روز و خلاصهٔ آخرین اجرا در پنل ادمین
 * (ربات به‌روزرسانی قیمت) نمایش داده می‌شود.
 */

const MAX_BATCHES_PER_CALL = 10;
const SOFT_TIME_BUDGET_MS = 55_000;
const MAX_DAILY_LIMIT = 10000;

let runInProgress = false;

function secretsMatch(expected: string, provided: string) {
  if (!expected || !provided || expected.length !== provided.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
  }
  return diff === 0;
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const headerSecret = request.headers.get("x-cron-secret") || "";
  return secretsMatch(secret, bearer) || secretsMatch(secret, headerSecret);
}

/** تاریخ امروز به وقت تهران با قالب YYYY-MM-DD؛ مرز «روز» برای سقف روزانه. */
function tehranTodayKey() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function normalizeDailyLimit(value: unknown) {
  const number = Math.round(Number(value || MAX_DAILY_LIMIT));
  if (!Number.isFinite(number) || number <= 0) return MAX_DAILY_LIMIT;
  return Math.max(1, Math.min(MAX_DAILY_LIMIT, number));
}

async function handle(request: Request) {
  const startedAt = Date.now();

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      {
        success: false,
        message: "به‌روزرسانی خودکار پیکربندی نشده است (CRON_SECRET تنظیم نشده).",
      },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "دسترسی غیرمجاز." },
      { status: 401 },
    );
  }
  if (runInProgress) {
    return NextResponse.json(
      { success: false, message: "یک اجرای خودکار دیگر در حال انجام است." },
      { status: 409 },
    );
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const batches = Math.max(
    1,
    Math.min(MAX_BATCHES_PER_CALL, Math.floor(Number(url.searchParams.get("batches") || 1)) || 1),
  );

  runInProgress = true;
  try {
    const data = await getOptiBidData();
    const settings = data.settings;

    if (!settings.storeAutoPriceRefreshEnabled && !force) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "به‌روزرسانی خودکار روزانه در تنظیمات ادمین غیرفعال است.",
      });
    }

    // ــ بودجهٔ شبانه‌روزی ──────────────────────────────────────────────
    const dailyLimit = normalizeDailyLimit(settings.storeAutoPriceRefreshDailyLimit);
    const todayKey = tehranTodayKey();
    const isNewDay = String(settings.storeAutoPriceRefreshDailyDate || "") !== todayKey;
    const dailyCheckedBefore = isNewDay
      ? 0
      : Math.max(0, Math.floor(Number(settings.storeAutoPriceRefreshDailyChecked || 0)));
    const dailyCycleDoneBefore = isNewDay
      ? false
      : settings.storeAutoPriceRefreshDailyCycleDone === true;

    if (!force && (dailyCycleDoneBefore || dailyCheckedBefore >= dailyLimit)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: dailyCycleDoneBefore ? "daily-cycle-complete" : "daily-limit-reached",
        dailyDate: todayKey,
        dailyChecked: dailyCheckedBefore,
        dailyLimit,
        dailyDone: true,
        hasMore: false,
        message: dailyCycleDoneBefore
          ? "چرخهٔ کامل محصولات برای امروز به پایان رسیده است؛ فردا از ابتدا شروع می‌شود."
          : `سقف شبانه‌روزی به‌روزرسانی خودکار (${dailyLimit.toLocaleString("fa-IR")} محصول) برای امروز پر شده است.`,
      });
    }

    const remainingToday = force
      ? Number.POSITIVE_INFINITY
      : Math.max(0, dailyLimit - dailyCheckedBefore);

    const references = normalizePriceReferences(settings.storeAutoPriceRefreshReferences);
    const effectiveReferences = references.length
      ? references
      : (["source", "torob", "digikala"] as const).slice();
    const batchSize = Math.max(1, Math.min(20, Number(settings.storeAutoPriceRefreshBatchSize || 20)));

    // روز تازه: چرخه از ابتدای فهرست شروع می‌شود تا همهٔ محصولات پوشش داده شوند.
    let cursor = isNewDay
      ? 0
      : Math.max(0, Math.floor(Number(settings.storeAutoPriceRefreshOffset || 0)));
    let totalProducts = 0;
    let totalChecked = 0;
    let updated = 0;
    let unchanged = 0;
    let notFound = 0;
    let failed = 0;
    let hasMore = false;
    let executedBatches = 0;
    const warnings: string[] = [];

    for (let batchIndex = 0; batchIndex < batches; batchIndex += 1) {
      if (batchIndex > 0 && Date.now() - startedAt > SOFT_TIME_BUDGET_MS) break;
      if (totalChecked >= remainingToday) break;
      const batchMax = Number.isFinite(remainingToday)
        ? Math.max(1, Math.min(batchSize, remainingToday - totalChecked))
        : batchSize;
      const result = await runStorePriceRefreshBatch(data, {
        references: effectiveReferences,
        maxProducts: batchMax,
        priceMultiplier: data.settings.storePriceMultiplier,
        onlyActive: true,
        offset: cursor,
      });
      executedBatches += 1;
      totalProducts = result.totalProducts;
      totalChecked += result.totalChecked;
      updated += result.updated;
      unchanged += result.unchanged;
      notFound += result.notFound;
      failed += result.failed;
      warnings.push(...result.warnings);
      cursor = result.nextOffset;
      hasMore = result.hasMore;
      if (!hasMore || result.totalChecked === 0) break;
    }

    const dailyCheckedAfter = dailyCheckedBefore + totalChecked;
    const dailyCycleDone = dailyCycleDoneBefore || !hasMore;
    const dailyLimitReached = dailyCheckedAfter >= dailyLimit;
    const dailyDone = dailyCycleDone || dailyLimitReached;

    const completedAt = new Date().toISOString();
    const summary =
      totalProducts === 0
        ? "محصول فعالی برای به‌روزرسانی وجود نداشت."
        : `${totalChecked.toLocaleString("fa-IR")} محصول از ${totalProducts.toLocaleString("fa-IR")} بررسی شد؛ ` +
          `${updated.toLocaleString("fa-IR")} قیمت تغییر کرد، ${unchanged.toLocaleString("fa-IR")} بدون تغییر ماند، ` +
          `برای ${notFound.toLocaleString("fa-IR")} قیمت معتبر پیدا نشد و ${failed.toLocaleString("fa-IR")} خطا داشت.` +
          (hasMore
            ? ` چرخه در اجرای بعدی از محصول ${(cursor + 1).toLocaleString("fa-IR")} ادامه می‌یابد.`
            : " چرخهٔ کامل محصولات به پایان رسید.") +
          ` پیشرفت امروز: ${dailyCheckedAfter.toLocaleString("fa-IR")} از ${dailyLimit.toLocaleString("fa-IR")} محصول` +
          (dailyCycleDone
            ? " (چرخهٔ امروز کامل شد)."
            : dailyLimitReached
              ? " (سقف امروز پر شد)."
              : ".");

    data.settings.storeAutoPriceRefreshOffset = cursor;
    data.settings.storeAutoPriceRefreshLastRunAt = completedAt;
    data.settings.storeAutoPriceRefreshLastSummary = summary;
    data.settings.storeAutoPriceRefreshTotalRuns =
      Math.max(0, Number(data.settings.storeAutoPriceRefreshTotalRuns || 0)) + 1;
    data.settings.storeAutoPriceRefreshDailyLimit = dailyLimit;
    data.settings.storeAutoPriceRefreshDailyDate = todayKey;
    data.settings.storeAutoPriceRefreshDailyChecked = dailyCheckedAfter;
    data.settings.storeAutoPriceRefreshDailyCycleDone = dailyCycleDone;
    // وضعیت پیشرفت چرخه و روز همیشه ذخیره می‌شود تا اجرای بعدی از ادامهٔ فهرست باشد.
    await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      auto: true,
      references: effectiveReferences,
      batches: executedBatches,
      totalProducts,
      totalChecked,
      updated,
      unchanged,
      notFound,
      failed,
      hasMore,
      nextOffset: cursor,
      dailyDate: todayKey,
      dailyChecked: dailyCheckedAfter,
      dailyLimit,
      dailyRemaining: Math.max(0, dailyLimit - dailyCheckedAfter),
      dailyDone,
      durationMs: Date.now() - startedAt,
      warnings: [...new Set(warnings)].slice(0, 20),
      message: summary,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown automatic price refresh error";
    return NextResponse.json(
      { success: false, message: "به‌روزرسانی خودکار قیمت‌ها ناموفق بود.", detail },
      { status: 500 },
    );
  } finally {
    runInProgress = false;
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
