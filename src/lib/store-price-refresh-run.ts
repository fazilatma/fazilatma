import {
  getOptiBidData,
  writeOptiBidData,
  type JsonStoreProduct,
} from "@/lib/json-store";
import {
  applyRefreshedPrice,
  chooseBestPriceCandidate,
  findProductPriceCandidates,
  normalizePriceReferences,
} from "@/lib/store-price-refresh";

export type StorePriceRefreshOptions = {
  references?: string[];
  maxProducts?: number;
  priceMultiplier?: number;
  onlyActive?: boolean;
  productIds?: string[];
  offset?: number;
  /** فقط محصولاتی که از این لینک مرجع وارد شده‌اند به‌روزرسانی شوند. */
  sourceUrl?: string;
  /**
   * در حالت به‌روزرسانی یک لینک مشخص، ضریب سراسری فروشگاه نباید تغییر کند.
   * پیش‌فرض: اگر sourceUrl داده شده باشد، ضریب سراسری دست‌نخورده می‌ماند.
   */
  updateGlobalMultiplier?: boolean;
};

export type StorePriceRefreshResult = {
  status: number;
  body: Record<string, unknown>;
};

function hostOf(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * تطبیق محصول با لینک مرجع:
 * ۱) اگر محصول `sourceLink` داشته باشد، همان لینک مقایسه می‌شود (دقیق‌ترین حالت).
 * ۲) در غیر این صورت دامنهٔ آدرس محصول با دامنهٔ لینک مقایسه می‌شود تا محصولات
 *    قدیمی‌تر هم قابل به‌روزرسانی باشند.
 */
export function productBelongsToSource(product: JsonStoreProduct, sourceUrl: string) {
  const prefix = sourceUrl.trim().toLowerCase().replace(/\/+$/, "");
  if (!prefix) return true;
  const linkHost = hostOf(sourceUrl);
  const candidates = [product.sourceLink, product.externalSourceUrl]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase());
  if (candidates.some((value) => value.replace(/\/+$/, "").startsWith(prefix))) {
    return true;
  }
  return Boolean(linkHost) && candidates.some((value) => hostOf(value) === linkHost);
}

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

/**
 * هستهٔ به‌روزرسانی قیمت. هم مسیر API پنل و هم ربات زمان‌بندی‌شدهٔ روزانه
 * از همین تابع استفاده می‌کنند تا رفتار یکسان بماند.
 */
export async function runStorePriceRefresh(
  options: StorePriceRefreshOptions,
): Promise<StorePriceRefreshResult> {
  try {
    const references = normalizePriceReferences(options.references);
    if (references.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "حداقل یک مرجع قیمت را انتخاب کنید.",
        },
      };
    }

    const multiplier = normalizeMultiplier(options.priceMultiplier);
    const requestedMaxProducts = Math.max(1, Number(options.maxProducts || 20));
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
    const requestedOffset = productIdFilter ? 0 : Math.max(0, Math.floor(Number(options.offset || 0)));
    const data = await getOptiBidData();
    const sourceUrl = String(options.sourceUrl || "").trim();
    const shouldUpdateGlobalMultiplier =
      typeof options.updateGlobalMultiplier === "boolean" ? options.updateGlobalMultiplier : !sourceUrl;
    const multiplierSettingChanged =
      shouldUpdateGlobalMultiplier &&
      Math.abs(Number(data.settings.storePriceMultiplier || 1) - multiplier) > 0.0001;
    if (shouldUpdateGlobalMultiplier) {
      data.settings.storePriceMultiplier = multiplier;
    }

    const matchingProducts = data.storeProducts
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => (onlyActive ? product.isActive !== false : true))
      .filter(({ product }) => !productIdFilter || productIdFilter.has(product.id))
      .filter(({ product }) => productBelongsToSource(product, sourceUrl));
    const offset = requestedOffset >= matchingProducts.length ? 0 : requestedOffset;
    const targetProducts = matchingProducts.slice(offset, offset + maxProducts);
    if (productIdFilter && targetProducts.length === 0) {
      return {
        status: 404,
        body: { success: false, message: "محصول انتخاب‌شده در فروشگاه فعال نیست یا پیدا نشد." },
      };
    }

    let updated = 0;
    let unchanged = 0;
    let historyRecorded = 0;
    let notFound = 0;
    let failed = 0;
    const results: Array<Record<string, unknown>> = [];
    const warnings: string[] = [];
    if (requestedMaxProducts > maxProducts) {
      warnings.push(
        `به‌روزرسانی قیمت در هر درخواست به ${maxProducts.toLocaleString("fa-IR")} محصول محدود شد؛ ربات به‌صورت مرحله‌ای تا سقف تعیین‌شده ادامه می‌دهد.`,
      );
    }

    for (const { product, index } of targetProducts) {
      try {
        const { candidates, errors } = await findProductPriceCandidates(product, references);
        if (errors.length) warnings.push(`${product.title}: ${errors.slice(0, 3).join(" | ")}`);
        const best = chooseBestPriceCandidate(candidates);
        if (!best) {
          notFound += 1;
          results.push(publicResult(product, "not-found", "قیمت قابل اعتماد از منابع انتخابی پیدا نشد."));
          continue;
        }

        const nextProduct = applyRefreshedPrice(product, best, multiplier);
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
        results.push(publicResult(product, "failed", error instanceof Error ? error.message : "خطای نامشخص"));
      }
    }

    if (updated > 0 || historyRecorded > 0 || multiplierSettingChanged) {
      await writeOptiBidData(data);
    }

    return {
      status: 200,
      body: {
        success: true,
        references,
        sourceUrl,
        priceMultiplier: multiplier,
        totalProducts: matchingProducts.length,
        offset,
        nextOffset:
          offset + targetProducts.length >= matchingProducts.length
            ? 0
            : offset + targetProducts.length,
        hasMore: offset + targetProducts.length < matchingProducts.length,
        totalChecked: targetProducts.length,
        updated,
        unchanged,
        historyRecorded,
        notFound,
        failed,
        warnings: warnings.slice(0, 20),
        results,
        message: `${updated.toLocaleString("fa-IR")} محصول به‌روزرسانی شد، ${unchanged.toLocaleString("fa-IR")} محصول بدون تغییر ماند و برای ${notFound.toLocaleString("fa-IR")} محصول قیمت قابل اعتماد پیدا نشد.`,
      },
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown price refresh error";
    return {
      status: 500,
      body: {
        success: false,
        message: "به‌روزرسانی قیمت‌ها ناموفق بود.",
        detail,
      },
    };
  }
}

/**
 * کهنه‌ترین قیمت‌های فروشگاه را دوباره از مرجع بازار می‌خواند.
 *
 * در Cloudflare Worker هیچ زمان‌بند داخلی اجرا نمی‌شود؛ این تابع هم از مسیر
 * کرون (`/api/store-products/auto-refresh`) و هم از تیک سبک فروشگاه
 * (`/api/store/price-refresh-tick`) صدا زده می‌شود تا قیمت‌ها عقب نمانند.
 */
export async function refreshStaleStorePrices(limit = 2, staleHours = 6) {
  const data = await getOptiBidData();
  const threshold = Date.now() - Math.max(1, staleHours) * 60 * 60 * 1000;
  const timestampOf = (product: JsonStoreProduct) => {
    const parsed = Date.parse(product.priceVerifiedAt || product.priceUpdatedAt || "");
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const stale = data.storeProducts
    .filter((product) => product.isActive !== false && Number(product.stock || 0) > 0)
    .filter((product) => timestampOf(product) < threshold)
    .sort((a, b) => timestampOf(a) - timestampOf(b))
    .slice(0, Math.max(1, Math.min(6, limit)));

  if (!stale.length) return { checked: 0, updated: 0, results: [] as unknown[] };

  const result = await runStorePriceRefresh({
    productIds: stale.map((product) => product.id),
    references: ["torob", "digikala"],
    maxProducts: stale.length,
    onlyActive: true,
    updateGlobalMultiplier: false,
  });

  return {
    checked: stale.length,
    updated: Number(result.body?.updated || 0),
    results: (result.body?.results || []) as unknown[],
    message: result.body?.message,
  };
}
