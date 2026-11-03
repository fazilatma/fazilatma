import { NextResponse } from "next/server";
import { getOptiBidData, writeOptiBidData, type StoreSourcePriceRefreshState } from "@/lib/json-store";
import { normalizeImportSourceUrl, parseComputerPartSourceEntries } from "@/lib/source-link-parser";
import { runStorePriceRefreshBatch } from "@/lib/store-price-refresh-run";

export const dynamic = "force-dynamic";

/**
 * به‌روزرسانی خودکار روزانه، به تفکیک باکس‌های لینک.
 * هر لینک فقط کالاهاي درون‌ریزی‌شده از خودش را با ضریب و سقف همان لینک
 * به‌روزرسانی می‌کند. وضعیت چرخهٔ هر لینک جدا نگه داشته می‌شود تا سقف یک لینک
 * روی لینک دیگر اثر نگذارد. پردازش در بچ‌های کوچک انجام می‌شود.
 */

const MAX_BATCHES_PER_CALL = 10;
const SOFT_TIME_BUDGET_MS = 55_000;

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

async function handle(request: Request) {
  const startedAt = Date.now();

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, message: "به‌روزرسانی خودکار پیکربندی نشده است (CRON_SECRET تنظیم نشده)." },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, message: "دسترسی غیرمجاز." }, { status: 401 });
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
        message: "به‌روزرسانی خودکار روزانه غیرفعال است.",
      });
    }

    const sources = parseComputerPartSourceEntries(settings.storeComputerPartsSourceUrl)
      .filter((entry) => normalizeImportSourceUrl(entry.url));
    if (!sources.length) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "no-source-links",
        dailyDone: true,
        hasMore: false,
        message: "هیچ لینک منبعی برای به‌روزرسانی خودکار ثبت نشده است.",
      });
    }

    const todayKey = tehranTodayKey();
    const previousState = settings.storeSourcePriceRefreshState || {};
    const state: Record<string, StoreSourcePriceRefreshState> = {};
    for (const source of sources) {
      const key = normalizeImportSourceUrl(source.url);
      const previous = previousState[key];
      state[key] = force || !previous || previous.date !== todayKey
        ? { date: todayKey, checked: 0, offset: 0, done: false }
        : { ...previous };
    }

    const dailyLimit = sources.reduce((total, source) => total + source.maxProducts, 0);
    let batchesLeft = batches;
    let totalChecked = 0;
    let updated = 0;
    let unchanged = 0;
    let notFound = 0;
    let failed = 0;
    let executedBatches = 0;
    const warnings: string[] = [];

    for (const source of sources) {
      const key = normalizeImportSourceUrl(source.url);
      const current = state[key];
      if (current.done || current.checked >= source.maxProducts) continue;

      while (batchesLeft > 0 && !current.done && current.checked < source.maxProducts) {
        if (executedBatches > 0 && Date.now() - startedAt > SOFT_TIME_BUDGET_MS) break;
        const remaining = source.maxProducts - current.checked;
        const batchMax = Math.max(1, Math.min(20, remaining));
        const result = await runStorePriceRefreshBatch(data, {
          references: ["source"],
          sourceUrl: source.url,
          maxProducts: batchMax,
          onlyActive: true,
          offset: current.offset,
        });
        batchesLeft -= 1;
        executedBatches += 1;
        totalChecked += result.totalChecked;
        updated += result.updated;
        unchanged += result.unchanged;
        notFound += result.notFound;
        failed += result.failed;
        warnings.push(...result.warnings);
        current.checked += result.totalChecked;
        current.offset = result.nextOffset;
        if (result.emptySelection || !result.hasMore || result.totalChecked === 0 || current.checked >= source.maxProducts) {
          current.done = true;
        }
      }
      if (batchesLeft === 0 || Date.now() - startedAt > SOFT_TIME_BUDGET_MS) break;
    }

    const dailyChecked = Object.values(state).reduce((total, item) => total + item.checked, 0);
    const dailyDone = sources.every((source) => state[normalizeImportSourceUrl(source.url)]?.done);
    const completedAt = new Date().toISOString();
    const summary = `${totalChecked.toLocaleString("fa-IR")} محصول از لینک‌های ثبت‌شده بررسی شد؛ ` +
      `${updated.toLocaleString("fa-IR")} تغییر قیمت، ${unchanged.toLocaleString("fa-IR")} بدون تغییر، ` +
      `${notFound.toLocaleString("fa-IR")} بدون قیمت معتبر و ${failed.toLocaleString("fa-IR")} خطا. ` +
      `پیشرفت امروز: ${dailyChecked.toLocaleString("fa-IR")} از ${dailyLimit.toLocaleString("fa-IR")} محصول` +
      (dailyDone ? " (چرخهٔ همهٔ لینک‌ها کامل شد)." : ".");

    settings.storeSourcePriceRefreshState = state;
    settings.storeAutoPriceRefreshOffset = 0;
    settings.storeAutoPriceRefreshLastRunAt = completedAt;
    settings.storeAutoPriceRefreshLastSummary = summary;
    settings.storeAutoPriceRefreshTotalRuns = Math.max(0, Number(settings.storeAutoPriceRefreshTotalRuns || 0)) + 1;
    settings.storeAutoPriceRefreshDailyLimit = dailyLimit;
    settings.storeAutoPriceRefreshDailyDate = todayKey;
    settings.storeAutoPriceRefreshDailyChecked = dailyChecked;
    settings.storeAutoPriceRefreshDailyCycleDone = dailyDone;
    await writeOptiBidData(data);

    return NextResponse.json({
      success: true,
      auto: true,
      perSource: true,
      batches: executedBatches,
      totalChecked,
      updated,
      unchanged,
      notFound,
      failed,
      hasMore: !dailyDone,
      dailyDate: todayKey,
      dailyChecked,
      dailyLimit,
      dailyRemaining: Math.max(0, dailyLimit - dailyChecked),
      dailyDone,
      sources: sources.map((source) => {
        const key = normalizeImportSourceUrl(source.url);
        return {
          sourceUrl: source.url,
          maxProducts: source.maxProducts,
          priceMultiplier: source.priceMultiplier,
          ...state[key],
        };
      }),
      durationMs: Date.now() - startedAt,
      warnings: [...new Set(warnings)].slice(0, 20),
      message: summary,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown automatic price refresh error";
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
