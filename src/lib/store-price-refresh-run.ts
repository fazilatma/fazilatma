import type { JsonStoreProduct, OptiBidJsonData } from "@/lib/json-store";
import {
  computerPartSourceMultiplierForProduct,
  normalizeImportSourceUrl,
  parseComputerPartSourceEntries,
  productBelongsToImportSource,
  productUrlForImportSource,
} from "@/lib/source-link-parser";
import {
  applyRefreshedPrice,
  chooseBestPriceCandidate,
  findProductPriceCandidates,
  type PriceReferenceKey,
} from "@/lib/store-price-refresh";

/**
 * اجرای یک بچ به‌روزرسانی قیمت روی دادهٔ بارگذاری‌شده.
 *
 * این هستهٔ مشترک هم توسط ربات دستی ادمین
 * (`/api/admin/store-products/refresh-prices`) و هم توسط به‌روزرسانی خودکار
 * روزانه (`/api/cron/refresh-prices`) استفاده می‌شود تا هر دو مسیر دقیقاً با
 * یک منطق قیمت بخوانند.
 *
 * تابع، شیء `data` را در حافظه تغییر می‌دهد؛ ذخیره‌سازی با `writeOptiBidData`
 * بر عهدهٔ فراخواننده است (وقتی `changed` برابر true باشد).
 */

export type StorePriceRefreshBatchOptions = {
  references: PriceReferenceKey[];
  maxProducts?: number;
  priceMultiplier?: number;
  onlyActive?: boolean;
  productIds?: string[];
  offset?: number;
  /** فقط کالاهای درون‌ریزی‌شده از این باکس لینک بررسی شوند. */
  sourceUrl?: string;
};

export type StorePriceRefreshBatchResult = {
  ok: boolean;
  /** وقتی productIds داده شده ولی هیچ محصول فعالی با آن‌ها پیدا نشده است. */
  emptySelection: boolean;
  changed: boolean;
  priceMultiplier: number;
  totalProducts: number;
  offset: number;
  nextOffset: number;
  hasMore: boolean;
  totalChecked: number;
  updated: number;
  unchanged: number;
  historyRecorded: number;
  notFound: number;
  failed: number;
  warnings: string[];
  results: Array<Record<string, unknown>>;
  message: string;
};

function normalizeMultiplier(value: unknown) {
  const number = Number(value || 1);
  if (!Number.isFinite(number) || number <= 0) return 1;
  return Math.max(0.1, Math.min(10, number));
}

function publicResult(product: JsonStoreProduct, status: string, message: string) {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    status,
    message,
  };
}

export async function runStorePriceRefreshBatch(
  data: OptiBidJsonData,
  options: StorePriceRefreshBatchOptions,
): Promise<StorePriceRefreshBatchResult> {
  const references = options.sourceUrl ? (["source"] as PriceReferenceKey[]) : options.references;
  const sourceLinkEntries = parseComputerPartSourceEntries(
    data.settings.storeComputerPartsSourceUrl,
  );
  const requestedSourceUrl = normalizeImportSourceUrl(options.sourceUrl);
  const sourceEntry = requestedSourceUrl
    ? sourceLinkEntries.find((entry) => normalizeImportSourceUrl(entry.url) === requestedSourceUrl)
    : undefined;
  // ضریب باکس لینک، ضریب نهایی همان محصول است؛ ضریب سراسری فرم‌های دیگر
  // روی آن ضرب نمی‌شود تا هنگام آپدیت، ضریب دوبار اعمال نشود.
  const multiplier = normalizeMultiplier(sourceEntry ? sourceEntry.priceMultiplier : options.priceMultiplier);
  const requestedMaxProducts = Math.max(1, Math.min(
    Number(options.maxProducts || 20),
    sourceEntry ? sourceEntry.maxProducts : Number.POSITIVE_INFINITY,
  ));
  const requestWeight = references.reduce((total, source) => {
    if (source === "torob" || source === "digikala") return total + 2;
    return total + 1;
  }, 0);
  const safeWorkerLimit = Math.max(1, Math.floor(36 / Math.max(1, requestWeight)));
  const maxProducts = Math.max(1, Math.min(20, safeWorkerLimit, requestedMaxProducts));
  const onlyActive = options.onlyActive !== false;
  const productIdFilter = Array.isArray(options.productIds)
    ? new Set(options.productIds.map(String))
    : null;
  const requestedOffset = productIdFilter
    ? 0
    : Math.max(0, Math.floor(Number(options.offset || 0)));

  const multiplierSettingChanged = !requestedSourceUrl &&
    Math.abs(Number(data.settings.storePriceMultiplier || 1) - multiplier) > 0.0001;
  if (!requestedSourceUrl) data.settings.storePriceMultiplier = multiplier;

  const matchingProducts = data.storeProducts
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => (onlyActive ? product.isActive !== false : true))
    .filter(({ product }) => !requestedSourceUrl || productBelongsToImportSource(product, requestedSourceUrl))
    .filter(({ product }) => !productIdFilter || productIdFilter.has(product.id));
  const offset = requestedOffset >= matchingProducts.length ? 0 : requestedOffset;
  const targetProducts = matchingProducts.slice(offset, offset + maxProducts);

  let updated = 0;
  let unchanged = 0;
  let historyRecorded = 0;
  let notFound = 0;
  let failed = 0;
  const results: Array<Record<string, unknown>> = [];
  const warnings: string[] = [];
  if (requestedMaxProducts > maxProducts) {
    warnings.push(
      `برای جلوگیری از خطای محدودیت منابع Cloudflare، به‌روزرسانی قیمت در هر بار به ${maxProducts.toLocaleString("fa-IR")} محصول محدود شد.`,
    );
  }

  for (const { product, index } of targetProducts) {
    try {
      const sourceProductUrl = requestedSourceUrl
        ? productUrlForImportSource(product, requestedSourceUrl)
        : "";
      const lookupProduct = sourceProductUrl
        ? { ...product, externalSourceUrl: sourceProductUrl }
        : product;
      const { candidates, errors } = await findProductPriceCandidates(lookupProduct, references);
      if (errors.length) warnings.push(`${product.title}: ${errors.slice(0, 3).join(" | ")}`);
      const best = chooseBestPriceCandidate(candidates);
      if (!best) {
        notFound += 1;
        results.push(publicResult(product, "not-found", "قیمت قابل اعتماد از منابع انتخابی پیدا نشد."));
        continue;
      }

      const sourceFactor = requestedSourceUrl
        ? 1
        : computerPartSourceMultiplierForProduct(product, sourceLinkEntries);
      const effectiveCandidate =
        sourceFactor !== 1
          ? { ...best, price: Math.max(0, Math.round(best.price * sourceFactor)) }
          : best;
      const nextProduct = applyRefreshedPrice(product, effectiveCandidate, multiplier);
      const oldPrice = Number(product.price || 0);
      const newPrice = Number(nextProduct.price || 0);
      const changeRatio = oldPrice ? Math.abs(newPrice - oldPrice) / oldPrice : 1;

      if (changeRatio < 0.005) {
        data.storeProducts[index] = nextProduct;
        historyRecorded += 1;
        unchanged += 1;
        results.push({
          ...publicResult(product, "unchanged", "قیمت تغییر معناداری نداشت."),
          oldPrice,
          newPrice,
          source: best.source,
          sourceUrl: best.url,
          candidateTitle: best.title,
        });
        continue;
      }

      data.storeProducts[index] = nextProduct;
      updated += 1;
      results.push({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        oldPrice,
        newPrice,
        source: best.source,
        sourceUrl: best.url,
        candidateTitle: best.title,
        status: "updated",
        message: "قیمت به‌روزرسانی شد.",
      });
    } catch (error) {
      failed += 1;
      results.push(
        publicResult(product, "failed", error instanceof Error ? error.message : "خطای نامشخص"),
      );
    }
  }

  const hasMore = offset + targetProducts.length < matchingProducts.length;
  return {
    ok: true,
    emptySelection: Boolean((productIdFilter || requestedSourceUrl) && targetProducts.length === 0),
    changed: updated > 0 || historyRecorded > 0 || multiplierSettingChanged,
    priceMultiplier: multiplier,
    totalProducts: matchingProducts.length,
    offset,
    nextOffset: hasMore ? offset + targetProducts.length : 0,
    hasMore,
    totalChecked: targetProducts.length,
    updated,
    unchanged,
    historyRecorded,
    notFound,
    failed,
    warnings: warnings.slice(0, 20),
    results,
    message: `${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد، ${unchanged.toLocaleString("fa-IR")} محصول بدون تغییر ماند و برای ${notFound.toLocaleString("fa-IR")} محصول قیمت قابل اعتماد پیدا نشد.`,
  };
}
